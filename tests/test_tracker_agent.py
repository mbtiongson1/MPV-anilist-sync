import os
import sys
import types
import unittest

# Add project root to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.main import TrackerAgent


class TestTrackerAgentHelpers(unittest.TestCase):
    def test_resolve_episode_rolls_over_to_sequel(self):
        season2 = {"id": 2, "episodes": 12, "relations": {"edges": []}}
        season1 = {
            "id": 1,
            "episodes": 12,
            "relations": {"edges": [{"relationType": "SEQUEL", "node": season2}]},
        }

        media, local_episode = TrackerAgent._resolve_episode_to_media(season1, 14)
        self.assertEqual(media["id"], 2)
        self.assertEqual(local_episode, 2)

    def test_resolve_episode_honors_target_season(self):
        season3 = {"id": 3, "episodes": 10, "relations": {"edges": []}}
        season2 = {
            "id": 2,
            "episodes": 12,
            "relations": {"edges": [{"relationType": "SEQUEL", "node": season3}]},
        }
        season1 = {
            "id": 1,
            "episodes": 12,
            "relations": {"edges": [{"relationType": "SEQUEL", "node": season2}]},
        }

        media, local_episode = TrackerAgent._resolve_episode_to_media(
            season1, global_episode=5, target_season=3
        )
        self.assertEqual(media["id"], 3)
        self.assertEqual(local_episode, 5)

    def test_resolve_episode_uses_remaining_when_episode_count_missing(self):
        media = {"id": 10, "episodes": None, "relations": {"edges": []}}
        resolved_media, local_episode = TrackerAgent._resolve_episode_to_media(media, 7)
        self.assertEqual(resolved_media["id"], 10)
        self.assertEqual(local_episode, 7)

    def test_build_media_map_collects_unique_chain(self):
        # Include a cycle to verify de-duping by ID.
        season1 = {"id": 1, "relations": {"edges": []}}
        season3 = {
            "id": 3,
            "relations": {"edges": [{"relationType": "SEQUEL", "node": season1}]},
        }
        season2 = {
            "id": 2,
            "relations": {"edges": [{"relationType": "SEQUEL", "node": season3}]},
        }
        season1["relations"]["edges"] = [{"relationType": "SEQUEL", "node": season2}]

        media_map = TrackerAgent._build_media_map(season1)
        self.assertEqual(set(media_map.keys()), {1, 2, 3})

    def test_process_active_file_persists_filename_and_fetches_only_on_change(self):
        agent = TrackerAgent.__new__(TrackerAgent)
        agent.active_filename = None
        agent.settings = types.SimpleNamespace(last_played_file=None)

        fetched = []
        agent._fetch_current_anilist_progress = fetched.append

        agent._process_active_file("/anime/ep1.mkv")
        agent._process_active_file("/anime/ep1.mkv")
        agent._process_active_file("/anime/ep2.mkv")

        self.assertEqual(
            fetched,
            ["/anime/ep1.mkv", "/anime/ep2.mkv"],
        )
        self.assertEqual(agent.settings.last_played_file, "/anime/ep2.mkv")


if __name__ == "__main__":
    unittest.main()
