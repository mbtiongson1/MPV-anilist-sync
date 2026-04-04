from abc import ABC, abstractmethod
from typing import Optional

class BaseWatcher(ABC):
    @property
    @abstractmethod
    def is_connected(self) -> bool:
        ...

    @property
    @abstractmethod
    def is_paused(self) -> bool:
        ...

    @abstractmethod
    def connect(self) -> bool:
        ...

    @abstractmethod
    def disconnect(self):
        ...

    @abstractmethod
    def check_connection(self) -> bool:
        ...

    @abstractmethod
    def get_current_filename(self) -> Optional[str]:
        ...

    @abstractmethod
    def get_percent_pos(self) -> float:
        ...

    @abstractmethod
    def toggle_pause(self):
        ...

    @abstractmethod
    def next_episode(self):
        ...

    @abstractmethod
    def previous_episode(self):
        ...
