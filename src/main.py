import time
import os
import sys
import threading

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
        self.last_synced_filename = None
        self.active_filename = None
        
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
                if self.active_filename:
                    print(f"MPV disconnected/closed. Syncing latest file: {self.active_filename}")
                    self.sync_progress(self.active_filename)
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
                    if self.active_filename and self.active_filename != filename:
                        print(f"File changed. Syncing previous file: {self.active_filename}")
                        self.sync_progress(self.active_filename)
                        
                    self.active_filename = filename
                else:
                    # filename is None (e.g. video stopped but mpv still open)
                    if self.active_filename:
                        print(f"Playback stopped. Syncing previous file: {self.active_filename}")
                        self.sync_progress(self.active_filename)
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
        else:
            print("Failed to sync progress to Anilist.")

    def stop(self):
        self.running = False
        self.watcher.disconnect()

if __name__ == "__main__":
    from src.ui import TrackerUI
    
    agent = TrackerAgent()
    ui = TrackerUI(agent)
    
    # Run Agent in background thread
    agent_thread = threading.Thread(target=agent.start, daemon=True)
    agent_thread.start()
    
    # Run UI in main thread
    try:
        ui.run()
    except KeyboardInterrupt:
        print("\nStopping Tracker Agent...")
        ui.quit_app()
