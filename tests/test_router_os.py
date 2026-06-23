import unittest
from unittest.mock import patch, MagicMock, AsyncMock
import os
import sys
import asyncio
from pathlib import Path

# Add project root to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.api.router_os import open_folder, resume, FolderRequest

class TestRouterOS(unittest.TestCase):
    def setUp(self):
        self.mock_request = MagicMock()
        self.mock_agent = MagicMock()
        self.mock_request.app.state.agent = self.mock_agent
        self.mock_settings = MagicMock()
        self.mock_agent.settings = self.mock_settings

    @patch('src.api.router_os.sys.platform', 'linux')
    @patch('os.path.exists')
    @patch('os.path.isabs')
    @patch('os.path.abspath')
    @patch('subprocess.run')
    def test_open_folder_fallback_to_base_anime_folder(self, mock_run, mock_abspath, mock_isabs, mock_exists):
        # Setup settings
        self.mock_settings.base_anime_folder = "/mock/base/anime"
        self.mock_settings.last_played_file = "relative/path/video.mkv"

        # Configure mocks
        mock_isabs.return_value = False
        # The base dir exists, but the relative file does not exist directly or recursively
        mock_exists.side_effect = lambda p: str(p).replace('\\', '/') == '/mock/base/anime'
        mock_abspath.side_effect = lambda p: p

        # Run open_folder (POST) with empty FolderRequest (triggering last_played fallback)
        res = asyncio.run(open_folder(self.mock_request, FolderRequest()))

        self.assertTrue(res["success"])
        # It should fall back to opening base_anime_folder because the relative path couldn't be resolved
        mock_run.assert_called()
        args = mock_run.call_args[0][0]
        self.assertIn("/mock/base/anime", args)

    @patch('src.api.router_os.sys.platform', 'linux')
    @patch('os.path.exists')
    @patch('os.path.isabs')
    @patch('os.path.abspath')
    @patch('subprocess.run')
    def test_open_folder_resolves_relative_path(self, mock_run, mock_abspath, mock_isabs, mock_exists):
        self.mock_settings.base_anime_folder = "/mock/base/anime"
        self.mock_settings.last_played_file = "video.mkv"

        # Mock file system: base_dir exists, direct path exists
        mock_isabs.return_value = False
        mock_exists.side_effect = lambda p: str(p).replace('\\', '/') in ('/mock/base/anime', '/mock/base/anime/video.mkv')
        mock_abspath.side_effect = lambda p: p

        res = asyncio.run(open_folder(self.mock_request, FolderRequest()))
        self.assertTrue(res["success"])
        mock_run.assert_called()
        args = [str(a).replace('\\', '/') for a in mock_run.call_args[0][0]]
        self.assertIn("/mock/base/anime/video.mkv", args)

    @patch('src.api.router_os.sys.platform', 'linux')
    @patch('os.path.exists')
    @patch('os.path.isabs')
    @patch('os.path.abspath')
    @patch('subprocess.run')
    def test_resume_resolves_relative_path(self, mock_run, mock_abspath, mock_isabs, mock_exists):
        self.mock_settings.base_anime_folder = "/mock/base/anime"
        self.mock_settings.last_played_file = "video.mkv"

        # Mock file system: base_dir exists, direct path exists
        mock_isabs.return_value = False
        mock_exists.side_effect = lambda p: str(p).replace('\\', '/') in ('/mock/base/anime', '/mock/base/anime/video.mkv')
        mock_abspath.side_effect = lambda p: p

        res = asyncio.run(resume(self.mock_request))
        self.assertTrue(res["success"])
        mock_run.assert_called()
        args = [str(a).replace('\\', '/') for a in mock_run.call_args[0][0]]
        self.assertIn("/mock/base/anime/video.mkv", args)

if __name__ == "__main__":
    unittest.main()
