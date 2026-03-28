import json
import os
from typing import Dict, Any, List

class SettingsManager:
    def __init__(self, settings_file: str = "config.json"):
        self.settings_file = settings_file
        self.settings: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        return data
            except Exception as e:
                print(f"Error loading settings: {e}")
        return {}

    def save(self):
        try:
            with open(self.settings_file, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=4)
        except Exception as e:
            print(f"Error saving settings: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        return self.settings.get(key, default)

    def set(self, key: str, value: Any):
        self.settings[key] = value
        self.save()

    @property
    def preferred_groups(self) -> List[str]:
        return self.get("preferred_groups", [])

    @preferred_groups.setter
    def preferred_groups(self, value: List[str]):
        self.set("preferred_groups", value)

    @property
    def preferred_resolution(self) -> str:
        return self.get("preferred_resolution", "1080p")

    @preferred_resolution.setter
    def preferred_resolution(self, value: str):
        self.set("preferred_resolution", value)

    @property
    def default_download_dir(self) -> str:
        return self.get("default_download_dir", os.path.join(os.path.expanduser("~"), "Downloads"))

    @default_download_dir.setter
    def default_download_dir(self, value: str):
        self.set("default_download_dir", value)

    @property
    def base_anime_folder(self) -> str:
        import sys
        if sys.platform == "win32":
            default_path = os.path.join(os.path.expanduser("~"), "Videos", "Anime")
        else:
            default_path = os.path.join(os.path.expanduser("~"), "Downloads")
        return self.get("base_anime_folder", default_path)

    @base_anime_folder.setter
    def base_anime_folder(self, value: str):
        self.set("base_anime_folder", value)

    @property
    def media_folders_map(self) -> Dict[str, str]:
        return self.get("media_folders_map", {})

    def update_media_folder(self, media_id: int, folder_path: str):
        mapping = self.media_folders_map
        mapping[str(media_id)] = folder_path
        self.set("media_folders_map", mapping)

    def get_media_folder(self, media_id: int) -> str:
        mapping = self.media_folders_map
        return mapping.get(str(media_id), self.default_download_dir)
