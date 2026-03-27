import time
import os
import sys
import threading
from typing import Optional, Dict, Any, List, cast

def get_version():
    version_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "VERSION")
    try:
        with open(version_path, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "unknown"

VERSION = get_version()

# Ensure the project root is in sys.path so we can use package-style imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from src.anilist import AnilistClient
    from src.parser import AnimeParser
    from src.watchers import MPVWatcher, MPCHCWatcher, VLCWatcher, WindowTitleWatcher, BaseWatcher
    from src.settings import SettingsManager
    from src.nyaa import NyaaInterface
except ImportError:
    # Fallback for if we're not running as a package
    from anilist import AnilistClient
    from parser import AnimeParser
    from watchers import MPVWatcher, MPCHCWatcher, VLCWatcher, WindowTitleWatcher, BaseWatcher
    from settings import SettingsManager
    from nyaa import NyaaInterface

class TrackerAgent:
    def __init__(self):
        self.anilist = AnilistClient()
        self.settings = SettingsManager()
        self.nyaa = NyaaInterface()
        
        # Prioritized list of watchers based on platform
        if sys.platform == "win32":
            self.watchers: List[BaseWatcher] = [
                MPCHCWatcher(),
                VLCWatcher(),
                MPVWatcher(),
                WindowTitleWatcher()
            ]
        else:
            self.watchers: List[BaseWatcher] = [
                MPVWatcher(),
                VLCWatcher(),
                WindowTitleWatcher()
            ]
            
        self.active_watcher: Optional[BaseWatcher] = None
        self.running = False
        
        # Track state so we don't spam the API
        self.last_synced_filename: Optional[str] = None
        self.active_filename: Optional[str] = None
        self.current_anilist_progress: int = 0
        self.current_media_id: Optional[int] = None
        self._cached_anilist_episodes: Optional[int] = None

        # When multiple seasons exist, we store a map of media IDs -> media info
        # and allow the UI to select which season to show/sync.
        self.current_media_map: Dict[int, Dict[str, Any]] = {}
        self.selected_media_id: Optional[int] = None

    @staticmethod
    @staticmethod
    def _resolve_episode_to_media(media: Dict[str, Any], global_episode: int) -> tuple[Dict[str, Any], int]:
        """Resolve a global episode number into the correct AniList media and local episode."""
        remaining: int = int(global_episode)
        visited = set()
        current: Any = media

        while current and isinstance(current, dict):
            media_id = current.get('id')
            if media_id is None or media_id in visited:
                break
            visited.add(media_id)

            episodes_val = current.get('episodes')
            if episodes_val is None or not str(episodes_val).isdigit():
                return cast(Dict[str, Any], current), int(remaining)
            
            ep_count: int = int(episodes_val)
            if ep_count <= 0:
                return cast(Dict[str, Any], current), int(remaining)

            if remaining <= ep_count:
                return cast(Dict[str, Any], current), int(remaining)

            relations = current.get('relations', {}).get('edges', []) or []
            next_media = None
            for edge in relations:
                if edge.get('relationType') == 'SEQUEL' and isinstance(edge.get('node'), dict):
                    node = edge.get('node')
                    if node.get('id') not in visited:
                        next_media = node
                        break

            if not next_media:
                return cast(Dict[str, Any], current), ep_count
            
            # Use a temporary variable to help linter with type inference
            new_remaining: int = int(remaining) - int(ep_count)
            remaining = new_remaining
            current = next_media

        fallback_episodes = media.get('episodes')
        f_ep = int(fallback_episodes) if fallback_episodes and str(fallback_episodes).isdigit() else int(global_episode)
        return media, min(int(global_episode), f_ep)

    @staticmethod
    def _build_media_map(media: Dict[str, Any]) -> Dict[int, Dict[str, Any]]:
        """Build a map of related media entries keyed by media ID (e.g., seasons)."""
        media_map: Dict[int, Dict[str, Any]] = {}
        queue = [media]
        seen = set()

        while queue:
            current = queue.pop(0)
            if not current or not isinstance(current, dict):
                continue
            media_id = current.get('id')
            if media_id is None or media_id == "" or media_id in seen:
                continue
            seen.add(media_id)
            media_map[int(media_id)] = current

            relations = current.get('relations', {}).get('edges', []) or []
            for edge in relations:
                if edge.get('relationType') == 'SEQUEL' and isinstance(edge.get('node'), dict):
                    queue.append(edge['node'])

        return media_map

    def set_selected_media(self, media_id: Optional[int]):
        """Set which media (season) is currently selected in the UI."""
        if media_id is None:
            self.selected_media_id = None
            return

        if media_id in self.current_media_map:
            self.selected_media_id = media_id
        else:
            # If the selected media isn't in the current map, ignore.
            print(f"Selected media {media_id} not in current media map")

    def get_progress_for_media(self, media_id: int) -> int:
        """Return the user's AniList progress for the provided media ID."""
        entry = self.anilist.get_list_entry(media_id)
        if entry:
            return entry.get('progress') or 0
        return 0
        
    def start(self):
        print(f"Starting Multi-Player Anilist Tracker Agent v{VERSION} on {sys.platform}...")
        self.running = True
        
        while self.running:
            # Find an active watcher
            found_active = False
            
            # 1. If we have an active watcher, check if it's still alive
            active = self.active_watcher
            if active is not None:
                if active.is_connected and active.check_connection():
                    filename = active.get_current_filename()
                    if filename:
                        found_active = True
                        self._process_active_file(filename)
                    else:
                        # Connected but nothing playing
                        if self.active_filename:
                            print(f"Playback stopped on {active.__class__.__name__}. Syncing: {self.active_filename}")
                            self.sync_progress(self.active_filename)
                            self.active_filename = None
                        
                        # We stay with this watcher for a bit or look for others?
                        # Usually, if one is connected, we stick to it unless it dies.
                        found_active = True 
                else:
                    watcher_name = active.__class__.__name__
                    print(f"Watcher {watcher_name} disconnected.")
                    if self.active_filename:
                        self.sync_progress(self.active_filename)
                        self.active_filename = None
                    self.active_watcher = None

            # 2. If no active watcher or it died, look for a new one
            if not found_active:
                for watcher in self.watchers:
                    # Try to connect if not connected
                    if not watcher.is_connected:
                        watcher.connect()
                    
                    if watcher.is_connected and watcher.check_connection():
                        filename = watcher.get_current_filename()
                        if filename:
                            print(f"Detected activity on {watcher.__class__.__name__}: {filename}")
                            self.active_watcher = watcher
                            self._process_active_file(filename)
                            found_active = True
                            break
            
            # Sleep a bit to prevent CPU spinning
            time.sleep(2 if not found_active else 1)

    def _process_active_file(self, filename: str):
        """Internal helper to handle filename changes and progress fetching."""
        if self.active_filename and self.active_filename != filename:
            print(f"File changed. Syncing previous file: {self.active_filename}")
            self.sync_progress(self.active_filename)
            
        if self.active_filename != filename:
            self.active_filename = filename
            self._fetch_current_anilist_progress(filename)

    def _sync_to_media(self, media_id: int, episode: int) -> bool:
        """Update AniList progress for a specific media ID."""
        romaji_title = None
        if self.current_media_map and media_id in self.current_media_map:
            romaji_title = self.current_media_map[media_id].get('title', {}).get('romaji')
        if not romaji_title:
            romaji_title = str(media_id)

        print(f"Syncing to AniList: media {media_id} (" + romaji_title + ") episode {episode}")
        success = self.anilist.update_progress(media_id, episode)
        if success:
            print(f"Successfully synced {romaji_title} progress to episode {episode}")
            self.current_anilist_progress = episode
            return True
        print("Failed to sync progress to Anilist.")
        return False

    def sync_progress(self, filename: Optional[str]):
        if not filename:
             return
        print(f"Parsing filename: {filename}")
        parsed = AnimeParser.parse_filename(filename)
        if not parsed or not parsed.get('title'):
            print("Could not parse title from filename.")
            return

        title = parsed['title']
        episode = parsed.get('episode', 1)  # Default to 1 if it can't be found (e.g. movies)

        # In guessit, episode might be a list if it's a batch, we take the last one or the only one
        if isinstance(episode, list):
            episode = episode[-1]

        print(f"Matched Anime: '{title}', Episode: {episode}")

        # Search Anilist
        print(f"Searching Anilist for '{title}'...")
        result = self.anilist.search_anime(title)
        if not result:
            print("No matching anime found on Anilist.")
            return

        # If the parsed episode exceeds the first media's episode count, attempt to
        # resolve to the correct sequel (e.g. "E16" in a 10-episode show should map to
        # season 2 episode 6).
        target_media, target_episode = self._resolve_episode_to_media(result, episode)
        media_id = target_media.get('id')
        if not isinstance(media_id, int):
            print(f"Error: media_id {media_id} is not an integer.")
            return

        print(f"Found on Anilist: {target_media.get('title', {}).get('romaji')} (ID: {media_id})")
        print(f"Resolved to media ID {media_id} at episode {target_episode}")

        success = self._sync_to_media(media_id, target_episode)
        if success:
            self.last_synced_filename = filename

    def sync_progress_by_media(self, media_id: int, episode: int):
        """Sync a specific media ID to the given episode."""
        print(f"Syncing media {media_id} to episode {episode}")
        success = self._sync_to_media(media_id, episode)
        if success:
            self.last_synced_filename = None
        return success

    def _fetch_current_anilist_progress(self, filename: Optional[str]):
        if not filename:
            return
        self.current_anilist_progress = 0
        self.current_media_id = None
        self._cached_anilist_episodes = None
        self.current_media_map = {}
        self.selected_media_id = None

        parsed = AnimeParser.parse_filename(filename)
        if not parsed or not parsed.get('title'):
            return

        title = parsed['title']
        episode = parsed.get('episode', 1)
        if isinstance(episode, list):
            episode = episode[-1]

        result = self.anilist.search_anime(title)
        if not result:
            return

        # Build a map of related seasons/entries and choose the best media for the current episode.
        self.current_media_map = self._build_media_map(result)

        # Default selected media to what our filename maps to (for season rollover).
        resolved_media, _ = self._resolve_episode_to_media(result, episode)
        self.selected_media_id = resolved_media.get('id')

        media_id = self.selected_media_id
        self.current_media_id = media_id
        if media_id:
            self.settings.update_media_folder(media_id, os.path.dirname(os.path.abspath(filename)))
            
        self._cached_anilist_episodes = resolved_media.get('episodes')
        entry = self.anilist.get_list_entry(media_id)
        if entry:
            self.current_anilist_progress = entry.get('progress') or 0

    def sync_progress_manual(self, filename: Optional[str], override_episode: int, media_id: Optional[int] = None):
        if filename:
            print(f"Manual sync requested for filename: {filename} at Episode {override_episode}")
            parsed = AnimeParser.parse_filename(filename)
            if not parsed or not parsed.get('title'):
                print("Could not parse title from filename for manual sync.")
                return
            title = parsed['title']
            print(f"Matched Anime: '{title}', Episode Override: {override_episode}")

            # If a media_id is supplied, use it directly; otherwise lookup via title.
            target_media = None
            if media_id and self.current_media_map and media_id in self.current_media_map:
                target_media = self.current_media_map[media_id]
            else:
                print(f"Searching Anilist for '{title}'...")
                result = self.anilist.search_anime(title)
                if not result:
                    print("No matching anime found on Anilist.")
                    return
                target_media, _ = self._resolve_episode_to_media(result, override_episode)

            if not target_media:
                print("Could not determine which media to sync to.")
                return

            media_id = target_media.get('id')
            romaji_title = target_media.get('title', {}).get('romaji') or title
            print(f"Found on Anilist: {romaji_title} (ID: {media_id})")
            print(f"Resolved to media ID {media_id} at episode {override_episode}")

        if not isinstance(media_id, int):
            print("No valid media_id provided for manual sync.")
            return

        success = self._sync_to_media(media_id, override_episode)
        if success:
            self.last_synced_filename = filename

    def stop(self):
        self.running = False
        for watcher in self.watchers:
            watcher.disconnect()

if __name__ == "__main__":
    try:
        from src.web_server import run_server_in_background
    except ImportError:
        # Fallback for if we're not running as a package
        from web_server import run_server_in_background
    
    agent = TrackerAgent()
    
    if not agent.anilist.is_authenticated():
        print("Warning: No valid AniList token found. Running in local cache mode.")
        
    # Start the web UI server on port 8080
    run_server_in_background(agent, 8080)
    
    # Run Agent synchronously in the main thread (blocks forever)
    try:
        agent.start()
    except KeyboardInterrupt:
        print("\nStopping Tracker Agent...")
        agent.stop()
