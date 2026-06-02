import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add project root to path for internal imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from src.ui import TrackerUI
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

class TestTrackerUI(unittest.TestCase):
    def setUp(self):
        if not HAS_TKINTER:
            self.skipTest("Tkinter not available")


    @patch('src.ui.tk.Tk')
    def test_tracker_ui_initialization_with_unauthenticated_agent(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False

        # Act
        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'):
            ui = TrackerUI(mock_agent)

        # Assert
        mock_tk.assert_called_once()
        mock_root.title.assert_called_once_with("Anime Tracker")
        self.assertFalse(ui.log_text.insert.called, "Log should not have inserted authenticated message")


    @patch('src.ui.tk.Tk')
    def test_tracker_ui_initialization_with_authenticated_agent(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = True

        # Act
        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'):
            ui = TrackerUI(mock_agent)

        # Assert
        mock_tk.assert_called_once()
        self.assertTrue(ui.log_text.insert.called)
        # Check that the inserted message mentions the active tracking
        call_args = ui.log_text.insert.call_args[0]
        self.assertIn("App is running with existing AniList token. Tracking is active.", call_args[1])

    @patch('src.ui.tk.Tk')
    def test_update_log_active_watcher(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_watcher = MagicMock()
        mock_watcher.is_connected = True
        mock_watcher.get_current_filename.return_value = "anime_episode_1_loooooooooong.mkv"
        mock_watcher.get_percent_pos.return_value = 50.5
        mock_watcher.__class__.__name__ = "MPVWatcher"
        mock_agent.active_watcher = mock_watcher

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar') as mock_string_var, patch('src.ui.ttk.Frame'):
            mock_status_var = MagicMock()
            mock_string_var.return_value = mock_status_var
            ui = TrackerUI(mock_agent)

            # Act
            ui.update_log()

            # Assert
            mock_status_var.set.assert_called_with("[MPV] Playing: anime_episode_1_looo... (50%)")
            mock_root.after.assert_called_with(1000, ui.update_log)

    @patch('src.ui.tk.Tk')
    def test_update_log_idle_watcher(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_watcher = MagicMock()
        mock_watcher.is_connected = True
        mock_watcher.get_current_filename.return_value = None
        mock_agent.active_watcher = mock_watcher

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar') as mock_string_var, patch('src.ui.ttk.Frame'):
            mock_status_var = MagicMock()
            mock_string_var.return_value = mock_status_var
            ui = TrackerUI(mock_agent)

            # Act
            ui.update_log()

            # Assert
            mock_status_var.set.assert_called_with("Status: Connected, idle")
            mock_root.after.assert_called_with(1000, ui.update_log)

    @patch('src.ui.tk.Tk')
    def test_update_log_no_watcher(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_agent.active_watcher = None

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar') as mock_string_var, patch('src.ui.ttk.Frame'):
            mock_status_var = MagicMock()
            mock_string_var.return_value = mock_status_var
            ui = TrackerUI(mock_agent)

            # Act
            ui.update_log()

            # Assert
            mock_status_var.set.assert_called_with("Status: Waiting for media player...")
            mock_root.after.assert_called_with(1000, ui.update_log)

    @patch('src.ui.tk.Tk')
    def test_authenticate_anilist_success(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_agent.anilist.authenticate.return_value = True

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar') as mock_string_var, patch('src.ui.ttk.Frame'), patch('src.ui.threading.Thread') as mock_thread, patch('src.ui.messagebox.showinfo'):
            mock_status_var = MagicMock()
            mock_string_var.return_value = mock_status_var
            ui = TrackerUI(mock_agent)

            # Mock log to avoid trying to use tk methods without fully mocking Text
            ui.log = MagicMock()

            # Get the thread target to run it synchronously
            thread_target = None
            def capture_target(target, daemon):
                nonlocal thread_target
                thread_target = target
                return MagicMock()
            mock_thread.side_effect = capture_target

            # Act
            ui.authenticate_anilist()

            # Assert thread started
            self.assertIsNotNone(thread_target)

            # Run the thread target manually to test its logic
            thread_target()

            # Assert
            mock_agent.anilist.authenticate.assert_called_once()
            ui.log.assert_any_call("Starting AniList authentication...")
            ui.log.assert_any_call("Successfully authenticated with AniList!")
            mock_root.after.assert_any_call(0, ui.status_var.set, "Status: Authenticated with AniList!")

    @patch('src.ui.tk.Tk')
    def test_authenticate_anilist_failure(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_agent.anilist.authenticate.return_value = False

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'), patch('src.ui.threading.Thread') as mock_thread:
            ui = TrackerUI(mock_agent)

            # Mock log
            ui.log = MagicMock()

            # Get the thread target to run it synchronously
            thread_target = None
            def capture_target(target, daemon):
                nonlocal thread_target
                thread_target = target
                return MagicMock()
            mock_thread.side_effect = capture_target

            # Act
            ui.authenticate_anilist()

            # Run thread target manually
            thread_target()

            # Assert
            mock_agent.anilist.authenticate.assert_called_once()
            ui.log.assert_any_call("Starting AniList authentication...")
            ui.log.assert_any_call("Authentication failed. (Check config.json for client_id)")

    @patch('src.ui.tk.Tk')
    @patch('webbrowser.open')
    def test_open_anilist_with_user_id(self, mock_webbrowser_open, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_agent.anilist.user_id = "12345"

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'):
            ui = TrackerUI(mock_agent)

            # Act
            ui.open_anilist()

            # Assert
            mock_webbrowser_open.assert_called_once_with("https://anilist.co/user/12345/animelist")

    @patch('src.ui.tk.Tk')
    @patch('webbrowser.open')
    def test_open_anilist_without_user_id(self, mock_webbrowser_open, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False
        mock_agent.anilist.user_id = None

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'):
            ui = TrackerUI(mock_agent)

            # Act
            ui.open_anilist()

            # Assert
            mock_webbrowser_open.assert_called_once_with("https://anilist.co/home")

    @patch('src.ui.tk.Tk')
    def test_hide_and_show_window(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'):
            ui = TrackerUI(mock_agent)

            # Act / Assert Hide
            ui.hide_window()
            mock_root.withdraw.assert_called_once()

            # Act / Assert Show
            ui.show_window()
            mock_root.deiconify.assert_called_once()
            mock_root.lift.assert_called_once()

    @patch('src.ui.tk.Tk')
    def test_quit_app(self, mock_tk):
        # Arrange
        mock_root = MagicMock()
        mock_tk.return_value = mock_root

        mock_agent = MagicMock()
        mock_agent.anilist.is_authenticated.return_value = False

        with patch('src.ui.ttk.Label'), patch('src.ui.ttk.Button'), patch('src.ui.tk.Text'), patch('src.ui.tk.StringVar'), patch('src.ui.ttk.Frame'):
            ui = TrackerUI(mock_agent)

            # Act
            mock_icon = MagicMock()
            ui.quit_app(icon=mock_icon)

            # Assert
            mock_icon.stop.assert_called_once()
            mock_agent.stop.assert_called_once()
            mock_root.quit.assert_called_once()

if __name__ == "__main__":
    unittest.main()
