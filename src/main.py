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
        
    def start(self):
        print("Starting MPV Anilist Tracker Agent...")
        self.running = True
        print("Waiting for MPV to start on IPC socket: /tmp/mpvsocket")
        
        while self.running:
            if not self.anilist.is_authenticated():
                time.sleep(2)
                continue
                
            if not self.watcher.is_connected:
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
                # We are connected, check progress
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
            
        media_id = result['id']
        romaji_title = result['title']['romaji']
        
        print(f"Found on Anilist: {romaji_title} (ID: {media_id})")
        
        # Update progress
        success = self.anilist.update_progress(media_id, episode)
        if success:
            print(f"Successfully synced {romaji_title} progress to episode {episode}")
            self.last_synced_filename = filename
            # Update local cache so we don't need to refetch instantly
            self.current_anilist_progress = episode
        else:
            print("Failed to sync progress to Anilist.")

    def _fetch_current_anilist_progress(self, filename: str):
        self.current_anilist_progress = 0
        self.current_media_id = None
        
        parsed = AnimeParser.parse_filename(filename)
        if not parsed or not parsed.get('title'):
            return
            
        title = parsed['title']
        result = self.anilist.search_anime(title)
        if not result:
            return
            
        media_id = result['id']
        self.current_media_id = media_id
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

        media_id = result['id']
        romaji_title = result['title']['romaji']

        print(f"Found on Anilist: {romaji_title} (ID: {media_id})")

        # Update progress
        success = self.anilist.update_progress(media_id, override_episode)
        if success:
            print(f"Successfully synced {romaji_title} progress manually to episode {override_episode}")
            self.last_synced_filename = filename
            self.current_anilist_progress = override_episode
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
