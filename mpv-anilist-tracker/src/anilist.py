import json
import os
import requests
from typing import Optional, Dict, Any

class AnilistClient:
    API_URL = "https://graphql.anilist.co"

    def __init__(self, token_file: str = "config.json"):
        self.token_file = token_file
        self.token = self._load_token()
        self.user_id = None

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
        config = {}
        if os.path.exists(self.token_file):
            try:
                with open(self.token_file, 'r') as f:
                    config = json.load(f)
            except:
                pass
        config['access_token'] = token
        with open(self.token_file, 'w') as f:
            json.dump(config, f)

    def is_authenticated(self) -> bool:
        return self.token is not None

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers

    def _execute_query(self, query: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
        data = {'query': query}
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
        if not self.token:
            return None
        if self.user_id:
            return self.user_id

        query = '''
        query {
            Viewer {
                id
                name
            }
        }
        '''
        try:
            result = self._execute_query(query)
            user = result.get('data', {}).get('Viewer')
            if user:
                self.user_id = user['id']
                return self.user_id
        except Exception as e:
            print(f"Error getting authenticated user: {e}")
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

    def update_progress(self, media_id: int, episode: int) -> bool:
        if not self.is_authenticated():
            print("Not authenticated.")
            return False

        # Check existing entry
        entry = self.get_list_entry(media_id)
        if entry and entry.get('progress') >= episode:
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
        variables = {
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
