from fastapi import APIRouter, Request, Query
from typing import Optional, List, Dict, Any
import os
import re
from src.library_index import (
    build_library_index,
    normalize_title,
    sanitize_folder_name,
)

router = APIRouter()


def _torrent_key(item: Dict[str, Any]) -> str:
    return item.get('link') or item.get('url') or item.get('magnet') or item.get('title') or ''


def _rank_torrent(torrent: Dict[str, Any], *, preferred_groups: List[str], category: str, nyaa_filter: str) -> tuple:
    title = torrent.get('title', '')
    title_lower = title.lower()
    group_rank = 0
    for idx, group in enumerate(preferred_groups or []):
        group_clean = group.strip("[] ").lower()
        if group_clean and group_clean in title_lower:
            group_rank = 100 - idx
            break
    trusted = 1 if str(torrent.get('category', '')).lower() == 'trusted' else 0
    if nyaa_filter == '2':
        trusted = 100
    if nyaa_filter == '1' and re.search(r'\b(remake|repack|v0)\b', title_lower):
        trusted -= 25
    size = torrent.get('seeders') or 0
    return (
        group_rank,
        trusted,
        size,
        torrent.get('timestamp') or 0,
    )


def _is_archived(agent, torrent: Dict[str, Any]) -> bool:
    archive = getattr(agent.settings, 'torrent_archive', []) or []
    key = _torrent_key(torrent)
    title = normalize_title(torrent.get('title', ''))
    for entry in archive:
        if _torrent_key(entry) == key:
            return True
        if title and normalize_title(entry.get('title', '')) == title:
            return True
    return False

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

        results = [r for r in results if not _is_archived(agent, r)]

        existing_eps = set()
        progress = 0
        if media_id:
            try:
                mid = int(media_id)
                progress = agent.get_progress_for_media(mid)
                cached_list = agent.anilist._load_list_cache() if hasattr(agent, 'anilist') else []
                index = build_library_index(
                    agent.settings.default_download_dir,
                    anilist_entries=cached_list or [],
                    title_overrides=agent.settings.title_overrides or {},
                )
                availability = index.resolve_local_availability(agent.settings, media_id=mid)
                existing_eps = availability['episode_numbers']
            except Exception as e:
                print(f"Error scanning library for search: {e}")

        results.sort(key=lambda t: _rank_torrent(t, preferred_groups=agent.settings.preferred_groups, category=category, nyaa_filter=filter), reverse=True)

        for r in results:
            ep = r.get('episode')
            r['is_downloaded'] = ep in existing_eps if ep else False
            r['is_watched'] = ep <= progress if (ep and progress) else False
            
    return results

@router.get('/api/nyaa_batch_search_candidates')
async def nyaa_batch_search_candidates(
    request: Request,
    airing_only: str = 'false'
):
    agent = request.app.state.agent
    if not agent or not hasattr(agent, 'anilist'):
        return []

    is_airing_only = airing_only.lower() == 'true'
    try:
        entries = agent.anilist.get_user_anime_list(['CURRENT'])
    except Exception:
        return []
    
    candidates = []
    index = build_library_index(
        agent.settings.default_download_dir,
        anilist_entries=entries,
        title_overrides=agent.settings.title_overrides or {},
    )

    for entry in entries:
        media_status = entry.get('mediaStatus')
        if is_airing_only and media_status != 'RELEASING':
            continue
            
        progress = entry.get('progress', 0)
        total_eps = entry.get('episodes')
        
        target_ep = progress + 1
        
        if total_eps and target_ep > total_eps:
            continue
            
        media_id = entry.get('mediaId')
        
        existing_eps = set()
        if media_id:
            try:
                availability = index.resolve_local_availability(agent.settings, media_id=media_id)
                existing_eps = availability['episode_numbers']
            except Exception:
                pass
                
        while target_ep in existing_eps:
            target_ep += 1
            
        if total_eps and target_ep > total_eps:
            continue
            
        romaji = entry.get('title', {}).get('romaji') or ''
        english = entry.get('title', {}).get('english') or ''
        title_query = f"{romaji}|{english}" if english and english != romaji else romaji
        
        candidates.append({
            'query': title_query,
            'anime_title': romaji or english,
            'episode': target_ep,
            'media_id': media_id,
        })

    return candidates

@router.post('/api/nyaa_download')
async def nyaa_download(request: Request):
    agent = request.app.state.agent
    data = await request.json()
    items = data.get('items', [])
    if not items and ('url' in data or 'link' in data):
        items = [{
            'url': data.get('url') or data.get('link'),
            'mediaId': data.get('mediaId') or data.get('media_id'),
            'animeTitle': data.get('animeTitle') or data.get('anime_title'),
        }]
    
    results = []
    if agent and hasattr(agent, 'nyaa'):
        for item in items:
            url = item.get('url') or item.get('link')
            media_id = item.get('mediaId') or item.get('media_id')
            anime_title = item.get('animeTitle') or item.get('anime_title')
            
            if not url: continue

            if media_id:
                configured = agent.settings.get_media_folder(int(media_id))
                if configured != agent.settings.default_download_dir:
                    download_dir = configured
                elif anime_title:
                    download_dir = os.path.join(agent.settings.default_download_dir, sanitize_folder_name(anime_title))
                else:
                    download_dir = agent.settings.default_download_dir
            elif anime_title:
                download_dir = os.path.join(agent.settings.default_download_dir, sanitize_folder_name(anime_title))
            else:
                download_dir = agent.settings.default_download_dir

            path = agent.nyaa.download_torrent(url, download_dir)
            if path:
                agent.settings.add_torrent_archive({"url": url, "title": anime_title or path})
            results.append({"url": url, "success": bool(path), "download_dir": download_dir})
        
    return {"success": True, "results": results}
