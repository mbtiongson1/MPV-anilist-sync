import json
import os
import requests  # type: ignore
import webbrowser
import http.server
import urllib.parse
import threading
from typing import Optional, Dict, Any, cast

class AnilistHTTPServer(http.server.HTTPServer):
    token: Optional[str] = None

class AnilistAuthHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
        
    def do_GET(self):
        if self.path == '/auth':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
            <html>
            <head>
                <title>Authenticating...</title>
                <style>
                    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fdfaf6; color: #433422; }
                    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
                    .spinner { border: 3px solid rgba(0,0,0,0.1); border-top: 3px solid #6b5c40; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
            <div class="card">
                <div class="spinner"></div>
                <p id="status">Completing authentication...</p>
                <script>
                    var hash = window.location.hash.substring(1);
                    if (hash) {
                        var params = new URLSearchParams(hash);
                        var token = params.get('access_token');
                        if (token) {
                            fetch('/callback', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: token })
                            }).then(response => {
                                if (response.ok) {
                                    document.getElementById('status').innerText = 'Authentication successful! You can close this tab.';
                                } else {
                                    document.getElementById('status').innerText = 'Authentication failed.';
                                }
                            }).catch(err => {
                                document.getElementById('status').innerText = 'Error during authentication: ' + err;
                            });
                        } else {
                            document.getElementById('status').innerText = 'Authentication failed (no token).';
                        }
                    } else {
                        document.getElementById('status').innerText = 'Waiting for token...';
                    }
                </script>
            </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/callback':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                token = data.get('token')
                if token:
                    server = cast(AnilistHTTPServer, self.server)
                    server.token = token
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                    
                    # Stop the server in a new thread
                    threading.Thread(target=self.server.shutdown).start()
                else:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "No token provided"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

class AnilistClient:
    API_URL = "https://graphql.anilist.co"

    def __init__(self, token_file: str = "config.json"):
        self.token_file = token_file
        self.token = self._load_token()
        self.user_id = None

    def _load_token(self) -> Optional[str]:
        # Check environment variable first for Docker/CI support
        env_token = os.environ.get('ANILIST_TOKEN')
        if env_token:
            return env_token

        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'r') as f:
                    config = json.load(f)
                    return config.get('access_token')
            except Exception as e:
                print(f"Error loading token: {e}")
        return None

    def save_token(self, token: str):
        self.token = token
        config: Dict[str, Any] = {}
        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'r') as f:
                    loaded = json.load(f)
                    if isinstance(loaded, dict):
                        config.update(loaded)
            except:
                pass
        config['access_token'] = token
        with open(self.token_file, 'w') as f:
            json.dump(config, f)

    def is_authenticated(self) -> bool:
        return self.token is not None

    def authenticate(self) -> bool:
        client_id = 37267

        server = AnilistHTTPServer(('localhost', 54321), AnilistAuthHandler)
        server.token = None
        
        # Anilist requires the redirect URI to be exact, so we set it up in the Dev Console as http://localhost:54321/auth
        auth_url = f"https://anilist.co/api/v2/oauth/authorize?client_id={client_id}&response_type=token"
        print(f"Opening browser for authentication: {auth_url}")
        
        webbrowser.open(auth_url)
        
        # Block until the local server receives the token and shuts down
        server.serve_forever()
        
        token = server.token
        if token:
            self.save_token(token)
            self.user_id = None # reset user id to fetch it again
            print("Successfully authenticated and saved token.")
            return True
            
        return False

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers

    def _execute_query(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        import time
        data: Dict[str, Any] = {'query': query}
        if variables:
            data['variables'] = variables

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.API_URL,
                    headers=self._get_headers(),
                    json=data
                )
                response.raise_for_status()
                return response.json()
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # Too Many Requests
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt  # Exponential backoff: 1, 2, 4 seconds
                        print(f"Rate limited (429). Retrying in {wait_time} seconds... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"Rate limited (429). Max retries exceeded.")
                        raise
                else:
                    raise
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"Request failed: {e}. Retrying in {wait_time} seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    raise
        
        # Fallback if the loop finishes without returning or raising
        raise Exception("Failed to execute query after multiple retries.")

    def get_authenticated_user(self) -> Optional[Dict[str, Any]]:
        if not self.token:
            return None

        query = '''
        query {
            Viewer {
                id
                name
                avatar {
                    large
                }
            }
        }
        '''
        try:
            result = self._execute_query(query)
            return result.get('data', {}).get('Viewer')
        except Exception as e:
            print(f"Error getting authenticated user: {e}")
            return None

    def search_anime(self, title: str) -> list[Dict[str, Any]]:
        # Return a list of matches for manual search
        query = '''
        query ($search: String) {
            Page (perPage: 10) {
                media (search: $search, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    episodes
                    status
                    season
                    seasonYear
                    description(asHtml: false)
                    popularity
                    averageScore
                    genres
                    format
                    coverImage {
                        large
                        medium
                    }
                    bannerImage
                    studios(isMain: true) {
                        nodes {
                            name
                        }
                    }
                }
            }
        }
        '''
        variables = {'search': title}
        try:
            result = self._execute_query(query, variables)
            return result.get('data', {}).get('Page', {}).get('media', [])
        except Exception as e:
            print(f"Error searching anime '{title}': {e}")
            return []

    def _load_list_cache(self, statuses: list[str] | None = None) -> list[dict[str, Any]]:
        try:
            if os.path.exists('list_cache.json'):
                with open('list_cache.json', 'r', encoding='utf-8') as f:
                    cached_entries = json.load(f)
                    if statuses:
                        return [entry for entry in cached_entries if entry.get('listStatus') in statuses]
                    return cached_entries
        except Exception as cache_err:
            print(f"Error loading list cache: {cache_err}")
        return []

    def get_list_entry(self, media_id: int) -> Optional[Dict[str, Any]]:
        viewer = self.get_authenticated_user()
        if not viewer:
            # Fallback to cache
            cached = self._load_list_cache()
            for entry in cached:
                if entry.get('mediaId') == media_id:
                    return {
                        'id': entry.get('entryId'),
                        'status': entry.get('listStatus'),
                        'progress': entry.get('progress')
                    }
            return None

        user_id = viewer.get('id')
        query = '''
        query ($userId: Int, $mediaId: Int) {
            MediaList (userId: $userId, mediaId: $mediaId) {
                id
                status
                progress
            }
        }
        '''
        variables = {'userId': user_id, 'mediaId': media_id}
        try:
            result = self._execute_query(query, variables)
            return result.get('data', {}).get('MediaList')
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                return None  # List entry doesn't exist yet
            print(f"Error fetching list entry: {e}")
        except Exception as e:
            print(f"Error fetching list entry: {e}")
        return None

    def get_user_anime_list(self, statuses: list[str] | None = None) -> list[dict[str, Any]]:
        """Fetch the authenticated user's anime list with full metadata.

        Args:
            statuses: List of AniList MediaListStatus values to filter by.
                      e.g. ['CURRENT', 'PLANNING']. If None, fetches all.

        Returns:
            A flat list of dicts, each containing media metadata + list entry info.
        """
        viewer = self.get_authenticated_user()
        if not viewer:
            return self._load_list_cache(statuses)

        user_id = viewer.get('id')
        query = '''
        query ($userId: Int, $type: MediaType, $statusIn: [MediaListStatus]) {
            MediaListCollection(userId: $userId, type: $type, status_in: $statusIn) {
                lists {
                    name
                    status
                    entries {                        id
                        status
                        progress
                        score
                        updatedAt
                        media {
                            id
                            title {
                                romaji
                                english
                                native
                            }
                            episodes
                            status
                            season
                            seasonYear
                            description(asHtml: false)
                            popularity
                            averageScore
                            genres
                            format
                            coverImage {
                                large
                                medium
                            }
                            bannerImage
                            studios(isMain: true) {
                                nodes {
                                    name
                                    isAnimationStudio
                                }
                            }
                            nextAiringEpisode {
                                episode
                                airingAt
                            }
                        }
                    }
                }
            }
        }
        '''
        variables: Dict[str, Any] = {
            'userId': user_id,
            'type': 'ANIME',
        }
        if statuses:
            variables['statusIn'] = statuses

        try:
            result = self._execute_query(query, variables)
            collection = result.get('data', {}).get('MediaListCollection', {})
            lists = collection.get('lists', [])

            flat_entries: list[dict[str, Any]] = []
            for lst in lists:
                list_status = lst.get('status', '')
                for entry in lst.get('entries', []):
                    media = entry.get('media', {})
                    studios_nodes = media.get('studios', {}).get('nodes', [])
                    studio_name = studios_nodes[0]['name'] if studios_nodes else None
                    next_airing = media.get('nextAiringEpisode')

                    flat_entries.append({
                        'entryId': entry.get('id'),
                        'listStatus': entry.get('status') or list_status,
                        'progress': entry.get('progress', 0),
                        'score': entry.get('score', 0),
                        'updatedAt': entry.get('updatedAt', 0),
                        'mediaId': media.get('id'),
                        'title': media.get('title', {}),
                        'episodes': media.get('episodes'),
                        'mediaStatus': media.get('status'),
                        'season': media.get('season'),
                        'seasonYear': media.get('seasonYear'),
                        'description': media.get('description'),
                        'popularity': media.get('popularity'),
                        'averageScore': media.get('averageScore'),
                        'genres': media.get('genres', []),
                        'format': media.get('format'),
                        'coverImage': media.get('coverImage', {}),
                        'bannerImage': media.get('bannerImage'),
                        'studio': studio_name,
                        'nextAiringEpisode': {
                            'episode': next_airing.get('episode'),
                            'airingAt': next_airing.get('airingAt'),
                        } if next_airing else None,
                    })

            # Save the list to local cache
            try:
                with open('list_cache.json', 'w', encoding='utf-8') as f:
                    json.dump(flat_entries, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving list cache: {e}")

            return flat_entries
        except requests.exceptions.HTTPError as e:
            if e.response.status_code in (400, 401, 403):
                raise
            print(f"HTTP Error fetching user anime list: {e}")
            return self._load_list_cache(statuses)
        except Exception as e:
            print(f"Error fetching user anime list: {e}")
            return self._load_list_cache(statuses)

    def update_progress(self, media_id: int, episode: int) -> bool:
        if not self.is_authenticated():
            print("Not authenticated.")
            return False

        # Check existing entry
        entry = self.get_list_entry(media_id)
        if entry and (entry.get('progress') or 0) == episode:
            print(f"Anilist progress already set to episode {episode}")
            return True

        mutation = '''
        mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
            SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
                id
                progress
                status
            }
        }
        '''
        variables: Dict[str, Any] = {
            'mediaId': media_id,
            'progress': episode
        }
        
        # If it's a new entry, we should probably set it to CURRENT (watching)
        if not entry:
            variables['status'] = 'CURRENT'
            
        try:
            result = self._execute_query(mutation, variables)
            print(f"Successfully updated Anilist progress to episode {episode}")
            return True
        except Exception as e:
            print(f"Error updating progress: {e}")
            return False

    def change_status(self, media_id: int, status: str, progress: Optional[int] = None) -> bool:
        if not self.is_authenticated():
            print("Not authenticated.")
            return False

        mutation = '''
        mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int) {
            SaveMediaListEntry (mediaId: $mediaId, status: $status, progress: $progress) {
                id
                status
                progress
            }
        }
        '''
        variables: Dict[str, Any] = {
            'mediaId': media_id,
            'status': status
        }
        if progress is not None:
            variables['progress'] = progress
        
        try:
            self._execute_query(mutation, variables)
            print(f"Successfully updated status for media {media_id} to {status}" + (f" and progress to {progress}" if progress is not None else ""))
            return True
        except Exception as e:
            print(f"Error changing status: {e}")
            return False

    def get_upcoming_anime(self, force_refresh: bool = False) -> list[dict[str, Any]]:
        """Fetch currently airing and next season's anime, with local caching."""
        cache_file = 'upcoming_cache.json'
        
        # Load from cache if it exists and we're not forcing a refresh
        if not force_refresh and os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading upcoming cache: {e}")

        from datetime import datetime
        now = datetime.now()
        month = now.month
        year = now.year

        seasons = ["WINTER", "SPRING", "SUMMER", "FALL"]
        # AniList: WINTER(1,2,3), SPRING(4,5,6), SUMMER(7,8,9), FALL(10,11,12) approx
        current_season_idx = (month - 1) // 3
        current_season = seasons[current_season_idx]
        
        next_season_idx = (current_season_idx + 1) % 4
        next_season = seasons[next_season_idx]
        next_year = year + 1 if next_season_idx == 0 else year

        query = '''
        query ($season: MediaSeason, $year: Int, $nextSeason: MediaSeason, $nextYear: Int) {
          airing: Page(perPage: 50) {
            media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
              ...mediaFields
            }
          }
          upcoming: Page(perPage: 50) {
            media(season: $nextSeason, seasonYear: $nextYear, type: ANIME, sort: POPULARITY_DESC) {
              ...mediaFields
            }
          }
        }

        fragment mediaFields on Media {
          id
          title {
            romaji
            english
            native
          }
          episodes
          status
          season
          seasonYear
          description(asHtml: false)
          popularity
          averageScore
          genres
          format
          coverImage {
            large
            medium
          }
          bannerImage
          studios(isMain: true) {
            nodes {
              name
              isAnimationStudio
            }
          }
          nextAiringEpisode {
            episode
            airingAt
          }
        }
        '''
        variables = {
            'season': current_season,
            'year': year,
            'nextSeason': next_season,
            'nextYear': next_year
        }
        
        try:
            result = self._execute_query(query, variables)
            data = result.get('data', {})
            airing = data.get('airing', {}).get('media', [])
            upcoming = data.get('upcoming', {}).get('media', [])
            
            # Combine and deduplicate
            seen_ids = set()
            combined = []
            
            # Format combined list to match user list structure for frontend consistency
            def format_media(media):
                if media['id'] in seen_ids:
                    return None
                seen_ids.add(media['id'])
                
                studios_nodes = media.get('studios', {}).get('nodes', [])
                studio_name = studios_nodes[0]['name'] if studios_nodes else None
                next_airing = media.get('nextAiringEpisode')

                return {
                    'mediaId': media.get('id'),
                    'title': media.get('title', {}),
                    'episodes': media.get('episodes'),
                    'mediaStatus': media.get('status'),
                    'season': media.get('season'),
                    'seasonYear': media.get('seasonYear'),
                    'description': media.get('description'),
                    'popularity': media.get('popularity'),
                    'averageScore': media.get('averageScore'),
                    'genres': media.get('genres', []),
                    'format': media.get('format'),
                    'coverImage': media.get('coverImage', {}),
                    'bannerImage': media.get('bannerImage'),
                    'studio': studio_name,
                    'isAdult': 'Hentai' in media.get('genres', []) or 'Ecchi' in media.get('genres', []),
                    'nextAiringEpisode': {
                        'episode': next_airing.get('episode'),
                        'airingAt': next_airing.get('airingAt'),
                    } if next_airing else None,
                }

            for m in airing:
                fmt = format_media(m)
                if fmt: combined.append(fmt)
            for m in upcoming:
                fmt = format_media(m)
                if fmt: combined.append(fmt)
                
            # Save to cache
            try:
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(combined, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving upcoming cache: {e}")

            return combined
        except Exception as e:
            print(f"Error fetching upcoming anime: {e}")
            return []
