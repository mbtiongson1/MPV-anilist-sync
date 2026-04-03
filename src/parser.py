import guessit
from typing import Dict, Any, Optional

class AnimeParser:
    @staticmethod
    def parse_filename(filename: str) -> Optional[Dict[str, Any]]:
        """
        Parses an anime filename and returns a dictionary with relevant info.
        Example filename: '[SubsPlease] Sousou no Frieren - 01 (1080p) [F23E0A3C].mkv'
        """
        import anitopy
        
        if not filename:
            return None
            
        # Use anitopy as primary parser for better anime handling
        parsed = anitopy.parse(filename)
        
        # We need at minimum a title to search Anilist
        title = parsed.get('anime_title')
        if title:
            # Convert episode to integer/float if possible
            ep_str = parsed.get('episode_number')
            episode = None
            if ep_str:
                try:
                    episode = int(ep_str)
                except ValueError:
                    try: episode = float(ep_str)
                    except: pass
            
            # Convert season
            season_str = parsed.get('anime_season')
            season = None
            if season_str:
                try:
                    season = int(season_str)
                except ValueError: pass

            return {
                'title': title,
                'episode': episode,
                'season': season,
                'release_group': parsed.get('release_group'),
                'video_resolution': parsed.get('video_resolution')
            }
            
        # Fallback to guessit if anitopy completely fails
        guess = guessit.guessit(filename)
        
        if 'title' not in guess:
            return None
            
        result = {
            'title': guess.get('title'),
            'episode': guess.get('episode'),
            'season': guess.get('season'),
            'release_group': guess.get('release_group'),
            'video_resolution': guess.get('screen_size')
        }
        
        return result
