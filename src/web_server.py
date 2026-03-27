import json
import http.server
import socketserver
import threading
import os
import urllib.parse
import glob
from src.main import TrackerAgent  # type: ignore

from typing import Optional

class TrackerStateHandler(http.server.SimpleHTTPRequestHandler):
    agent: TrackerAgent = None
    
    # We store the manual override at the class level for simplicity the UI
    manual_episode_override: Optional[int] = None
    
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
            display_episode = 0
            total_episodes = 0
            anilist_progress = 0
            anilist_total_episodes = None

            selected_media = None
            season_options = []
            media_details = None

            if self.agent and self.agent.watcher.is_connected:
                filename = self.agent.watcher.get_current_filename()
                if filename:
                    total_episodes = self._get_total_episodes(filename)

                    from src.parser import AnimeParser  # type: ignore
                    parsed = AnimeParser.parse_filename(filename)
                    if parsed and parsed.get('title'):
                        base_title = parsed['title']
                        ep_val = parsed.get('episode')
                        if isinstance(ep_val, list):
                            ep_val = ep_val[-1]

                        season_val = parsed.get('season')

                        # If we have a manual override, use it instead of parsed
                        if TrackerStateHandler.manual_episode_override is not None:
                            episode = TrackerStateHandler.manual_episode_override
                        else:
                            episode = ep_val if ep_val is not None else 1
                            TrackerStateHandler.manual_episode_override = episode

                        # Display correction: if the episode count is larger than the selected media
                        # and we can find a season 1 episode count, show the difference.
                        display_episode = episode
                        if isinstance(episode, int) and episode > 0:
                            # Determine selected media context
                            selected_media = None
                            if hasattr(self.agent, 'selected_media_id') and self.agent.selected_media_id:
                                selected_media = self.agent.current_media_map.get(self.agent.selected_media_id)

                            # Find season 1 in the current map
                            season1_episodes = None
                            if hasattr(self.agent, 'current_media_map'):
                                for m in self.agent.current_media_map.values():
                                    if m.get('season') == 1 and isinstance(m.get('episodes'), int):
                                        season1_episodes = m.get('episodes')
                                        break

                            if (
                                selected_media
                                and isinstance(selected_media.get('episodes'), int)
                                and season1_episodes
                                and episode > selected_media.get('episodes')
                                and episode > season1_episodes
                            ):
                                display_episode = episode - season1_episodes

                        # Prefer to display season number when available (e.g. "S2 E6")
                        season_label = None
                        if selected_media and isinstance(selected_media.get('season'), int):
                            season_label = f"S{selected_media.get('season')}"
                        elif season_val is not None:
                            try:
                                season_int = int(season_val)
                                season_label = f"S{season_int}"
                            except Exception:
                                season_label = None

                        if season_label:
                            title = f"{base_title} - {season_label} E{display_episode}"
                        else:
                            title = f"{base_title} - E{display_episode}"
                    else:
                        title = filename
                        display_episode = episode
                        TrackerStateHandler.manual_episode_override = None

                    # Build season options and find selected media
                    if hasattr(self.agent, 'current_media_map'):
                        season_options = []
                        for mid, data in self.agent.current_media_map.items():
                            season_options.append({
                                'mediaId': mid,
                                'title': data.get('title', {}).get('romaji') or data.get('title', {}).get('english') or '',
                                'episodes': data.get('episodes'),
                                'season': data.get('season'),
                                'seasonYear': data.get('seasonYear'),
                                'popularity': data.get('popularity'),
                                'averageScore': data.get('averageScore'),
                            })

                        selected_id = getattr(self.agent, 'selected_media_id', None)
                        if selected_id is None and season_options:
                            selected_id = season_options[0]['mediaId']
                        if selected_id:
                            selected_media = self.agent.current_media_map.get(selected_id)

                    if selected_media:
                        media_details = {
                            'mediaId': selected_media.get('id'),
                            'title': selected_media.get('title', {}),
                            'description': selected_media.get('description'),
                            'episodes': selected_media.get('episodes'),
                            'season': selected_media.get('season'),
                            'seasonYear': selected_media.get('seasonYear'),
                            'popularity': selected_media.get('popularity'),
                            'averageScore': selected_media.get('averageScore'),
                            'coverImage': selected_media.get('coverImage'),
                            'bannerImage': selected_media.get('bannerImage'),
                            'status': selected_media.get('status'),
                        }

                        # Use the AniList progress for the selected media
                        anilist_progress = self.agent.get_progress_for_media(selected_id)
                        self.agent.selected_media_id = selected_id

                        # Use the selected media's episode count for progress bar
                        anilist_total_episodes = selected_media.get('episodes')
                    else:
                        anilist_progress = getattr(self.agent, 'current_anilist_progress', 0)
                        anilist_total_episodes = getattr(self.agent, '_cached_anilist_episodes', None)

                    is_running = True
            else:
                TrackerStateHandler.manual_episode_override = None

            response = {
                "running": is_running,
                "title": title,
                "base_title": base_title,
                "watched_episodes": display_episode,
                "total_episodes": total_episodes,
                "anilist_progress": anilist_progress,
                "anilist_total_episodes": anilist_total_episodes,
                "selected_media_id": getattr(self.agent, 'selected_media_id', None),
                "season_options": season_options,
                "media_details": media_details,
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/animelist':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            entries = []
            if self.agent:
                try:
                    entries = self.agent.anilist.get_user_anime_list(['CURRENT', 'PLANNING', 'COMPLETED'])
                except Exception as e:
                    print(f"Error fetching anime list: {e}")
            
            self.wfile.write(json.dumps(entries).encode('utf-8'))
        elif self.path == '/api/settings':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            settings = {}
            if self.agent and hasattr(self.agent, 'settings'):
                settings = {
                    'preferred_groups': ", ".join(self.agent.settings.preferred_groups),
                    'preferred_resolution': self.agent.settings.preferred_resolution,
                    'default_download_dir': self.agent.settings.default_download_dir
                }
            self.wfile.write(json.dumps(settings).encode('utf-8'))

        elif self.path.startswith('/api/nyaa_batch_search'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            results = []
            if self.agent and hasattr(self.agent, 'anilist') and hasattr(self.agent, 'nyaa'):
                try:
                    entries = self.agent.anilist.get_user_anime_list(['CURRENT'])
                    for entry in entries:
                        progress = entry.get('progress', 0)
                        episodes = entry.get('episodes')
                        if episodes and progress >= episodes:
                            continue
                            
                        next_ep = progress + 1
                        title = entry.get('title', {}).get('romaji') or entry.get('title', {}).get('english')
                        if not title:
                            continue
                            
                        search_res = self.agent.nyaa.search(
                            title, 
                            next_ep, 
                            self.agent.settings.preferred_resolution, 
                            self.agent.settings.preferred_groups
                        )
                        
                        if search_res:
                            # top result
                            torrent = search_res[0]
                            results.append({
                                'mediaId': entry.get('mediaId'),
                                'animeTitle': title,
                                'episode': next_ep,
                                'torrent': torrent
                            })
                except Exception as e:
                    print(f"Error in nyaa_batch_search: {e}")

            self.wfile.write(json.dumps(results).encode('utf-8'))
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
            
        elif self.path == '/api/select_season':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            media_id = data.get('mediaId')
            if self.agent and hasattr(self.agent, 'set_selected_media'):
                self.agent.set_selected_media(media_id)
            self.wfile.write(json.dumps({"success": True, "selected_media_id": media_id}).encode('utf-8'))

        elif self.path == '/api/update_progress':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            media_id = data.get('mediaId')
            episode = data.get('episode')

            success = False
            if self.agent and media_id and episode is not None:
                if hasattr(self.agent, 'sync_progress_by_media'):
                    success = self.agent.sync_progress_by_media(media_id, int(episode))

            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/reauthorize':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            success = False
            if self.agent and hasattr(self.agent, 'anilist'):
                try:
                    success = self.agent.anilist.authenticate()
                except Exception as e:
                    print(f"Reauthorization failed: {e}")

            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/full_refresh':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            # Clear agent caches
            if self.agent:
                self.agent.current_media_map = {}
                self.agent.selected_media_id = None
                self.agent.current_anilist_progress = 0
                self.agent.current_media_id = None
                self.agent._cached_anilist_episodes = None
                self.agent.last_synced_filename = None
                if hasattr(self.agent, 'anilist'):
                    self.agent.anilist.user_id = None

            # Reset manual override
            TrackerStateHandler.manual_episode_override = None

            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path == '/api/sync':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            success = False
            if self.agent and self.agent.watcher.is_connected:
                filename = self.agent.watcher.get_current_filename()
                if filename:
                    # Sync with the manually overridden episode number if present
                    if hasattr(self.agent, 'sync_progress_manual') and TrackerStateHandler.manual_episode_override is not None:
                        self.agent.sync_progress_manual(filename, TrackerStateHandler.manual_episode_override, getattr(self.agent, 'selected_media_id', None))
                        success = True
                    else:
                        # Fallback to normal sync
                        self.agent.sync_progress(filename)
                        success = True

            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))
        elif self.path == '/api/settings':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            
            if self.agent and hasattr(self.agent, 'settings'):
                if 'preferred_groups' in data:
                    self.agent.settings.preferred_groups = [g.strip() for g in data['preferred_groups'].split(',') if g.strip()]
                if 'preferred_resolution' in data:
                    self.agent.settings.preferred_resolution = data['preferred_resolution']
                if 'default_download_dir' in data:
                    self.agent.settings.default_download_dir = data['default_download_dir']
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path == '/api/nyaa_download':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            
            url = data.get('url')
            media_id = data.get('mediaId')
            
            success = False
            if self.agent and hasattr(self.agent, 'nyaa') and url and media_id:
                download_dir = self.agent.settings.get_media_folder(int(media_id))
                path = self.agent.nyaa.download_torrent(url, download_dir)
                success = bool(path)
                
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))
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
