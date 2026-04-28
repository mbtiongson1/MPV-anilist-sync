import os
import sys
import unittest
from unittest.mock import patch

# Add project root to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.watchers.mpv import MPVWatcher


class FakeMPV:
    def __init__(self, *args, **kwargs):
        self.pause = False
        self._observers = {}
        self._commands = []
        self.core_idle = True

    def property_observer(self, property_name):
        def decorator(fn):
            self._observers[property_name] = fn
            return fn

        return decorator

    def command(self, cmd):
        self._commands.append(cmd)


class BrokenMPV:
    @property
    def core_idle(self):
        raise RuntimeError("socket dead")


class TestMPVWatcher(unittest.TestCase):
    @patch("src.watchers.mpv.sys.platform", "darwin")
    @patch("src.watchers.mpv.os.path.exists", return_value=False)
    @patch("src.watchers.mpv.MPV")
    def test_connect_returns_false_when_socket_missing(self, mock_mpv, _mock_exists):
        watcher = MPVWatcher()
        self.assertFalse(watcher.connect())
        self.assertFalse(watcher.is_connected)
        mock_mpv.assert_not_called()

    @patch("src.watchers.mpv.sys.platform", "darwin")
    @patch("src.watchers.mpv.os.path.exists", return_value=True)
    @patch("src.watchers.mpv.MPV", side_effect=FakeMPV)
    def test_connect_registers_observers_and_updates_values(self, _mock_mpv, _mock_exists):
        watcher = MPVWatcher()
        self.assertTrue(watcher.connect())
        self.assertTrue(watcher.is_connected)
        self.assertIsNotNone(watcher.mpv)

        fake = watcher.mpv
        fake._observers["path"]("path", "/anime/Frieren - 03.mkv")
        fake._observers["percent-pos"]("percent-pos", 52.5)

        self.assertEqual(watcher.get_current_filename(), "/anime/Frieren - 03.mkv")
        self.assertEqual(watcher.get_percent_pos(), 52.5)

    def test_check_connection_disconnects_when_socket_dies(self):
        watcher = MPVWatcher("/tmp/fake.sock")
        watcher._is_connected = True
        watcher.mpv = BrokenMPV()
        watcher.current_filename = "old.mkv"
        watcher.percent_pos = 88.0

        self.assertFalse(watcher.check_connection())
        self.assertFalse(watcher.is_connected)
        self.assertIsNone(watcher.mpv)
        self.assertIsNone(watcher.get_current_filename())
        self.assertEqual(watcher.get_percent_pos(), 0.0)

    def test_is_playing_anime_checks_known_extensions(self):
        watcher = MPVWatcher("/tmp/fake.sock")
        watcher._is_connected = True

        watcher.current_filename = "episode.mkv"
        self.assertTrue(watcher.is_playing_anime())

        watcher.current_filename = "notes.txt"
        self.assertFalse(watcher.is_playing_anime())

    @patch("src.watchers.mpv.MPV", side_effect=FakeMPV)
    @patch("src.watchers.mpv.os.path.exists", return_value=True)
    @patch("src.watchers.mpv.sys.platform", "darwin")
    def test_transport_controls_issue_expected_commands(self, _exists, _mpv):
        watcher = MPVWatcher()
        self.assertTrue(watcher.connect())
        watcher.toggle_pause()
        watcher.next_episode()
        watcher.previous_episode()

        self.assertTrue(watcher.mpv.pause)
        self.assertEqual(watcher.mpv._commands, ["playlist-next", "playlist-prev"])


if __name__ == "__main__":
    unittest.main()
