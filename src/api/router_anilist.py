from fastapi import APIRouter, Request, Query
from typing import Optional, List
import urllib.parse
import os

router_anilist = APIRouter()
router_nyaa = APIRouter()

@router_anilist.get('/api/animelist')
async def get_animelist(request: Request):
    agent = request.app.state.agent
    entries = []
    if agent:
        try:
            entries = agent.anilist.get_user_anime_list(['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'])
        except Exception as e:
            if hasattr(e, 'response') and e.response.status_code in (400, 401, 403):
                return {"error": "auth_failed"}
            print(f"Error fetching anime list: {e}")
    return entries

@router_anilist.get('/api/upcoming')
async def get_upcoming(request: Request, refresh: str = "false"):
    agent = request.app.state.agent
    entries = []
    if agent and hasattr(agent, 'anilist'):
        try:
            force_refresh = refresh.lower() == 'true'
            entries = agent.anilist.get_upcoming_anime(force_refresh=force_refresh)
        except Exception as e:
            print(f"Error fetching upcoming anime: {e}")
    return entries

@router_anilist.get('/api/user')
async def get_user(request: Request):
    agent = request.app.state.agent
    user = None
    if agent and hasattr(agent, 'anilist'):
        user = agent.anilist.get_authenticated_user()
    return user

@router_anilist.get('/api/reauthorize')
async def reauthorize(request: Request):
    agent = request.app.state.agent
    success = False
    if agent and hasattr(agent, 'anilist'):
        try:
            success = agent.anilist.authenticate()
        except Exception as e:
            print(f"Reauthorization failed: {e}")
    return {"success": success}

@router_nyaa.get('/api/nyaa_search')
async def nyaa_search(
    request: Request,
    q: Optional[str] = None,
    episode: Optional[str] = None,
    category: str = '1_2',
    filter: str = '0',
    resolution: Optional[str] = None,
    media_id: Optional[str] = None
):
    agent = request.app.state.agent
    episode_int = None
    if episode is not None:
        try:
            episode_int = int(episode)
        except (ValueError, TypeError):
            pass
    
    results = []
    if agent and hasattr(agent, 'nyaa') and q:
        res = resolution if resolution else agent.settings.preferred_resolution
        results = agent.nyaa.search(
            q,
            episode_int,
            res,
            agent.settings.preferred_groups,
            category=category,
            nyaa_filter=filter,
        )
        
        existing_eps = set()
        progress = 0
        if media_id:
            try:
                mid = int(media_id)
                progress = agent.get_progress_for_media(mid)
                media_dir = agent.settings.get_media_folder(mid)
                
                if media_dir == agent.settings.default_download_dir:
                    from src.parser import AnimeParser
                    cached_list = agent.anilist._load_list_cache()
                    anime_info = next((e for e in cached_list if e.get('mediaId') == mid), None)
                    if anime_info:
                        romaji = anime_info.get('title', {}).get('romaji') or ''
                        english = anime_info.get('title', {}).get('english') or ''
                        title = romaji or english
                        title_safe = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip()
                        potential_dir = os.path.join(agent.settings.default_download_dir, title_safe)
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
            
    return results
