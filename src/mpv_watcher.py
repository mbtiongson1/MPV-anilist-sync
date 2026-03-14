import time
import os
from python_mpv_jsonipc import MPV

class MPVWatcher:
    def __init__(self, socket_path: str = "/tmp/mpvsocket"):
        self.socket_path = socket_path
        self.mpv = None
        self.is_connected = False
        self.current_filename = None
        self.percent_pos = 0.0

    def connect(self) -> bool:
        if not os.path.exists(self.socket_path):
            return False
            
        try:
            self.mpv = MPV(start_mpv=False, ipc_socket=self.socket_path)
            self.is_connected = True
            
            # Setup property observers
            @self.mpv.property_observer('filename')
            def on_filename_change(_name, value):
                self.current_filename = value
                
            @self.mpv.property_observer('percent-pos')
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

    def get_current_filename(self) -> str:
        return self.current_filename
        
    def get_percent_pos(self) -> float:
        return self.percent_pos

    def is_playing_anime(self) -> bool:
        # A rough heuristic: if there's a file, usually handled by checking extensions
        # But mpv might just be idle.
        if not self.is_connected or not self.current_filename:
            return False
        
        # We can improve this by checking standard video extensions
        video_exts = ['.mkv', '.mp4', '.avi']
        return any(self.current_filename.lower().endswith(ext) for ext in video_exts)
