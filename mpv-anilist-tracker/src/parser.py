import guessit
from typing import Dict, Any, Optional

class AnimeParser:
    @staticmethod
    def parse_filename(filename: str) -> Optional[Dict[str, Any]]:
        """
        Parses an anime filename and returns a dictionary with relevant info.
        Example filename: '[SubsPlease] Sousou no Frieren - 01 (1080p) [F23E0A3C].mkv'
        """
        if not filename:
            return None
            
        # Optional: guessit is very good out of the box, but we can enforce anime parsing
        guess = guessit.guessit(filename, options={'type': 'episode'})
        
        # We need at minimum a title to search Anilist
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
