import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.library_index import (
    build_library_index,
    normalize_anime_title,
    sanitize_folder_name,
)


class FakeSettings:
    def __init__(self, default_download_dir: str, media_folders_map=None):
        self.default_download_dir = default_download_dir
        self._media_folders_map = {str(k): v for k, v in (media_folders_map or {}).items()}

    def get_media_folder(self, media_id: int) -> str:
        return self._media_folders_map.get(str(media_id), self.default_download_dir)


class TestLibraryIndex(unittest.TestCase):
    def test_normalize_title_strips_punctuation_and_lowercases(self):
        self.assertEqual(
            normalize_anime_title("  Frieren: Beyond Journey's End!!  "),
            "frieren beyond journeys end",
        )

    def test_sanitize_folder_name_removes_reserved_characters(self):
        self.assertEqual(
            sanitize_folder_name('Frieren: Beyond Journey\'s End / Special?*'),
            "Frieren Beyond Journey's End Special",
        )
        self.assertEqual(sanitize_folder_name("   "), "Downloads")

    def test_scan_nested_folders_and_loose_files_with_exclusions(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base_dir = Path(tmpdir) / "Anime"
            nested_dir = base_dir / "Frieren" / "Season 1"
            excluded_dir = base_dir / "Excluded"
            nested_dir.mkdir(parents=True)
            excluded_dir.mkdir(parents=True)

            (nested_dir / "[SubsPlease] Sousou no Frieren - 01 (1080p).mkv").write_text("1")
            (nested_dir / "[SubsPlease] Sousou no Frieren - 02 (1080p).mkv").write_text("2")
            (base_dir / "[SubsPlease] One Piece - 03 (1080p).mkv").write_text("3")
            (excluded_dir / "[SubsPlease] Sousou no Frieren - 99 (1080p).mkv").write_text("ignored")

            index = build_library_index(
                str(base_dir),
                exclusions=[str(excluded_dir)],
                anilist_entries=[
                    {
                        "mediaId": 1,
                        "title": {"romaji": "Sousou no Frieren", "english": "Frieren"},
                        "listStatus": "CURRENT",
                        "progress": 0,
                    },
                    {
                        "mediaId": 2,
                        "title": {"romaji": "One Piece", "english": "One Piece"},
                        "listStatus": "CURRENT",
                        "progress": 0,
                    },
                ],
            )

            self.assertEqual([node["name"] for node in index.tree], ["Frieren", "[SubsPlease] One Piece - 03 (1080p).mkv"])

            frieren_node = next(node for node in index.tree if node["name"] == "Frieren")
            self.assertEqual(frieren_node["mediaId"], 1)
            self.assertEqual(frieren_node["localEpisodeCount"], 2)
            self.assertEqual(frieren_node["children"][0]["name"], "Season 1")

            loose_file = next(node for node in index.iter_nodes() if node["name"].startswith("[SubsPlease] One Piece"))
            self.assertEqual(loose_file["mediaId"], 2)
            self.assertEqual(loose_file["episode"], 3)

            self.assertFalse(any(node["path"] == str(excluded_dir) for node in index.iter_nodes()))

    def test_title_overrides_match_custom_folder_names(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base_dir = Path(tmpdir) / "Anime"
            show_dir = base_dir / "Kimetsu no Yaiba"
            show_dir.mkdir(parents=True)
            (show_dir / "[SubsPlease] Kimetsu no Yaiba - 01 (1080p).mkv").write_text("1")

            index = build_library_index(
                str(base_dir),
                anilist_entries=[
                    {
                        "mediaId": 7,
                        "title": {"romaji": "Demon Slayer", "english": "Demon Slayer"},
                        "listStatus": "CURRENT",
                        "progress": 0,
                    }
                ],
                title_overrides={"7": "Kimetsu no Yaiba"},
            )

            show_node = index.tree[0]
            self.assertEqual(show_node["mediaId"], 7)
            self.assertEqual(show_node["localEpisodeCount"], 1)

    def test_resolve_local_availability_counts_local_episodes(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            downloads_dir = Path(tmpdir) / "Downloads"
            show_dir = downloads_dir / "Kimetsu no Yaiba"
            show_dir.mkdir(parents=True)
            (show_dir / "[SubsPlease] Kimetsu no Yaiba - 01 (1080p).mkv").write_text("1")
            (show_dir / "[SubsPlease] Kimetsu no Yaiba - 02 (1080p).mkv").write_text("2")

            index = build_library_index(
                str(downloads_dir),
                anilist_entries=[
                    {
                        "mediaId": 7,
                        "title": {"romaji": "Demon Slayer", "english": "Demon Slayer"},
                        "listStatus": "CURRENT",
                        "progress": 0,
                    }
                ],
                title_overrides={"7": "Kimetsu no Yaiba"},
            )

            settings = FakeSettings(default_download_dir=str(downloads_dir))
            availability = index.resolve_local_availability(settings, media_id=7)

            self.assertEqual(availability["media_dir"], str(show_dir))
            self.assertEqual(availability["episode_numbers"], {1, 2})
            self.assertEqual(availability["episode_count"], 2)


if __name__ == "__main__":
    unittest.main()
