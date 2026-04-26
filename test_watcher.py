import os
import sys
import unittest
from unittest.mock import patch

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from src.watchers.mpv import MPVWatcher


class TestWatcherSmoke(unittest.TestCase):
    @patch("src.watchers.mpv.sys.platform", "darwin")
    @patch("src.watchers.mpv.os.path.exists", return_value=False)
    def test_connect_returns_false_when_socket_is_missing(self, _mock_exists):
        watcher = MPVWatcher()
        self.assertFalse(watcher.connect())
        self.assertFalse(watcher.is_connected)


if __name__ == "__main__":
    unittest.main()
