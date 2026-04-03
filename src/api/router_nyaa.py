from fastapi import APIRouter, Request, Query
from typing import Optional, List
import os

router = APIRouter()

@router.get('/api/nyaa_search')
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

@router.post('/api/nyaa_download')
async def nyaa_download(request: Request):
    agent = request.app.state.agent
    data = await request.json()
    items = data.get('items', [])
    if not items and 'url' in data:
        items = [{'url': data['url'], 'mediaId': data.get('mediaId'), 'animeTitle': data.get('animeTitle')}]
    
    results = []
    if agent and hasattr(agent, 'nyaa'):
        for item in items:
            url = item.get('url')
            media_id = item.get('mediaId')
            anime_title = item.get('animeTitle')
            
            if not url: continue

            def _make_title_dir(title: str) -> str:
                import re
                safe = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', title).strip()
                return safe or 'Downloads'

            if media_id:
                configured = agent.settings.get_media_folder(int(media_id))
                if configured != agent.settings.default_download_dir:
                    download_dir = configured
                elif anime_title:
                    download_dir = os.path.join(agent.settings.default_download_dir, _make_title_dir(anime_title))
                else:
                    download_dir = agent.settings.default_download_dir
            elif anime_title:
                download_dir = os.path.join(agent.settings.default_download_dir, _make_title_dir(anime_title))
            else:
                download_dir = agent.settings.default_download_dir

            path = agent.nyaa.download_torrent(url, download_dir)
            results.append({"url": url, "success": bool(path)})
        
    return {"success": True, "results": results}
