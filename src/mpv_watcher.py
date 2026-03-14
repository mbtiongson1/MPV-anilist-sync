import time
import os
from python_mpv_jsonipc import MPV
from typing import Optional

class MPVWatcher:
    def __init__(self, socket_path: str = "/tmp/mpvsocket"):
        self.socket_path = socket_path
        self.mpv = None
        self.is_connected = False
        self.current_filename: Optional[str] = None
        self.percent_pos = 0.0

    def connect(self) -> bool:
        if not os.path.exists(self.socket_path):
            return False
            
        try:
            mpv_instance = MPV(start_mpv=False, ipc_socket=self.socket_path)
            self.mpv = mpv_instance
            self.is_connected = True
            
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
            self.is_connected = False
            return False

    def disconnect(self):
        if self.mpv:
            # Best effort to clean up, python_mpv_jsonipc handles thread shutdown internally
            self.mpv = None
            self.is_connected = False
            self.current_filename = None
            self.percent_pos = 0.0

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
