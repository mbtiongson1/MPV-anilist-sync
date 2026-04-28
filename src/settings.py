import json
import os
from typing import Dict, Any, List, Optional

class SettingsManager:
    def __init__(self, settings_file: str = "config.json"):
        self.settings_file = settings_file
        self.settings: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        return data
            except Exception as e:
                print(f"Error loading settings: {e}")
        return {}

    def save(self):
        try:
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=4)
        except Exception as e:
            print(f"Error saving settings: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self.settings.get(key, default)

    def set(self, key: str, value: Any):
        self.settings[key] = value
        self.save()

    @property
    def preferred_groups(self) -> List[str]:
        return self.get("preferred_groups", [])

    @preferred_groups.setter
    def preferred_groups(self, value: List[str]):
        self.set("preferred_groups", value)

    @property
    def preferred_resolution(self) -> str:
        return self.get("preferred_resolution", "1080p")

    @preferred_resolution.setter
    def preferred_resolution(self, value: str):
        self.set("preferred_resolution", value)

    @property
    def default_download_dir(self) -> str:
        return self.get("default_download_dir", os.path.join(os.path.expanduser("~"), "Downloads"))

    @default_download_dir.setter
    def default_download_dir(self, value: str):
        self.set("default_download_dir", value)

    @property
    def base_anime_folder(self) -> str:
        import sys
        if sys.platform == "win32":
            default_path = os.path.join(os.path.expanduser("~"), "Videos", "Anime")
        else:
            default_path = os.path.join(os.path.expanduser("~"), "Downloads")
        return self.get("base_anime_folder", default_path)

    @base_anime_folder.setter
    def base_anime_folder(self, value: str):
        self.set("base_anime_folder", value)

    @property
    def media_folders_map(self) -> Dict[str, str]:
        return self.get("media_folders_map", {})

    @property
    def title_overrides(self) -> Dict[str, str]:
        return self.get("title_overrides", {})

    def update_title_override(self, media_id: int, custom_title: str):
        mapping = self.title_overrides
        mapping[str(media_id)] = custom_title
        self.set("title_overrides", mapping)

    @property
    def library_exclusions(self) -> List[str]:
        return self.get("library_exclusions", [])

    def add_library_exclusion(self, path: str):
        exclusions = self.library_exclusions
        if path not in exclusions:
            exclusions.append(path)
            self.set("library_exclusions", exclusions)

    def remove_library_exclusion(self, path: str):
        exclusions = self.library_exclusions
        if path in exclusions:
            exclusions.remove(path)
            self.set("library_exclusions", exclusions)

    def update_media_folder(self, media_id: int, folder_path: str):
        mapping = self.media_folders_map
        mapping[str(media_id)] = folder_path
        self.set("media_folders_map", mapping)

    def get_media_folder(self, media_id: int) -> str:
        mapping = self.media_folders_map
        return mapping.get(str(media_id), self.default_download_dir)

    @property
    def last_played_file(self) -> Optional[str]:
        return self.get("last_played_file")

    @last_played_file.setter
    def last_played_file(self, value: str):
        self.set("last_played_file", value)

    @property
    def torrent_archive(self) -> List[Dict[str, Any]]:
        return self.get("torrent_archive", [])

    def set_torrent_archive(self, items: List[Dict[str, Any]]):
        self.set("torrent_archive", items)

    def add_torrent_archive(self, item: Dict[str, Any]):
        archive = self.torrent_archive
        key = item.get("link") or item.get("url") or item.get("title")
        if not key:
            return
        if not any((entry.get("link") or entry.get("url") or entry.get("title")) == key for entry in archive):
            archive.append(item)
            self.set_torrent_archive(archive)
