import unittest
from unittest.mock import patch, MagicMock
import os
import sys
import asyncio

# Add project root to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.api.router_os import parse_version, check_update

class TestUpdates(unittest.TestCase):
    def test_parse_version(self):
        self.assertEqual(parse_version("v1.2.3"), (1, 2, 3))
        self.assertEqual(parse_version("4.2.11"), (4, 2, 11))
        self.assertEqual(parse_version("v10.0.0-beta"), (10, 0, 0))

    @patch('src.api.router_os.get_latest_release_info')
    def test_check_update_available(self, mock_get_release):
        mock_get_release.return_value = {
            "tag_name": "v10.0.0",
            "body": "Changelog text",
            "assets": [
                {"name": "MPV_Anilist_Tracker_v10.0.0.dmg", "browser_download_url": "https://github.com/test.dmg"},
                {"name": "MPV_Anilist_Tracker_v10.0.0.exe", "browser_download_url": "https://github.com/test.exe"}
            ]
        }
        res = asyncio.run(check_update())
        self.assertTrue(res["update_available"])
        self.assertEqual(res["latest_version"], "10.0.0")
        if sys.platform == 'darwin':
            self.assertEqual(res["download_url"], "https://github.com/test.dmg")
        elif sys.platform == 'win32':
            self.assertEqual(res["download_url"], "https://github.com/test.exe")

    @patch('src.api.router_os.get_latest_release_info')
    def test_check_update_not_available(self, mock_get_release):
        mock_get_release.return_value = {
            "tag_name": "v1.0.0",
            "body": "Changelog text",
            "assets": []
        }
        res = asyncio.run(check_update())
        self.assertFalse(res["update_available"])

if __name__ == "__main__":
    unittest.main()
