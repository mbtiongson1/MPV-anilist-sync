import json
import http.server
import socketserver
import threading
import os
import urllib.parse
import glob
from src.main import TrackerAgent  # type: ignore

from typing import Optional, Any, Dict

class TrackerStateHandler(http.server.SimpleHTTPRequestHandler):
    agent: TrackerAgent = None
    
    # We store the manual override at the class level for simplicity the UI
    manual_episode_override: Optional[int] = None
    _auth_lock = threading.Lock()
    _auth_thread: Optional[threading.Thread] = None
    _auth_last_error: Optional[str] = None
    
    def __init__(self, *args, **kwargs):
        # Serve files from the static directory by default
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'static'), **kwargs)

    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _get_total_episodes(self, filename: str) -> int:
        try:
            dir_path = os.path.dirname(filename)
            if not dir_path or not os.path.exists(dir_path):
                return 0
                
            # Count common video files in the same directory
            video_exts = ('*.mkv', '*.mp4', '*.avi')
            count = 0
            for ext in video_exts:
                count += len(glob.glob(os.path.join(dir_path, ext)))
            return count
        except Exception:
            return 0

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            # Prepare state
            is_running = False
            title = ""
            base_title = ""
            episode = 0
            total_episodes = 0
            anilist_progress = 0

            # AniList auth state
            anilist_has_token = False
            anilist_authenticated = False
            anilist_error: Optional[str] = None
            anilist_user: Optional[Dict[str, Any]] = None
            anilist_auth_in_progress = False
            anilist_auth_last_error: Optional[str] = None
            if self.agent:
                state = self.agent.anilist.get_auth_state()
                anilist_has_token = bool(state.get("has_token"))
                anilist_authenticated = bool(state.get("authenticated"))
                anilist_error = state.get("error")
                viewer = state.get("viewer")
                if isinstance(viewer, dict) and (viewer.get("id") or viewer.get("name")):
                    anilist_user = {"id": viewer.get("id"), "name": viewer.get("name")}

            with TrackerStateHandler._auth_lock:
                if TrackerStateHandler._auth_thread and TrackerStateHandler._auth_thread.is_alive():
                    anilist_auth_in_progress = True
                anilist_auth_last_error = TrackerStateHandler._auth_last_error
            
            if self.agent and self.agent.watcher.is_connected:
                filename = self.agent.watcher.get_current_filename()
                if filename:
                    total_episodes = self._get_total_episodes(filename)
                    anilist_progress = getattr(self.agent, 'current_anilist_progress', 0)
                    
                    from src.parser import AnimeParser  # type: ignore
                    parsed = AnimeParser.parse_filename(filename)
                    if parsed and parsed.get('title'):
                        base_title = parsed['title']
                        ep_val = parsed.get('episode')
                        if isinstance(ep_val, list):
                            ep_val = ep_val[-1]
                            
                        # If we have a manual override, use it instead of parsed
                        if TrackerStateHandler.manual_episode_override is not None:
                            episode = TrackerStateHandler.manual_episode_override
                        else:
                            episode = ep_val if ep_val is not None else 1
                            TrackerStateHandler.manual_episode_override = episode
                            
                        title = f"{base_title} - E{episode}"
                    else:
                        title = filename
                        TrackerStateHandler.manual_episode_override = None
                        
                    is_running = True
            else:
                TrackerStateHandler.manual_episode_override = None
            
            # Try to get the AniList total episode count for more accurate progress
            anilist_total_episodes = getattr(self.agent, '_cached_anilist_episodes', None)
            
            response = {
                "running": is_running,
                "title": title,
                "base_title": base_title,
                "watched_episodes": episode,
                "total_episodes": total_episodes,
                "anilist_progress": anilist_progress,
                "anilist_total_episodes": anilist_total_episodes,
                "anilist_has_token": anilist_has_token,
                "anilist_authenticated": anilist_authenticated,
                "anilist_error": anilist_error,
                "anilist_user": anilist_user,
                "anilist_auth_in_progress": anilist_auth_in_progress,
                "anilist_auth_last_error": anilist_auth_last_error,
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/animelist':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            entries = []
            if self.agent and self.agent.anilist.is_authenticated():
                try:
                    entries = self.agent.anilist.get_user_anime_list(['CURRENT', 'PLANNING'])
                except Exception as e:
                    print(f"Error fetching anime list: {e}")
            
            self.wfile.write(json.dumps(entries).encode('utf-8'))
        else:
            # Fallback to serving static files
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/adjust_episode':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            change = data.get('change', 0)
            if TrackerStateHandler.manual_episode_override is not None:
                TrackerStateHandler.manual_episode_override = max(1, TrackerStateHandler.manual_episode_override + change)
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "new_episode": TrackerStateHandler.manual_episode_override}).encode('utf-8'))
            
        elif self.path == '/api/sync':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            success = False
            error: Optional[str] = None
            if not self.agent or not self.agent.anilist.is_authenticated():
                error = "AniList not authenticated."
                self.wfile.write(json.dumps({"success": False, "error": error}).encode('utf-8'))
                return
            if self.agent and self.agent.watcher.is_connected:
                filename = self.agent.watcher.get_current_filename()
                if filename:
                    # Sync with the manually overridden episode number
                    # We inject it into the agent or let agent parse it normally?
                    # Since agent calls AnimeParser, we might need a custom sync function or a hack.
                    # Best way: Agent's sync_progress parses it again. Let's add an optional episode parameter to sync_progress.
                    # For now, we will just call the method directly with the override.
                    
                    if hasattr(self.agent, 'sync_progress_manual') and TrackerStateHandler.manual_episode_override is not None:
                        # We'll need to modify src/main.py to support manual episode overrides
                        self.agent.sync_progress_manual(filename, TrackerStateHandler.manual_episode_override)
                        success = True
                    else:
                        # Fallback to normal sync
                        self.agent.sync_progress(filename)
                        success = True
                        
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))
        elif self.path == '/api/auth/start':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            if not self.agent:
                self.wfile.write(json.dumps({"started": False, "error": "Agent not available."}).encode('utf-8'))
                return

            auth_url = self.agent.anilist.get_auth_url()
            with TrackerStateHandler._auth_lock:
                if TrackerStateHandler._auth_thread and TrackerStateHandler._auth_thread.is_alive():
                    self.wfile.write(json.dumps({
                        "started": False,
                        "auth_url": auth_url,
                        "error": "Authentication already in progress.",
                    }).encode('utf-8'))
                    return

                TrackerStateHandler._auth_last_error = None
                agent = self.agent

                def run_auth():
                    ok = False
                    err: Optional[str] = None
                    try:
                        ok = agent.anilist.authenticate(open_browser=False)
                        if not ok:
                            err = agent.anilist.get_auth_state(force_refresh=True).get("error") or "Authentication failed."
                    except Exception as e:
                        err = str(e)
                    finally:
                        with TrackerStateHandler._auth_lock:
                            TrackerStateHandler._auth_last_error = err

                thread = threading.Thread(target=run_auth, daemon=True)
                TrackerStateHandler._auth_thread = thread
                thread.start()

            self.wfile.write(json.dumps({"started": True, "auth_url": auth_url}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    # Suppress logging to keep the terminal clean
    def log_message(self, format, *args):
        pass

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def start_web_server(agent: TrackerAgent, port: int = 8080):
    TrackerStateHandler.agent = agent
    handler = TrackerStateHandler
    
    with ReusableTCPServer(("", port), handler) as httpd:
        print(f"UI Server started at http://localhost:{port}")
        httpd.serve_forever()

def run_server_in_background(agent: TrackerAgent, port: int = 8080):
    thread = threading.Thread(target=start_web_server, args=(agent, port), daemon=True)
    thread.start()
    return thread
