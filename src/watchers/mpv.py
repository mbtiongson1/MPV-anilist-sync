import time
import os
import sys
from python_mpv_jsonipc import MPV
from typing import Optional
from .base import BaseWatcher

class MPVWatcher(BaseWatcher):
    def __init__(self, socket_path: Optional[str] = None):
        if socket_path is None:
            if sys.platform == "win32":
                self.socket_path = r"\\.\pipe\mpvsocket"
            else:
                self.socket_path = "/tmp/mpvsocket"
        else:
            self.socket_path = socket_path
        self.mpv = None
        self._is_connected = False
        self.current_filename: Optional[str] = None
        self.percent_pos = 0.0

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def connect(self) -> bool:
        # On Unix, check if the socket file exists first
        # On Windows, named pipes can't be checked with os.path.exists
        if sys.platform != "win32" and not os.path.exists(self.socket_path):
            return False
            
        try:
            mpv_instance = MPV(start_mpv=False, ipc_socket=self.socket_path)
            self.mpv = mpv_instance
            self._is_connected = True
            
            # Setup property observers
            @mpv_instance.property_observer('filename')
            def on_filename_change(_name, value):
                self.current_filename = value
                
            @mpv_instance.property_observer('percent-pos')
            def on_percent_pos_change(_name, value):
                if value is not None:
                    self.percent_pos = value
                    
            return True
        except Exception as e:
            # Maybe socket exists but mpv is not running or listening
            self._is_connected = False
            return False

    def disconnect(self):
        if self.mpv:
            # Best effort to clean up, python_mpv_jsonipc handles thread shutdown internally
            self.mpv = None
            self._is_connected = False
            self.current_filename = None
            self.percent_pos = 0.0

    def check_connection(self) -> bool:
        """Actively ping MPV to verify the socket hasn't silently died."""
        mpv = self.mpv
    
    
    
    
    
        if not self.is_connected or mpv is None:
            return False
            
        try:
            # Ping a harmless property to see if it responds
            # python-mpv-jsonipc caches some properties, but forcing a read on a changing or core 
            # property like pid or core-idle usually triggers an active socket interaction
            _ = mpv.core_idle
            return True
        except Exception:
            self.disconnect()
            return False

    def get_current_filename(self) -> Optional[str]:
        return self.current_filename
        
    def get_percent_pos(self) -> float:
        return self.percent_pos

    def is_playing_anime(self) -> bool:
        filename = self.current_filename
        if not self.is_connected or not filename:
            return False
        
        # We can improve this by checking standard video extensions
        video_exts = ['.mkv', '.mp4', '.avi']
        return any(filename.lower().endswith(ext) for ext in video_exts)  # type: ignore
