from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, Iterator, List, Optional, Sequence, Set

from src.parser import AnimeParser

VIDEO_EXTS = (".mkv", ".mp4", ".avi")


def normalize_anime_title(title: Optional[str]) -> str:
    if not title:
        return ""
    cleaned = "".join(ch if ch.isalnum() else " " for ch in str(title).replace("'", ""))
    return re.sub(r"\s+", " ", cleaned).strip().lower()


def normalize_title(title: Optional[str]) -> str:
    return normalize_anime_title(title)


def sanitize_folder_name(title: Optional[str], fallback: str = "Downloads") -> str:
    if not title:
        return fallback
    safe = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", str(title))
    safe = re.sub(r"\s+", " ", safe).strip(" .")
    return safe or fallback


def parse_media_title(entry: Optional[Dict[str, Any]]) -> str:
    if not isinstance(entry, dict):
        return ""
    title = entry.get("title") or {}
    if not isinstance(title, dict):
        return ""
    return title.get("romaji") or title.get("english") or title.get("native") or ""


def _entry_titles(entry: Dict[str, Any]) -> List[str]:
    if not isinstance(entry, dict):
        return []
    title = entry.get("title") or {}
    if not isinstance(title, dict):
        return []
    return [value for value in [title.get("romaji"), title.get("english"), title.get("native")] if value]


def _parse_episode_value(parsed: Optional[Dict[str, Any]]) -> Optional[int]:
    if not parsed:
        return None
    episode = parsed.get("episode")
    if isinstance(episode, list):
        episode = episode[-1]
    if episode is None:
        return None
    try:
        return int(episode)
    except (TypeError, ValueError):
        return None


def _entry_media_id(entry: Dict[str, Any]) -> Optional[int]:
    media_id = entry.get("mediaId")
    if isinstance(media_id, int):
        return media_id
    if isinstance(media_id, str):
        try:
            return int(media_id)
        except (TypeError, ValueError):
            return None
    return None


def _build_entry_lookups(
    anilist_entries: Iterable[Dict[str, Any]],
    title_overrides: Optional[Dict[str, str]] = None,
) -> tuple[Dict[int, Dict[str, Any]], Dict[str, Dict[str, Any]], Dict[str, int]]:
    by_media_id: Dict[int, Dict[str, Any]] = {}
    by_title: Dict[str, Dict[str, Any]] = {}
    override_to_media_id: Dict[str, int] = {}

    entries = [entry for entry in anilist_entries if isinstance(entry, dict)]
    for entry in entries:
        media_id = _entry_media_id(entry)
        if media_id is not None:
            by_media_id[media_id] = entry

        for title in _entry_titles(entry):
            title_key = normalize_anime_title(title)
            if title_key and title_key not in by_title:
                by_title[title_key] = entry

    for media_id_str, custom_title in (title_overrides or {}).items():
        try:
            media_id = int(media_id_str)
        except (TypeError, ValueError):
            continue

        normalized = normalize_anime_title(custom_title)
        if not normalized:
            continue

        override_to_media_id[normalized] = media_id
        entry = by_media_id.get(media_id)
        if entry and normalized not in by_title:
            by_title[normalized] = entry

    return by_media_id, by_title, override_to_media_id


def collect_existing_episodes(media_dir: str) -> Set[int]:
    episodes: Set[int] = set()
    if not media_dir or not os.path.exists(media_dir):
        return episodes

    for root, _dirs, files in os.walk(media_dir):
        for filename in files:
            if not filename.lower().endswith(VIDEO_EXTS):
                continue
            try:
                parsed = AnimeParser.parse_filename(filename)
            except Exception:
                parsed = None
            ep = _parse_episode_value(parsed)
            if ep is not None:
                episodes.add(ep)
    return episodes


def resolve_media_entry(
    media_id: Optional[int],
    title: Optional[str],
    *,
    anilist_entries: Iterable[Dict[str, Any]],
    title_overrides: Optional[Dict[str, str]] = None,
) -> Optional[Dict[str, Any]]:
    entries = [entry for entry in anilist_entries if isinstance(entry, dict)]
    by_media_id, by_title, override_to_media_id = _build_entry_lookups(entries, title_overrides)

    if media_id is not None:
        try:
            mid = int(media_id)
        except (TypeError, ValueError):
            mid = None
        if mid is not None and mid in by_media_id:
            return by_media_id[mid]

    normalized_title = normalize_anime_title(title)
    if not normalized_title:
        return None

    override_media_id = override_to_media_id.get(normalized_title)
    if override_media_id is not None and override_media_id in by_media_id:
        return by_media_id[override_media_id]

    if normalized_title in by_title:
        return by_title[normalized_title]

    for entry in entries:
        for candidate in _entry_titles(entry):
            if normalize_anime_title(candidate) == normalized_title:
                return entry
    return None


def _path_is_excluded(path: str, exclusions: Set[str]) -> bool:
    if not exclusions:
        return False

    candidate = os.path.abspath(os.path.normpath(path))
    for exclusion in exclusions:
        normalized = os.path.abspath(os.path.normpath(exclusion))
        try:
            if os.path.commonpath([candidate, normalized]) == normalized:
                return True
        except ValueError:
            continue
    return False


def _walk_nodes(nodes: Iterable[Dict[str, Any]]) -> Iterator[Dict[str, Any]]:
    for node in nodes:
        yield node
        if node.get("type") == "directory":
            yield from _walk_nodes(node.get("children", []) or [])


def scan_library_tree(
    base_dir: str,
    exclusions: Optional[Iterable[str]] = None,
    *,
    anilist_entries: Optional[Iterable[Dict[str, Any]]] = None,
    title_overrides: Optional[Dict[str, str]] = None,
) -> List[Dict[str, Any]]:
    if not base_dir or not os.path.exists(base_dir):
        return []

    exclusion_set = {os.path.abspath(os.path.normpath(path)) for path in (exclusions or []) if path}
    entries = [entry for entry in (anilist_entries or []) if isinstance(entry, dict)]
    by_media_id, by_title, override_to_media_id = _build_entry_lookups(entries, title_overrides)

    def match_entry(candidate_title: str, media_id_hint: Optional[int] = None) -> Optional[Dict[str, Any]]:
        if media_id_hint is not None and media_id_hint in by_media_id:
            return by_media_id[media_id_hint]

        normalized = normalize_anime_title(candidate_title)
        if not normalized:
            return None

        override_media_id = override_to_media_id.get(normalized)
        if override_media_id is not None and override_media_id in by_media_id:
            return by_media_id[override_media_id]

        if normalized in by_title:
            return by_title[normalized]

        for entry in entries:
            for candidate in _entry_titles(entry):
                if normalize_anime_title(candidate) == normalized:
                    return entry
        return None

    def scan_node(node_path: str) -> Optional[Dict[str, Any]]:
        if _path_is_excluded(node_path, exclusion_set):
            return None

        name = os.path.basename(node_path)
        if not name or name.startswith("."):
            return None

        is_dir = os.path.isdir(node_path)
        is_file = os.path.isfile(node_path) and name.lower().endswith(VIDEO_EXTS)
        if not is_dir and not is_file:
            return None

        try:
            size = os.path.getsize(node_path)
        except OSError:
            return None

        parsed = None
        try:
            parsed = AnimeParser.parse_filename(name)
        except Exception:
            parsed = None

        if is_dir and not (parsed and parsed.get("title")):
            parsed = {"title": name}

        candidate_title = parsed.get("title") if isinstance(parsed, dict) else ""
        node: Dict[str, Any] = {
            "name": name,
            "type": "directory" if is_dir else "file",
            "path": node_path,
            "size": size,
            "parsed": parsed,
        }

        matched = match_entry(candidate_title or name)
        if matched:
            node["mediaId"] = matched.get("mediaId")
            node["listStatus"] = matched.get("listStatus")
            node["progress"] = matched.get("progress") or 0

        if is_file:
            episode = _parse_episode_value(parsed)
            if episode is not None:
                node["episode"] = episode

        if is_dir:
            children: List[Dict[str, Any]] = []
            try:
                for item in sorted(os.listdir(node_path)):
                    child = scan_node(os.path.join(node_path, item))
                    if child:
                        children.append(child)
            except OSError:
                pass

            node["children"] = children
            if children:
                node["size"] = sum(child.get("size", 0) for child in children)
                node["localEpisodeCount"] = sum(
                    1
                    for child in _walk_nodes(children)
                    if child.get("type") == "file" and child.get("episode") is not None
                )
            else:
                node["localEpisodeCount"] = 0

        return node

    tree: List[Dict[str, Any]] = []
    try:
        for item in sorted(os.listdir(base_dir)):
            node = scan_node(os.path.join(base_dir, item))
            if node:
                tree.append(node)
    except OSError:
        return []
    return tree


@dataclass
class LibraryIndex:
    base_dir: str
    tree: List[Dict[str, Any]]
    anilist_entries: List[Dict[str, Any]] = field(default_factory=list)
    title_overrides: Dict[str, str] = field(default_factory=dict)
    by_media_id: Dict[int, Dict[str, Any]] = field(default_factory=dict)
    by_title: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    by_path: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    def iter_nodes(self) -> Iterator[Dict[str, Any]]:
        yield from _walk_nodes(self.tree)

    def iter_video_nodes(self) -> Iterator[Dict[str, Any]]:
        for node in self.iter_nodes():
            if node.get("type") == "file":
                yield node

    def resolve_entry(self, media_id: Optional[int] = None, title: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if media_id is not None:
            try:
                mid = int(media_id)
            except (TypeError, ValueError):
                mid = None
            if mid is not None and mid in self.by_media_id:
                return self.by_media_id[mid]

        normalized = normalize_anime_title(title)
        if not normalized:
            return None

        if normalized in self.by_title:
            return self.by_title[normalized]

        for entry in self.anilist_entries:
            for candidate in _entry_titles(entry):
                if normalize_anime_title(candidate) == normalized:
                    return entry
        return None

    def resolve_local_availability(
        self,
        settings: Any,
        media_id: Optional[int] = None,
        title: Optional[str] = None,
    ) -> Dict[str, Any]:
        entry = self.resolve_entry(media_id=media_id, title=title)
        resolved_media_id = media_id
        if resolved_media_id is None and entry is not None:
            resolved_media_id = _entry_media_id(entry)

        default_dir = getattr(settings, "default_download_dir", None)
        media_dir = ""
        if resolved_media_id is not None and settings and hasattr(settings, "get_media_folder"):
            try:
                media_dir = settings.get_media_folder(int(resolved_media_id))
            except Exception:
                media_dir = ""

        candidate_titles: List[str] = []
        if resolved_media_id is not None:
            override = self.title_overrides.get(str(resolved_media_id))
            if override:
                candidate_titles.append(override)
        if entry is not None:
            entry_title = parse_media_title(entry)
            if entry_title:
                candidate_titles.append(entry_title)
        if title:
            candidate_titles.append(title)

        if default_dir:
            if not media_dir or media_dir == default_dir:
                for candidate_title in candidate_titles:
                    candidate_dir = os.path.join(default_dir, sanitize_folder_name(candidate_title))
                    if os.path.exists(candidate_dir):
                        media_dir = candidate_dir
                        break
                if not media_dir:
                    media_dir = default_dir

        episode_numbers = collect_existing_episodes(media_dir)
        return {
            "entry": entry,
            "media_id": resolved_media_id,
            "media_dir": media_dir,
            "title": title or parse_media_title(entry),
            "episode_numbers": episode_numbers,
            "episode_count": len(episode_numbers),
        }


def build_library_index(
    base_dir: str,
    exclusions: Optional[Iterable[str]] = None,
    *,
    anilist_entries: Optional[Iterable[Dict[str, Any]]] = None,
    title_overrides: Optional[Dict[str, str]] = None,
) -> LibraryIndex:
    entries = [entry for entry in (anilist_entries or []) if isinstance(entry, dict)]
    tree = scan_library_tree(
        base_dir,
        exclusions,
        anilist_entries=entries,
        title_overrides=title_overrides,
    )

    by_media_id, by_title, _override_to_media_id = _build_entry_lookups(entries, title_overrides)
    by_path: Dict[str, Dict[str, Any]] = {}
    for node in _walk_nodes(tree):
        path = node.get("path")
        if isinstance(path, str):
            by_path[path] = node

    return LibraryIndex(
        base_dir=base_dir,
        tree=tree,
        anilist_entries=entries,
        title_overrides=dict(title_overrides or {}),
        by_media_id=by_media_id,
        by_title=by_title,
        by_path=by_path,
    )
