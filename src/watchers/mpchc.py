import requests
import re
from typing import Optional
from .base import BaseWatcher

class MPCHCWatcher(BaseWatcher):
    def __init__(self, port: int = 13579):
        self.port = port
        self.url = f"http://localhost:{port}/variables.html"
        self._is_connected = False
        self._filename: Optional[str] = None
        self._percent_pos = 0.0

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def connect(self) -> bool:
        try:
            response = requests.get(self.url, timeout=1)
            if response.status_code == 200:
                self._is_connected = True
                return True
        except requests.exceptions.RequestException:
            pass
        self._is_connected = False
        return False

    def disconnect(self):
        self._is_connected = False

    def check_connection(self) -> bool:
        try:
            response = requests.get(self.url, timeout=1)
            if response.status_code == 200:
                self._is_connected = True
                self._update_state(response.text)
                return True
        except requests.exceptions.RequestException:
            pass
        self._is_connected = False
        return False

    def _update_state(self, html: str):
        # Extract filename
        file_match = re.search(r'id="file">([^<]+)<', html)
        if file_match:
            self._filename = file_match.group(1)
        else:
            self._filename = None

        # Extract position and duration
        pos_match = re.search(r'id="position">(\d+)<', html)
        dur_match = re.search(r'id="duration">(\d+)<', html)
        
        if pos_match and dur_match:
            pos = int(pos_match.group(1))
            dur = int(dur_match.group(1))
            if dur > 0:
                self._percent_pos = (pos / dur) * 100.0
            else:
                self._percent_pos = 0.0
        else:
            self._percent_pos = 0.0

    def get_current_filename(self) -> Optional[str]:
        return self._filename

    def get_percent_pos(self) -> float:
        return self._percent_pos

