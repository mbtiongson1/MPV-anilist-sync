import sys
import re
from typing import Optional, List
from .base import BaseWatcher

try:
    import ctypes
    import ctypes.wintypes
    user32 = ctypes.windll.user32
    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.wintypes.BOOL, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
except (ImportError, AttributeError):
    user32 = None  # type: ignore
    WNDENUMPROC = None  # type: ignore
    ctypes = None  # type: ignore

class WindowTitleWatcher(BaseWatcher):
    def __init__(self):
        self._is_connected = False
        self._current_filename: Optional[str] = None
        
        # Regex patterns to extract filename from various media players
        self.patterns = [
            # VLC
            re.compile(r'^(.*) - VLC media player$'),
            # MPV
            re.compile(r'^(.*) - mpv$'),
            # MPC-HC
            re.compile(r'^(.*) - MPC-HC.*$'),
            # MPC-BE
            re.compile(r'^(.*) - MPC-BE.*$'),
            # PotPlayer
            re.compile(r'^(.*) - PotPlayer.*$'),
            # Windows Media Player Classic
            re.compile(r'^(.*) - Windows Media Player$'),
        ]

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def connect(self) -> bool:
        if sys.platform != "win32":
            return False
        
        # We always "connect" successfully since we're just polling the OS API
        self._is_connected = True
        return True

    def disconnect(self):
        self._is_connected = False
        self._current_filename = None

    def check_connection(self) -> bool:
        if not self.is_connected or sys.platform != "win32":
            return False
            
        # We actively find the current filename to check if player matches are still alive
        if self._scan_windows_for_media():
            return True
        else:
            self._current_filename = None
            return False

    def get_current_filename(self) -> Optional[str]:
        # Perform an immediate scan if asked
        if sys.platform == "win32" and self.is_connected:
            self._scan_windows_for_media()
        return self._current_filename

    def get_percent_pos(self) -> float:
        # Window titles don't reliably provide position percentage.
        # This will return 0 and trigger sync upon closure instead of via percentage threshold.
        return 0.0

    def _scan_windows_for_media(self) -> bool:
        found_player = False
        self._current_filename = None

        if sys.platform != "win32":
            return False

        def enum_cb(hwnd, _lparam):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buff, length + 1)
                    title = buff.value
                    
                    class_buff = ctypes.create_unicode_buffer(256)
                    user32.GetClassNameW(hwnd, class_buff, 256)
                    cls = class_buff.value
                    
                    filename = None
                    
                    # 1. Exact Window Class matching
                    if cls == "MediaPlayerClassicW":
                        # If MPC-HC connects but nothing is playing, title defaults.
                        if title not in ("Media Player Classic Home Cinema", "MPC-HC", "Media Player Classic", "MPC-BE", "Media Player Classic - BE"):
                            filename = title
                    elif cls == "mpv":
                        # MPV title is sometimes purely filename if configured specially, or ends with " - mpv"
                        # We will strip " - mpv" or just use the title
                        filename = title.replace(" - mpv", "").strip()
                    
                    # 2. Fallback to Regex Match
                    if not filename:
                        for pattern in self.patterns:
                            match = pattern.match(title)
                            if match:
                                filename = match.group(1).strip()
                                break
                    
                    if filename:
                        nonlocal found_player
                        found_player = True
                        self._current_filename = filename
                        return False  # Stop enumeration
            return True  # Continue enumeration

        user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
        return found_player

