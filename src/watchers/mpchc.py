from .base import BaseWatcher
from typing import Optional

class MPCHCWatcher(BaseWatcher):
    def __init__(self):
        self._is_connected = False

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def connect(self) -> bool:
        return False

    def disconnect(self):
        self._is_connected = False

    def check_connection(self) -> bool:
        return False

    def get_current_filename(self) -> Optional[str]:
        return None

    def get_percent_pos(self) -> float:
        return 0.0
