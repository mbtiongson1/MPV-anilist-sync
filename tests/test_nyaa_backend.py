import asyncio
import os
import tempfile
import types
import unittest
from unittest.mock import MagicMock

from src.api.router_nyaa import nyaa_batch_search_candidates, nyaa_download, nyaa_search
from src.nyaa import NyaaInterface


class FakeRequest:
    def __init__(self, agent, body=None):
        self.app = types.SimpleNamespace(state=types.SimpleNamespace(agent=agent))
        self._body = body or {}

    async def json(self):
        return self._body


def _make_agent(*, default_download_dir, get_media_folder=None, torrent_archive=None, list_cache=None, anime_list=None, progress_map=None):
    settings = types.SimpleNamespace(
        default_download_dir=default_download_dir,
        preferred_groups=[],
        preferred_resolution="1080p",
        torrent_archive=torrent_archive or [],
        title_overrides={},
    )
    if get_media_folder is None:
        get_media_folder = lambda media_id: default_download_dir
    settings.get_media_folder = get_media_folder
    settings.set_torrent_archive = MagicMock()
    settings.add_torrent_archive = MagicMock()

    anilist = types.SimpleNamespace(
        _load_list_cache=MagicMock(return_value=list_cache or []),
        get_user_anime_list=MagicMock(return_value=anime_list or []),
    )

    def get_progress_for_media(media_id):
        return (progress_map or {}).get(media_id, 0)

    agent = types.SimpleNamespace(
        settings=settings,
        anilist=anilist,
        nyaa=types.SimpleNamespace(search=MagicMock(), download_torrent=MagicMock()),
        get_progress_for_media=get_progress_for_media,
    )
    return agent


class TestNyaaBackend(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tempdir.cleanup)

    async def test_download_accepts_legacy_fields_and_prefers_media_folder(self):
        default_dir = os.path.join(self.tempdir.name, "downloads")
        custom_dir = os.path.join(self.tempdir.name, "anime", "Frieren")
        os.makedirs(default_dir, exist_ok=True)
        os.makedirs(custom_dir, exist_ok=True)

        agent = _make_agent(
            default_download_dir=default_dir,
            get_media_folder=lambda media_id: custom_dir,
        )
        agent.nyaa.download_torrent.return_value = os.path.join(custom_dir, "torrent.torrent")

        request = FakeRequest(
            agent,
            {
                "link": "https://nyaa.si/download/12345.torrent",
                "media_id": 42,
                "anime_title": "Frieren",
            },
        )

        result = await nyaa_download(request)

        self.assertTrue(result["success"])
        self.assertEqual(result["results"][0]["success"], True)
        agent.nyaa.download_torrent.assert_called_once_with(
            "https://nyaa.si/download/12345.torrent",
            custom_dir,
        )

    async def test_download_uses_sanitized_title_subfolder_when_media_folder_is_default(self):
        default_dir = os.path.join(self.tempdir.name, "downloads")
        os.makedirs(default_dir, exist_ok=True)

        agent = _make_agent(default_download_dir=default_dir)
        agent.nyaa.download_torrent.return_value = os.path.join(default_dir, "torrent.torrent")

        request = FakeRequest(
            agent,
            {
                "items": [
                    {
                        "url": "https://nyaa.si/view/12345",
                        "media_id": 7,
                        "anime_title": "Frieren: Beyond Journey's End",
                    }
                ]
            },
        )

        result = await nyaa_download(request)

        expected_dir = os.path.join(default_dir, "Frieren Beyond Journey's End")
        self.assertTrue(result["success"])
        agent.nyaa.download_torrent.assert_called_once_with(
            "https://nyaa.si/view/12345",
            expected_dir,
        )

    async def test_search_filters_archived_and_dismissed_torrents(self):
        default_dir = os.path.join(self.tempdir.name, "downloads")
        os.makedirs(default_dir, exist_ok=True)
        archived_link = "https://nyaa.si/download/archived.torrent"
        dismissed_title = "[SubsPlease] Frieren - 02 [1080p]"
        kept_link = "https://nyaa.si/download/kept.torrent"

        archive = [
            {"link": archived_link, "state": "downloaded"},
            {"title": dismissed_title, "state": "dismissed"},
        ]
        agent = _make_agent(
            default_download_dir=default_dir,
            torrent_archive=archive,
            list_cache=[],
        )
        agent.nyaa.search.return_value = [
            {"title": "archived", "link": archived_link, "view_link": archived_link, "episode": 1},
            {"title": dismissed_title, "link": "https://nyaa.si/download/dismissed.torrent", "view_link": "https://nyaa.si/view/2", "episode": 2},
            {"title": "kept", "link": kept_link, "view_link": kept_link, "episode": 3},
        ]

        request = FakeRequest(agent)
        results = await nyaa_search(request, q="Frieren", media_id="7")

        self.assertEqual([item["title"] for item in results], ["kept"])

    def test_rank_candidates_prefers_group_trust_and_batch_last(self):
        nyaa = NyaaInterface()
        candidates = [
            {
                "title": "[SubsPlease] Show - 01",
                "group": "SubsPlease",
                "trusted": True,
                "no_remake": False,
                "resolution": "1080p",
                "seeders": 10,
                "pubDate": "Mon, 01 Apr 2024 12:00:00 GMT",
                "is_batch": False,
            },
            {
                "title": "[SubsPlease] Show - 02",
                "group": "SubsPlease",
                "trusted": False,
                "no_remake": True,
                "resolution": "1080p",
                "seeders": 10,
                "pubDate": "Mon, 01 Apr 2024 12:00:00 GMT",
                "is_batch": False,
            },
            {
                "title": "[SubsPlease] Show Batch",
                "group": "SubsPlease",
                "trusted": False,
                "no_remake": False,
                "resolution": "1080p",
                "seeders": 10,
                "pubDate": "Mon, 01 Apr 2024 12:00:00 GMT",
                "is_batch": True,
            },
            {
                "title": "[Other] Show - 03",
                "group": "Other",
                "trusted": False,
                "no_remake": False,
                "resolution": "1080p",
                "seeders": 99,
                "pubDate": "Mon, 01 Apr 2024 12:00:00 GMT",
                "is_batch": False,
            },
        ]

        ranked = nyaa.rank_candidates(candidates, preferred_groups=["SubsPlease"], preferred_resolution="1080p")

        self.assertEqual(
            [item["title"] for item in ranked],
            [
                "[SubsPlease] Show - 01",
                "[SubsPlease] Show - 02",
                "[SubsPlease] Show Batch",
                "[Other] Show - 03",
            ],
        )

    def test_rank_candidates_uses_resolution_seeders_and_freshness(self):
        nyaa = NyaaInterface()
        candidates = [
            {
                "title": "[SubsPlease] Show - 01 (720p)",
                "group": "SubsPlease",
                "trusted": False,
                "no_remake": False,
                "resolution": "720p",
                "seeders": 25,
                "pubDate": "Mon, 01 Apr 2024 12:00:00 GMT",
                "is_batch": False,
            },
            {
                "title": "[SubsPlease] Show - 01 (1080p)",
                "group": "SubsPlease",
                "trusted": False,
                "no_remake": False,
                "resolution": "1080p",
                "seeders": 20,
                "pubDate": "Mon, 01 Apr 2024 12:00:00 GMT",
                "is_batch": False,
            },
            {
                "title": "[SubsPlease] Show - 01 (1080p) newer",
                "group": "SubsPlease",
                "trusted": False,
                "no_remake": False,
                "resolution": "1080p",
                "seeders": 20,
                "pubDate": "Tue, 02 Apr 2024 12:00:00 GMT",
                "is_batch": False,
            },
        ]

        ranked = nyaa.rank_candidates(candidates, preferred_groups=["SubsPlease"], preferred_resolution="1080p")

        self.assertEqual(
            [item["title"] for item in ranked],
            [
                "[SubsPlease] Show - 01 (1080p) newer",
                "[SubsPlease] Show - 01 (1080p)",
                "[SubsPlease] Show - 01 (720p)",
            ],
        )

    async def test_batch_candidates_skip_watched_and_already_downloaded_episodes(self):
        default_dir = os.path.join(self.tempdir.name, "downloads")
        title_dir = os.path.join(default_dir, "Custom Localized Name")
        os.makedirs(title_dir, exist_ok=True)
        with open(os.path.join(title_dir, "Show - 06.mkv"), "w", encoding="utf-8") as handle:
            handle.write("episode 6")

        agent = _make_agent(
            default_download_dir=default_dir,
            list_cache=[
                {
                    "mediaId": 101,
                    "title": {"romaji": "Show", "english": "Show"},
                    "listStatus": "CURRENT",
                    "progress": 5,
                    "episodes": 12,
                }
            ],
            anime_list=[
                {
                    "mediaId": 101,
                    "mediaStatus": "RELEASING",
                    "progress": 5,
                    "episodes": 12,
                    "title": {"romaji": "Show", "english": "Show"},
                }
            ],
            progress_map={101: 5},
        )
        agent.settings.title_overrides = {"101": "Custom Localized Name"}

        request = FakeRequest(agent)
        results = await nyaa_batch_search_candidates(request)

        self.assertEqual(
            results,
            [
                {
                    "query": "Show",
                    "anime_title": "Show",
                    "episode": 7,
                    "media_id": 101,
                }
            ],
        )


if __name__ == "__main__":
    unittest.main()
