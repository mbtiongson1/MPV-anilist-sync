import unittest
import sys
import os

# Add src to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.parser import AnimeParser

class TestParser(unittest.TestCase):
    def test_basic_filename(self):
        filename = "[SubsPlease] Sousou no Frieren - 01 (1080p) [F23E0A3C].mkv"
        parsed = AnimeParser.parse_filename(filename)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed['title'], "Sousou no Frieren")
        self.assertEqual(parsed['episode'], 1)
        self.assertEqual(parsed['video_resolution'], '1080p')

    def test_season_filename(self):
        filename = "[SubsPlease] Sousou no Frieren S02E05 (1080p).mkv"
        parsed = AnimeParser.parse_filename(filename)
        # print(f"DEBUG: filename='{filename}', parsed={parsed}")
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed['season'], 2)
        self.assertEqual(parsed['episode'], 5)

    def test_movie_filename(self):
        filename = "Kimi no Na wa (2016) [1080p].m4v"
        parsed = AnimeParser.parse_filename(filename)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed['title'], "Kimi no Na wa")
        # Movies might not have an episode
        self.assertTrue(parsed['episode'] is None or parsed['episode'] == 1)

    def test_empty_filename(self):
        self.assertIsNone(AnimeParser.parse_filename(""))
        self.assertIsNone(AnimeParser.parse_filename(None))

if __name__ == "__main__":
    unittest.main()
