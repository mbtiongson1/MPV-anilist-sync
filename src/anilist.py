import json
import os
import requests  # type: ignore
import time
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
            <body>
            <script>
                var hash = window.location.hash.substring(1);
                if (hash) {
                    var params = new URLSearchParams(hash);
                    var token = params.get('access_token');
                    if (token) {
                        window.location.href = '/callback?token=' + token;
                    } else {
                        document.body.innerHTML = 'Authentication failed (no token).';
                    }
                } else {
                    document.body.innerHTML = 'Please wait, authenticating...';
                }
            </script>
            <p>Authenticating...</p>
            </body>
            </html>
            """
            self.wfile.write(html.encode('utf-8'))
        elif self.path.startswith('/callback'):
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            token = params.get('token', [None])[0]
            if token:
                server = cast(AnilistHTTPServer, self.server)
                server.token = token
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b"Authentication successful! You can close this tab and return to the application.")
            else:
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b"Authentication failed.")
            
            # Stop the server in a new thread to allow the response to complete
            threading.Thread(target=self.server.shutdown).start()

class AnilistClient:
    API_URL = "https://graphql.anilist.co"
    OAUTH_CLIENT_ID = 37267
    OAUTH_REDIRECT_URI = "http://localhost:54321/auth"
    AUTH_CACHE_TTL_SECONDS = 10.0

    def __init__(self, token_file: str = "config.json"):
        self.token_file = token_file
        self.token = self._load_token()
        self.user_id = None
        self._token_valid: Optional[bool] = None
        self._token_error: Optional[str] = None
        self._viewer_cache: Optional[Dict[str, Any]] = None
        self._last_auth_check_ts: float = 0.0

    def _load_token(self) -> Optional[str]:
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
        self.user_id = None
        self._token_valid = None
        self._token_error = None
        self._viewer_cache = None
        self._last_auth_check_ts = 0.0
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

    def has_token(self) -> bool:
        return self.token is not None

    def get_auth_url(self) -> str:
        params = {
            "client_id": self.OAUTH_CLIENT_ID,
            "redirect_uri": self.OAUTH_REDIRECT_URI,
            "response_type": "token",
        }
        return "https://anilist.co/api/v2/oauth/authorize?" + urllib.parse.urlencode(params)

    def is_authenticated(self) -> bool:
        return self.get_auth_state().get("authenticated", False)

    def get_auth_state(self, *, force_refresh: bool = False) -> Dict[str, Any]:
        has_token = self.token is not None
        if not has_token:
            # No token: treat as unauthenticated without an error message.
            self.user_id = None
            self._token_valid = False
            self._token_error = None
            self._viewer_cache = None
            self._last_auth_check_ts = time.time()
            return {"has_token": False, "authenticated": False, "error": None, "viewer": None}

        now = time.time()
        if (
            not force_refresh
            and self._token_valid is not None
            and (now - self._last_auth_check_ts) < self.AUTH_CACHE_TTL_SECONDS
        ):
            viewer = self._viewer_cache
            if viewer is None and self._token_valid is True and self.user_id is not None:
                viewer = {"id": self.user_id}
            return {
                "has_token": True,
                "authenticated": self._token_valid is True,
                "error": self._token_error,
                "viewer": viewer,
            }

        self._last_auth_check_ts = now
        query = """
        query {
            Viewer {
                id
                name
            }
        }
        """
        try:
            result = self._execute_query(query)
            errors = result.get("errors")
            if errors:
                # GraphQL-level errors sometimes come back with HTTP 200.
                msg = None
                if isinstance(errors, list) and errors:
                    first = errors[0]
                    if isinstance(first, dict):
                        maybe = first.get("message")
                        if isinstance(maybe, str) and maybe:
                            msg = maybe
                self.user_id = None
                self._viewer_cache = None
                self._token_valid = False
                self._token_error = msg or "AniList API error."
                return {
                    "has_token": True,
                    "authenticated": False,
                    "error": self._token_error,
                    "viewer": None,
                }

            viewer = result.get("data", {}).get("Viewer")
            if isinstance(viewer, dict) and viewer.get("id"):
                self.user_id = viewer.get("id")
                self._viewer_cache = viewer
                self._token_valid = True
                self._token_error = None
                return {
                    "has_token": True,
                    "authenticated": True,
                    "error": None,
                    "viewer": viewer,
                }

            self.user_id = None
            self._viewer_cache = None
            self._token_valid = False
            self._token_error = "Unable to read AniList viewer information."
            return {"has_token": True, "authenticated": False, "error": self._token_error, "viewer": None}
        except requests.exceptions.HTTPError as e:
            status = getattr(e.response, "status_code", None)
            msg = self._extract_anilist_error_message(getattr(e, "response", None))
            if status in (400, 401, 403):
                self.user_id = None
                self._viewer_cache = None
                self._token_valid = False
                self._token_error = msg or f"Invalid token (HTTP {status})."
            else:
                # Treat as a transient API error; keep auth state unknown.
                self._token_valid = None
                self._token_error = msg or f"AniList request failed (HTTP {status})."
            return {"has_token": True, "authenticated": False, "error": self._token_error, "viewer": None}
        except Exception as e:
            self._token_valid = None
            self._token_error = str(e)
            return {"has_token": True, "authenticated": False, "error": self._token_error, "viewer": None}

    def _extract_anilist_error_message(self, response: Any) -> Optional[str]:
        if response is None:
            return None
        try:
            payload = response.json()
        except Exception:
            text = getattr(response, "text", "")
            if isinstance(text, str):
                text = text.strip()
                return text[:200] if text else None
            return None

        if isinstance(payload, dict):
            errors = payload.get("errors")
            if isinstance(errors, list) and errors:
                first = errors[0]
                if isinstance(first, dict):
                    msg = first.get("message")
                    if isinstance(msg, str) and msg:
                        return msg
            msg = payload.get("message")
            if isinstance(msg, str) and msg:
                return msg

        return None

    def authenticate(self, *, open_browser: bool = True) -> bool:
        try:
            server = AnilistHTTPServer(("localhost", 54321), AnilistAuthHandler)
        except OSError as e:
            self._token_valid = None
            self._token_error = str(e)
            print(f"Error starting local auth server on localhost:54321: {e}")
            return False

        server.token = None

        auth_url = self.get_auth_url()
        if open_browser:
            print(f"Opening browser for authentication: {auth_url}")
            webbrowser.open(auth_url)
        else:
            print(f"Authentication URL: {auth_url}")

        # Block until the local server receives the token and shuts down.
        server.serve_forever()

        token = server.token
        if token:
            self.save_token(token)
            print("Successfully authenticated and saved token.")
            return True

        self._token_valid = False
        self._token_error = "Authentication failed."
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
        data: Dict[str, Any] = {'query': query}
        if variables:
            data['variables'] = variables
            
        response = requests.post(
            self.API_URL,
            headers=self._get_headers(),
            json=data
        )
        response.raise_for_status()
        return response.json()

    def get_authenticated_user(self) -> Optional[int]:
        state = self.get_auth_state()
        if not state.get("authenticated"):
            return None
        viewer = state.get("viewer")
        if isinstance(viewer, dict) and viewer.get("id"):
            self.user_id = viewer.get("id")
            return cast(int, self.user_id)
        if self.user_id:
            return cast(int, self.user_id)
        return None

    def search_anime(self, title: str) -> Optional[Dict[str, Any]]:
        query = '''
        query ($search: String) {
            Media (search: $search, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                episodes
                status
            }
        }
        '''
        variables = {'search': title}
        try:
            result = self._execute_query(query, variables)
            return result.get('data', {}).get('Media')
        except Exception as e:
            print(f"Error searching anime '{title}': {e}")
            return None

    def get_list_entry(self, media_id: int) -> Optional[Dict[str, Any]]:
        user_id = self.get_authenticated_user()
        if not user_id:
            return None

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
        user_id = self.get_authenticated_user()
        if not user_id:
            return []

        query = '''
        query ($userId: Int, $type: MediaType, $statusIn: [MediaListStatus]) {
            MediaListCollection(userId: $userId, type: $type, status_in: $statusIn) {
                lists {
                    name
                    status
                    entries {
                        id
                        status
                        progress
                        score
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

            return flat_entries
        except Exception as e:
            print(f"Error fetching user anime list: {e}")
            return []

    def update_progress(self, media_id: int, episode: int) -> bool:
        if not self.has_token():
            print("Not authenticated.")
            return False
        if not self.is_authenticated():
            print("Not authenticated (invalid or expired token).")
            return False

        # Check existing entry
        entry = self.get_list_entry(media_id)
        if entry and (entry.get('progress') or 0) >= episode:
            print(f"Anilist already at or past episode {episode} (Current: {entry.get('progress')})")
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
