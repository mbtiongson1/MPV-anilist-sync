import json
import re
import http.server
import socketserver
import threading
import os
import urllib.parse
import glob
import requests
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

            if self.agent and self.agent.active_watcher and self.agent.active_watcher.is_connected:
                filename = self.agent.active_watcher.get_current_filename()
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

                        # Display correction
                        display_episode = episode
                        if isinstance(episode, int) and episode > 0:
                            selected_media = None
                            if hasattr(self.agent, 'selected_media_id') and self.agent.selected_media_id:
                                selected_media = self.agent.current_media_map.get(self.agent.selected_media_id)

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

                    # Build season options
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
                        studios_nodes = selected_media.get('studios', {}).get('nodes', [])
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
                            'studio': studios_nodes[0]['name'] if studios_nodes else None,
                            'nextAiringEpisode': selected_media.get('nextAiringEpisode'),
                        }
                        anilist_progress = self.agent.get_progress_for_media(selected_id)
                        self.agent.selected_media_id = selected_id
                        anilist_total_episodes = selected_media.get('episodes')
                    else:
                        anilist_progress = getattr(self.agent, 'current_anilist_progress', 0)
                        anilist_total_episodes = getattr(self.agent, '_cached_anilist_episodes', None)

                    is_running = True
                    watcher_name = self.agent.active_watcher.__class__.__name__.replace("Watcher", "")
            else:
                TrackerStateHandler.manual_episode_override = None
                watcher_name = None

            response = {
                "running": is_running,
                "watcher_name": watcher_name,
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
                    entries = self.agent.anilist.get_user_anime_list(['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'])
                except requests.exceptions.HTTPError as e:
                    if e.response.status_code in (400, 401, 403):
                        self.wfile.write(json.dumps({"error": "auth_failed"}).encode('utf-8'))
                        return
                    print(f"Error fetching anime list: {e}")
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
                    'default_download_dir': self.agent.settings.default_download_dir,
                    'base_anime_folder': self.agent.settings.base_anime_folder,
                    'title_overrides': self.agent.settings.title_overrides
                }
            self.wfile.write(json.dumps(settings).encode('utf-8'))

        elif self.path.startswith('/api/nyaa_search'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            search_str = query.get('q', [None])[0]
            episode_str = query.get('episode', [None])[0]
            category = query.get('category', ['1_2'])[0]
            nyaa_filter = query.get('filter', ['0'])[0]
            resolution = query.get('resolution', [None])[0]

            media_id = query.get('media_id', [None])[0]
            
            episode_int: Optional[int] = None
            if episode_str is not None:
                try:
                    episode_int = int(episode_str)
                except (ValueError, TypeError):
                    pass
            
            results = []
            if self.agent and hasattr(self.agent, 'nyaa') and search_str:
                res = resolution if resolution else self.agent.settings.preferred_resolution
                results = self.agent.nyaa.search(
                    search_str,
                    episode_int,
                    res,
                    self.agent.settings.preferred_groups,
                    category=category,
                    nyaa_filter=nyaa_filter,
                )
                
                # Check for existing episodes in library if media_id is provided
                existing_eps = set()
                progress = 0
                if media_id:
                    try:
                        mid = int(media_id)
                        progress = self.agent.get_progress_for_media(mid)
                        media_dir = self.agent.settings.get_media_folder(mid)
                        
                        # Fallback to title-based folder if default
                        if media_dir == self.agent.settings.default_download_dir:
                            from src.parser import AnimeParser
                            cached_list = self.agent.anilist._load_list_cache()
                            anime_info = next((e for e in cached_list if e.get('mediaId') == mid), None)
                            if anime_info:
                                romaji = anime_info.get('title', {}).get('romaji') or ''
                                english = anime_info.get('title', {}).get('english') or ''
                                title = romaji or english
                                title_safe = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip()
                                potential_dir = os.path.join(self.agent.settings.default_download_dir, title_safe)
                                if os.path.exists(potential_dir): media_dir = potential_dir

                        if os.path.exists(media_dir):
                            from src.parser import AnimeParser
                            for f in os.listdir(media_dir):
                                if f.lower().endswith(('.mkv', '.mp4', '.avi')):
                                    parsed = AnimeParser.parse_filename(f)
                                    if parsed:
                                        ep_val = parsed.get('episode')
                                        if isinstance(ep_val, list): ep_val = ep_val[-1]
                                        if ep_val:
                                            try: existing_eps.add(int(ep_val))
                                            except Exception: pass
                    except Exception as e:
                        print(f"Error scanning library for search: {e}")

                for r in results:
                    ep = r.get('episode')
                    r['is_downloaded'] = ep in existing_eps if ep else False
                    r['is_watched'] = ep <= progress if (ep and progress) else False
                    
            self.wfile.write(json.dumps(results).encode('utf-8'))

        elif self.path.startswith('/api/nyaa_batch_search'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            parsed_path = urllib.parse.urlparse(self.path)
            qparams = urllib.parse.parse_qs(parsed_path.query)
            airing_only_str = qparams.get('airing_only', ['true'])[0]
            airing_only = airing_only_str.lower() != 'false'
            category = qparams.get('category', ['1_2'])[0]
            nyaa_filter = qparams.get('filter', ['0'])[0]
            resolution = qparams.get('resolution', [None])[0]
            try:
                max_per_anime = int(qparams.get('max_per_anime', ['1'])[0])
            except (ValueError, TypeError):
                max_per_anime = 1

            results = []
            if self.agent and hasattr(self.agent, 'anilist') and hasattr(self.agent, 'nyaa'):
                try:
                    from concurrent.futures import ThreadPoolExecutor, as_completed
                    entries = self.agent.anilist.get_user_anime_list(['CURRENT'])

                    # Build search tasks
                    tasks = []  # (title_for_search, next_ep, media_id, anime_title, is_downloaded, is_watched)
                    for entry in entries:
                        # Airing-only filter
                        if airing_only and not entry.get('nextAiringEpisode'):
                            continue

                        progress = entry.get('progress', 0)
                        total_episodes = entry.get('episodes')
                        romaji = entry.get('title', {}).get('romaji') or ''
                        english = entry.get('title', {}).get('english') or ''
                        title = romaji or english
                        media_id = entry.get('mediaId')

                        if not title or not media_id:
                            continue

                        # Build title with English fallback using pipe separator
                        search_title = title
                        if english and english != romaji:
                            search_title = f"{romaji}|{english}"

                        # Get airing info for recent highlighting
                        next_airing = entry.get('nextAiringEpisode')
                        airing_at = next_airing.get('airingAt') if next_airing else None

                        missing = []
                        if total_episodes:
                            for ep in range(progress + 1, min(progress + max_per_anime + 1, total_episodes + 1)):
                                missing.append(ep)
                        else:
                            missing.append(progress + 1)

                        media_dir = self.agent.settings.get_media_folder(int(media_id))
                        if media_dir == self.agent.settings.default_download_dir:
                            title_safe = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip()
                            potential_dir = os.path.join(self.agent.settings.default_download_dir, title_safe)
                            if os.path.exists(potential_dir):
                                media_dir = potential_dir

                        existing_eps = set()
                        if os.path.exists(media_dir):
                            from src.parser import AnimeParser
                            for f in os.listdir(media_dir):
                                if f.lower().endswith('.mkv'):
                                    parsed = AnimeParser.parse_filename(f)
                                    if parsed:
                                        ep_val = parsed.get('episode')
                                        if isinstance(ep_val, list):
                                            ep_val = ep_val[-1]
                                        if ep_val:
                                            try:
                                                existing_eps.add(int(ep_val))
                                            except Exception:
                                                pass

                        for next_ep in missing:
                            tasks.append({
                                'search_title': search_title,
                                'anime_title': title,
                                'episode': next_ep,
                                'media_id': media_id,
                                'is_downloaded': next_ep in existing_eps,
                                'is_watched': next_ep <= progress,
                                'airing_at': airing_at,
                                'resolution': resolution or self.agent.settings.preferred_resolution,
                                'groups': self.agent.settings.preferred_groups,
                                'category': category,
                                'nyaa_filter': nyaa_filter,
                            })

                    def _search_task(task):
                        res = self.agent.nyaa.search(
                            task['search_title'],
                            task['episode'],
                            task['resolution'],
                            task['groups'],
                            category=task['category'],
                            nyaa_filter=task['nyaa_filter'],
                        )
                        return task, res

                    with ThreadPoolExecutor(max_workers=8) as executor:
                        futures = [executor.submit(_search_task, t) for t in tasks]
                        for future in as_completed(futures):
                            try:
                                task, search_res = future.result()
                                if search_res:
                                    results.append({
                                        'mediaId': task['media_id'],
                                        'animeTitle': task['anime_title'],
                                        'episode': task['episode'],
                                        'torrent': search_res[0],
                                        'is_downloaded': task['is_downloaded'],
                                        'is_watched': task['is_watched'],
                                        'airingAt': task.get('airing_at'),
                                    })
                            except Exception as e:
                                print(f"Batch search task error: {e}")

                    # Sort results: by animeTitle then episode
                    results.sort(key=lambda x: (x['animeTitle'], x['episode']))

                except Exception as e:
                    print(f"Error in nyaa_batch_search: {e}")

            self.wfile.write(json.dumps(results).encode('utf-8'))
            
        elif self.path.startswith('/api/open_folder'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            media_id = query.get('mediaId', [None])[0]
            target_path = query.get('path', [None])[0]
            success = False
            
            folder_path = None
            if target_path:
                folder_path = target_path
            elif self.agent and media_id:
                try:
                    folder_path = self.agent.settings.get_media_folder(int(media_id))
                    if not os.path.exists(folder_path) or folder_path == self.agent.settings.default_download_dir:
                        if hasattr(self.agent, 'anilist'):
                            entries = self.agent.anilist._load_list_cache()
                            for entry in entries:
                                if entry.get('mediaId') == int(media_id):
                                    name = entry.get('title', {}).get('romaji') or entry.get('title', {}).get('english') or str(media_id)
                                    title_safe = "".join([c for c in name if c.isalnum() or c in (' ', '-', '_')]).strip()
                                    subfolder = os.path.join(self.agent.settings.default_download_dir, title_safe)
                                    if os.path.exists(subfolder): folder_path = subfolder
                                    break
                except Exception as e:
                    print(f"Failed to determine folder path from mediaId: {e}")

            if folder_path:
                try:
                    import subprocess
                    import sys
                    # If it's a file, we want to open its containing folder on some OSs, 
                    # but usually 'open' or 'start' on a path will do the right thing (open folder or launch file).
                    # However, users usually expect "Open Folder" to open the folder even if a file is selected.
                    if os.path.isfile(folder_path):
                        folder_to_open = os.path.dirname(folder_path)
                    else:
                        folder_to_open = folder_path

                    if not os.path.exists(folder_to_open): os.makedirs(folder_to_open, exist_ok=True)
                    
                    if sys.platform == 'win32': os.startfile(folder_to_open)
                    elif sys.platform == 'darwin': subprocess.call(['open', folder_to_open])
                    else: subprocess.call(['xdg-open', folder_to_open])
                    success = True
                except Exception as e:
                    print(f"Failed to open folder: {e}")
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path.startswith('/api/play_latest'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            media_id = query.get('mediaId', [None])[0]
            success = False
            
            if self.agent and media_id:
                try:
                    media_id = int(media_id)
                    folder_path = self.agent.settings.get_media_folder(media_id)
                    # Find current progress
                    progress = 0
                    if hasattr(self.agent, 'anilist'):
                        entry = self.agent.anilist.get_list_entry(media_id)
                        if entry: progress = entry.get('progress', 0)
                    
                    if os.path.exists(folder_path):
                        from src.parser import AnimeParser
                        video_exts = ('.mkv', '.mp4', '.avi')
                        candidates = []
                        for item in os.listdir(folder_path):
                            if item.lower().endswith(video_exts):
                                p = AnimeParser.parse_filename(item)
                                if p and p.get('episode') is not None:
                                    candidates.append((p['episode'], os.path.join(folder_path, item)))
                        
                        # Find first candidate where ep > progress
                        candidates.sort()
                        target_file = None
                        for ep, path in candidates:
                            if ep > progress:
                                target_file = path
                                break
                        
                        if not target_file and candidates:
                            # Fallback to latest played or just the first one
                            target_file = candidates[0][1]
                            
                        if target_file:
                            import sys
                            import subprocess
                            if sys.platform == 'win32': os.startfile(target_file)
                            elif sys.platform == 'darwin': subprocess.call(['open', target_file])
                            else: subprocess.call(['xdg-open', target_file])
                            success = True
                except Exception as e:
                    print(f"Failed to play latest: {e}")
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/move_to_trash':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            paths = data.get('paths', [])
            
            from send2trash import send2trash
            success_count = 0
            for p in paths:
                if os.path.exists(p):
                    try:
                        send2trash(p)
                        success_count += 1
                    except Exception as e:
                        print(f"Failed to trash {p}: {e}")
            
            # Clear library cache after move
            if os.path.exists('library_cache.json'):
                os.remove('library_cache.json')
                
            self.wfile.write(json.dumps({"success": success_count == len(paths), "count": success_count}).encode('utf-8'))

        elif self.path == '/api/open_trash':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            import sys
            import subprocess
            try:
                if sys.platform == 'win32': subprocess.call(['explorer', 'shell:RecycleBinFolder'])
                elif sys.platform == 'darwin': subprocess.call(['open', 'trash:///'])
                else: subprocess.call(['xdg-open', 'trash:///'])
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except:
                self.wfile.write(json.dumps({"success": False}).encode('utf-8'))

        elif self.path == '/api/exclude_path':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            path = data.get('path')
            if path and self.agent and hasattr(self.agent, 'settings'):
                self.agent.settings.add_library_exclusion(path)
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path == '/api/remove_exclusion':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            path = data.get('path')
            if path and self.agent and hasattr(self.agent, 'settings'):
                self.agent.settings.remove_library_exclusion(path)
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path.startswith('/api/search_anime'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            q = query.get('q', [None])[0]
            
            result = []
            if q and self.agent and hasattr(self.agent, 'anilist'):
                result = self.agent.anilist.search_anime(q)
            
            self.wfile.write(json.dumps(result).encode('utf-8'))

        elif self.path.startswith('/api/play_file'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            file_path = query.get('path', [None])[0]
            success = False
            
            if file_path and os.path.exists(file_path):
                try:
                    import subprocess
                    import sys
                    if sys.platform == 'win32': os.startfile(file_path)
                    elif sys.platform == 'darwin': subprocess.call(['open', file_path])
                    else: subprocess.call(['xdg-open', file_path])
                    success = True
                except Exception as e:
                    print(f"Failed to play file: {e}")
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/clear_cache':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            # Clear library cache
            if os.path.exists('library_cache.json'):
                os.remove('library_cache.json')

            # Clear image cache
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'image_cache')
            if os.path.exists(cache_dir):
                import shutil
                shutil.rmtree(cache_dir)
                os.makedirs(cache_dir, exist_ok=True)

            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path.startswith('/api/image'):
            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            image_url = query.get('url', [None])[0]
            if not image_url:
                self.send_response(400)
                self.end_headers()
                return
                
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'image_cache')
            os.makedirs(cache_dir, exist_ok=True)
            
            import hashlib
            filename = hashlib.md5(image_url.encode()).hexdigest()
            cache_path = os.path.join(cache_dir, filename)
            
            if not os.path.exists(cache_path):
                try:
                    r = requests.get(image_url, timeout=5)
                    r.raise_for_status()
                    content_type = r.headers.get('content-type', '')
                    with open(cache_path, 'wb') as f:
                        f.write(r.content)
                    with open(cache_path + '.meta', 'w') as f:
                        f.write(content_type)
                except Exception as e:
                    print(f"Error fetching image: {e}")
                    self.send_response(500)
                    self.end_headers()
                    return
            
            try:
                with open(cache_path + '.meta', 'r') as f: content_type = f.read()
            except Exception: content_type = 'image/jpeg'
                
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Cache-Control', 'public, max-age=31536000')
            self._set_cors_headers()
            self.end_headers()
            
            try:
                with open(cache_path, 'rb') as f: self.wfile.write(f.read())
            except Exception: pass
        elif self.path == '/api/folders':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            folders = []
            if self.agent and hasattr(self.agent, 'settings'):
                base_dir = self.agent.settings.base_anime_folder
                if os.path.exists(base_dir):
                    try:
                        for item in sorted(os.listdir(base_dir)):
                            if os.path.isdir(os.path.join(base_dir, item)) and not item.startswith('.'):
                                folders.append(item)
                    except Exception as e:
                        print(f"Error listing folders: {e}")
            self.wfile.write(json.dumps(folders).encode('utf-8'))

        elif self.path.startswith('/api/library'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            parsed_path = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed_path.query)
            force_refresh = query.get('force_refresh', ['false'])[0].lower() == 'true'
            
            cache_file = 'library_cache.json'
            
            def get_base_dir():
                if self.agent and hasattr(self.agent, 'settings'):
                    return self.agent.settings.default_download_dir
                return None

            base_dir = get_base_dir()
            
            if not force_refresh and os.path.exists(cache_file):
                try:
                    cache_mtime = os.path.getmtime(cache_file)
                    # Also check base_dir mtime to see if anything changed at the top level
                    if base_dir and os.path.exists(base_dir):
                        dir_mtime = os.path.getmtime(base_dir)
                        # If cache is newer than dir and less than 1 hour old, use it
                        if cache_mtime > dir_mtime and (time.time() - cache_mtime) < 3600:
                            with open(cache_file, 'r', encoding='utf-8') as f:
                                cached_data = json.load(f)
                                self.wfile.write(json.dumps(cached_data).encode('utf-8'))
                                return
                except: pass
                
            def build_tree(path):
                from src.parser import AnimeParser
                video_exts = ('.mkv', '.mp4', '.avi')
                
                # Load cache for matching
                cached_entries = []
                if hasattr(self.agent, 'anilist'):
                    try:
                        cached_entries = self.agent.anilist._load_list_cache()
                    except: pass

                # Load overrides and exclusions
                title_overrides = {}
                exclusions = []
                if hasattr(self.agent, 'settings'):
                    title_overrides = self.agent.settings.title_overrides
                    exclusions = self.agent.settings.library_exclusions

                def match_title(title):
                    title_clean = title.lower()
                    
                    # First check manual overrides: if any mediaId has an override that matches this folder title
                    for media_id_str, custom_title in title_overrides.items():
                        if custom_title.lower() == title_clean:
                            # Find the entry in cached_entries to get full metadata
                            for entry in cached_entries:
                                if str(entry.get('mediaId')) == media_id_str:
                                    return {
                                        "mediaId": entry.get('mediaId'),
                                        "coverImage": entry.get('coverImage', {}).get('large') or entry.get('coverImage', {}).get('medium'),
                                        "listStatus": entry.get('listStatus')
                                    }
                    
                    # Fallback to standard matching
                    for entry in cached_entries:
                        romaji = (entry.get('title', {}).get('romaji') or '').lower()
                        english = (entry.get('title', {}).get('english') or '').lower()
                        synonyms = [s.lower() for s in entry.get('synonyms', [])]
                        if title_clean in romaji or title_clean in english or title_clean in synonyms:
                            return {
                                "mediaId": entry.get('mediaId'),
                                "coverImage": entry.get('coverImage', {}).get('large') or entry.get('coverImage', {}).get('medium'),
                                "listStatus": entry.get('listStatus')
                            }
                    return None

                def scan(current_path):
                    if current_path in exclusions:
                        return None
                        
                    node = {
                        "name": os.path.basename(current_path) or current_path,
                        "path": current_path,
                        "type": "directory",
                        "children": [],
                        "has_video": False,
                        "size": 0
                    }
                    
                    try:
                        items = os.listdir(current_path)
                    except PermissionError:
                        return None
                        
                    for item in sorted(items):
                        item_path = os.path.join(current_path, item)
                        if os.path.isdir(item_path):
                            child = scan(item_path)
                            if child and child["has_video"]:
                                node["children"].append(child)
                                node["has_video"] = True
                                node["size"] += child.get("size", 0)
                        elif item.lower().endswith(video_exts):
                            mtime = os.path.getmtime(item_path)
                            size = os.path.getsize(item_path)
                            parsed = AnimeParser.parse_filename(item)
                            node["children"].append({
                                "name": item,
                                "path": item_path,
                                "type": "file",
                                "mtime": mtime,
                                "size": size,
                                "episode": parsed.get("episode") if parsed else None
                            })
                            node["has_video"] = True
                            node["size"] += size
                            
                    # Attempt to match directory names to Anilist if they are top-level-ish
                    match = match_title(node["name"])
                    if match:
                        node.update(match)
                        
                    return node

                return scan(path)

            result = {"success": False, "data": None}
            if base_dir and os.path.exists(base_dir):
                tree = build_tree(base_dir)
                if tree:
                    result = {"success": True, "data": tree}
                    try:
                        with open(cache_file, 'w', encoding='utf-8') as f:
                            json.dump(result, f, ensure_ascii=False, indent=2)
                    except: pass
            
            self.wfile.write(json.dumps(result).encode('utf-8'))
        elif self.path == '/api/library/exclusions':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            exclusions = []
            if self.agent and hasattr(self.agent, 'settings'):
                exclusions = self.agent.settings.library_exclusions
            self.wfile.write(json.dumps(exclusions).encode('utf-8'))
        else:
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

        elif self.path == '/api/change_status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            media_id = data.get('mediaId')
            status = data.get('status')
            episode = data.get('episode')
            success = False
            if self.agent and hasattr(self.agent, 'anilist') and media_id and status:
                success = self.agent.anilist.change_status(media_id, status, progress=int(episode) if episode is not None else None)
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/update_title_override':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            media_id = data.get('mediaId')
            custom_title = data.get('customTitle')
            success = False
            if self.agent and hasattr(self.agent, 'settings') and media_id:
                self.agent.settings.update_title_override(media_id, custom_title)
                success = True
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/reauthorize':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            success = False
            if self.agent and hasattr(self.agent, 'anilist'):
                try: success = self.agent.anilist.authenticate()
                except Exception as e: print(f"Reauthorization failed: {e}")
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/user':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            user = None
            if self.agent and hasattr(self.agent, 'anilist'):
                user = self.agent.anilist.get_authenticated_user()
            
            self.wfile.write(json.dumps(user).encode('utf-8'))

        elif self.path == '/api/full_refresh':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            if self.agent:
                self.agent.current_media_map = {}
                self.agent.selected_media_id = None
                self.agent.current_anilist_progress = 0
                self.agent.current_media_id = None
                self.agent._cached_anilist_episodes = None
                self.agent.last_synced_filename = None
                if hasattr(self.agent, 'anilist'): self.agent.anilist.user_id = None
            import shutil
            cache_dir = os.path.join(os.path.dirname(__file__), '..', 'image_cache')
            if os.path.exists(cache_dir): shutil.rmtree(cache_dir, ignore_errors=True)
            if os.path.exists('library_cache.json'):
                try: os.remove('library_cache.json')
                except: pass
            TrackerStateHandler.manual_episode_override = None
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path == '/api/sync':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            success = False
            if self.agent and self.agent.active_watcher and self.agent.active_watcher.is_connected:
                filename = self.agent.active_watcher.get_current_filename()
                if filename:
                    if hasattr(self.agent, 'sync_progress_manual') and TrackerStateHandler.manual_episode_override is not None:
                        self.agent.sync_progress_manual(filename, TrackerStateHandler.manual_episode_override, getattr(self.agent, 'selected_media_id', None))
                        success = True
                    else:
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
                if 'base_anime_folder' in data:
                    self.agent.settings.base_anime_folder = data['base_anime_folder']
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))

        elif self.path == '/api/nyaa_download':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            
            # Support both single and batch download
            items = data.get('items', [])
            if not items and 'url' in data:
                items = [{'url': data['url'], 'mediaId': data.get('mediaId'), 'animeTitle': data.get('animeTitle')}]
            
            results = []
            if self.agent and hasattr(self.agent, 'nyaa'):
                for item in items:
                    url = item.get('url')
                    media_id = item.get('mediaId')
                    anime_title = item.get('animeTitle')
                    
                    if not url: continue

                    # Target folder logic — preserve punctuation like '.' in titles
                    def _make_title_dir(title: str) -> str:
                        safe = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', title).strip()
                        return safe or 'Downloads'

                    if media_id:
                        configured = self.agent.settings.get_media_folder(int(media_id))
                        if configured != self.agent.settings.default_download_dir:
                            download_dir = configured
                        elif anime_title:
                            download_dir = os.path.join(self.agent.settings.default_download_dir, _make_title_dir(anime_title))
                        else:
                            download_dir = self.agent.settings.default_download_dir
                    elif anime_title:
                        download_dir = os.path.join(self.agent.settings.default_download_dir, _make_title_dir(anime_title))
                    else:
                        download_dir = self.agent.settings.default_download_dir

                    path = self.agent.nyaa.download_torrent(url, download_dir)
                    results.append({"url": url, "success": bool(path)})
                
            self.wfile.write(json.dumps({"success": True, "results": results}).encode('utf-8'))
            
        elif self.path == '/api/organize_folders':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            results = []
            if self.agent and hasattr(self.agent, 'settings'):
                base_dir = self.agent.settings.base_anime_folder
                if os.path.exists(base_dir):
                    from src.parser import AnimeParser
                    import shutil
                    video_exts = ('.mkv', '.mp4', '.avi')
                    for item in os.listdir(base_dir):
                        if item.lower().endswith(video_exts):
                            file_path = os.path.join(base_dir, item)
                            if os.path.isfile(file_path):
                                parsed = AnimeParser.parse_filename(item)
                                if parsed and parsed.get('title'):
                                    title = parsed['title']
                                    folder_name = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip()
                                    target_dir = os.path.join(base_dir, folder_name)
                                    target_path = os.path.join(target_dir, item)
                                    if not os.path.exists(target_dir): os.makedirs(target_dir, exist_ok=True)
                                    try:
                                        shutil.move(file_path, target_path)
                                        results.append(f"Moved {item} to {folder_name}/")
                                    except Exception as e: print(f"Skipped {item}: {e}")
            self.wfile.write(json.dumps({"success": True, "results": results}).encode('utf-8'))

        elif self.path == '/api/library/exclude':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            path = data.get('path')
            success = False
            if self.agent and hasattr(self.agent, 'settings') and path:
                self.agent.settings.add_library_exclusion(path)
                # Clear library cache when exclusion is added
                if os.path.exists('library_cache.json'): os.remove('library_cache.json')
                success = True
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        elif self.path == '/api/library/include':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            content_length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length else {}
            path = data.get('path')
            success = False
            if self.agent and hasattr(self.agent, 'settings') and path:
                self.agent.settings.remove_library_exclusion(path)
                # Clear library cache when exclusion is removed
                if os.path.exists('library_cache.json'): os.remove('library_cache.json')
                success = True
            self.wfile.write(json.dumps({"success": success}).encode('utf-8'))

        else:
            self.send_response(404)
            self.end_headers()
    def log_message(self, format, *args): pass

class ReusableTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def start_web_server(agent: TrackerAgent, port: int = 8080):
    TrackerStateHandler.agent = agent
    with ReusableTCPServer(("", port), TrackerStateHandler) as httpd:
        print(f"UI Server started at http://localhost:{port}")
        httpd.serve_forever()

def run_server_in_background(agent: TrackerAgent, port: int = 8080):
    thread = threading.Thread(target=start_web_server, args=(agent, port), daemon=True)
    thread.start()
    return thread
