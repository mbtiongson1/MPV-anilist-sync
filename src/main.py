import time
import os
import sys
import threading
from typing import Optional, Dict, Any

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.anilist import AnilistClient
from src.parser import AnimeParser
from src.mpv_watcher import MPVWatcher

class TrackerAgent:
    def __init__(self):
        self.anilist = AnilistClient()
        self.watcher = MPVWatcher()
        self.running = False
        
        # Track state so we don't spam the API
        self.last_synced_filename: Optional[str] = None
        self.active_filename: Optional[str] = None
        self.current_anilist_progress: int = 0
        self.current_media_id: Optional[int] = None
        self._cached_anilist_episodes: Optional[int] = None

    @staticmethod
    def _resolve_episode_to_media(media: Dict[str, Any], global_episode: int) -> tuple[Dict[str, Any], int]:
        """Resolve a global episode number into the correct AniList media and local episode.

        Sometimes a filename includes a global episode count across multiple seasons (e.g.
        season 1 has 10 eps, so "E16" actually refers to season 2 episode 6).

        This function walks `media.relations.edges` looking for sequels and subtracts
        known episode counts until the episode fits into a single media entry.
        """
        remaining = global_episode
        visited = set()
        current = media

        while current and isinstance(current, dict):
            media_id = current.get('id')
            if media_id is None or media_id in visited:
                break
            visited.add(media_id)

            episodes = current.get('episodes')
            # If the media has an unknown episode count, assume the current media is the best match
            if not episodes or episodes <= 0:
                return current, remaining

            # If the remaining episode fits within this media, we're done
            if remaining <= episodes:
                return current, remaining

            # Otherwise, attempt to roll over into a sequel
            relations = current.get('relations', {}).get('edges', []) or []
            next_media = None
            for edge in relations:
                if edge.get('relationType') == 'SEQUEL' and isinstance(edge.get('node'), dict):
                    node = edge.get('node')
                    if node.get('id') not in visited:
                        next_media = node
                        break

            if not next_media:
                # No known sequel; clamp to the last episode of the current media
                return current, episodes

            remaining -= episodes
            current = next_media

        # Fallback: return original media
        return media, min(global_episode, media.get('episodes') or global_episode)
        
    def start(self):
        print("Starting MPV Anilist Tracker Agent...")
        self.running = True
        print("Waiting for MPV to start on IPC socket: /tmp/mpvsocket")
        
        while self.running:
            if not self.anilist.is_authenticated():
                time.sleep(2)
                continue
                
            if not self.watcher.is_connected or not self.watcher.check_connection():
                # Disconnected. Sync active file if it exists.
                active_file = self.active_filename
                if active_file:
                    print(f"MPV disconnected/closed. Syncing latest file: {active_file}")
                    self.sync_progress(active_file)
                    self.active_filename = None
                    
                # Try to connect periodically
                connected = self.watcher.connect()
                if connected:
                    print("Connected to MPV IPC socket!")
                else:
                    time.sleep(2)
                    continue
                    
            try:
                # We are connected and alive, check progress
                filename = self.watcher.get_current_filename()
                
                if filename:
                    # File changed inside MPV without closing
                    active_file = self.active_filename
                    if active_file and active_file != filename:
                        print(f"File changed. Syncing previous file: {active_file}")
                        self.sync_progress(active_file)
                        
                    if self.active_filename != filename:
                        self.active_filename = filename
                        self._fetch_current_anilist_progress(filename)
                else:
                    # filename is None (e.g. video stopped but mpv still open)
                    active_file = self.active_filename
                    if active_file:
                        print(f"Playback stopped. Syncing previous file: {active_file}")
                        self.sync_progress(active_file)
                        self.active_filename = None
                
                # Sleep a bit to prevent CPU spinning
                time.sleep(1)
            except Exception as e:
                print(f"Error checking MPV state: {e}")
                self.watcher.disconnect()
                time.sleep(2)

    def sync_progress(self, filename: str):
        print(f"Parsing filename: {filename}")
        parsed = AnimeParser.parse_filename(filename)
        if not parsed or not parsed.get('title'):
            print("Could not parse title from filename.")
            return
            
        title = parsed['title']
        episode = parsed.get('episode', 1) # Default to 1 if it can't be found (e.g. movies)
        
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
        romaji_title = target_media.get('title', {}).get('romaji') or title

        print(f"Found on Anilist: {romaji_title} (ID: {media_id})")
        print(f"Resolved to media ID {media_id} at episode {target_episode}")

        # Update progress
        success = self.anilist.update_progress(media_id, target_episode)
        if success:
            print(f"Successfully synced {romaji_title} progress to episode {target_episode}")
            self.last_synced_filename = filename
            # Update local cache so we don't need to refetch instantly
            self.current_anilist_progress = target_episode
        else:
            print("Failed to sync progress to Anilist.")

    def _fetch_current_anilist_progress(self, filename: str):
        self.current_anilist_progress = 0
        self.current_media_id = None
        self._cached_anilist_episodes = None
        
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

        target_media, _ = self._resolve_episode_to_media(result, episode)
        media_id = target_media.get('id')
        self.current_media_id = media_id
        self._cached_anilist_episodes = target_media.get('episodes')
        entry = self.anilist.get_list_entry(media_id)
        if entry:
            self.current_anilist_progress = entry.get('progress') or 0

    def sync_progress_manual(self, filename: str, override_episode: int):
        print(f"Manual sync requested for filename: {filename} at Episode {override_episode}")
        parsed = AnimeParser.parse_filename(filename)
        if not parsed or not parsed.get('title'):
            print("Could not parse title from filename for manual sync.")
            return

        title = parsed['title']
        print(f"Matched Anime: '{title}', Episode Override: {override_episode}")

        # Search Anilist
        print(f"Searching Anilist for '{title}'...")
        result = self.anilist.search_anime(title)
        if not result:
            print("No matching anime found on Anilist.")
            return

        target_media, target_episode = self._resolve_episode_to_media(result, override_episode)
        media_id = target_media.get('id')
        romaji_title = target_media.get('title', {}).get('romaji') or title

        print(f"Found on Anilist: {romaji_title} (ID: {media_id})")
        print(f"Resolved to media ID {media_id} at episode {target_episode}")

        # Update progress
        success = self.anilist.update_progress(media_id, target_episode)
        if success:
            print(f"Successfully synced {romaji_title} progress manually to episode {target_episode}")
            self.last_synced_filename = filename
            self.current_anilist_progress = target_episode
        else:
            print("Failed to sync progress to Anilist.")

    def stop(self):
        self.running = False
        self.watcher.disconnect()

if __name__ == "__main__":
    from src.web_server import run_server_in_background
    
    agent = TrackerAgent()
    
    if not agent.anilist.is_authenticated():
        print("Error: No valid AniList token found in config.json. Please add your token.")
        exit(1)
        
    # Start the web UI server on port 8080
    run_server_in_background(agent, 8080)
    
    # Run Agent synchronously in the main thread (blocks forever)
    try:
        agent.start()
    except KeyboardInterrupt:
        print("\nStopping Tracker Agent...")
        agent.stop()
