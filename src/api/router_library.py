from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import time
import json
import requests
import hashlib
import shutil
import urllib.parse
import sys
import subprocess
import re

router = APIRouter()

class PathRequest(BaseModel):
    path: str

class SettingsRequest(BaseModel):
    preferred_groups: Optional[str] = None
    preferred_resolution: Optional[str] = None
    default_download_dir: Optional[str] = None
    base_anime_folder: Optional[str] = None

class ChangeStatusRequest(BaseModel):
    mediaId: int
    status: str
    episode: Optional[int] = None

class UpdateTitleRequest(BaseModel):
    mediaId: int
    customTitle: str

@router.get('/api/search_anime')
async def search_anime(request: Request, q: str):
    agent = request.app.state.agent
    result = []
    if q and agent and hasattr(agent, 'anilist'):
        result = agent.anilist.search_anime(q)
    return result

@router.get('/api/settings')
async def get_settings(request: Request):
    agent = request.app.state.agent
    settings = {}
    if agent and hasattr(agent, 'settings'):
        settings = {
            'preferred_groups': ", ".join(agent.settings.preferred_groups),
            'preferred_resolution': agent.settings.preferred_resolution,
            'default_download_dir': agent.settings.default_download_dir,
            'base_anime_folder': agent.settings.base_anime_folder,
            'title_overrides': agent.settings.title_overrides or {}
        }
    return settings

@router.post('/api/settings')
async def save_settings(request: Request, body: SettingsRequest):
    agent = request.app.state.agent
    if agent and hasattr(agent, 'settings'):
        if body.preferred_groups is not None:
            agent.settings.preferred_groups = [g.strip() for g in body.preferred_groups.split(',') if g.strip()]
        if body.preferred_resolution is not None:
            agent.settings.preferred_resolution = body.preferred_resolution
        if body.default_download_dir is not None:
            agent.settings.default_download_dir = body.default_download_dir
        if body.base_anime_folder is not None:
            agent.settings.base_anime_folder = body.base_anime_folder
    return {"success": True}

@router.get('/api/play_latest')
async def play_latest(request: Request, mediaId: Optional[int] = None):
    agent = request.app.state.agent
    success = False
    if agent and mediaId:
        try:
            folder_path = agent.settings.get_media_folder(mediaId)
            progress = 0
            if hasattr(agent, 'anilist'):
                entry = agent.anilist.get_list_entry(mediaId)
                if entry: progress = entry.get('progress', 0)
            
            if os.path.exists(folder_path):
                from src.parser import AnimeParser
                video_exts = ('.mkv', '.mp4', '.avi')
                candidates = []
                for item in os.listdir(folder_path):
                    if item.lower().endswith(video_exts):
                        p = AnimeParser.parse_filename(item)
                        if p and p.get('episode') is not None:
                            ep = p.get('episode')
                            if isinstance(ep, list): ep = ep[-1]
                            candidates.append((ep, os.path.join(folder_path, item)))
                
                candidates.sort()
                target_file = None
                for ep, path in candidates:
                    if ep > progress:
                        target_file = path
                        break
                
                if not target_file and candidates:
                    target_file = candidates[0][1]
                    
                if target_file:
                    if sys.platform == 'win32': os.startfile(target_file)
                    elif sys.platform == 'darwin': subprocess.run(['open', target_file], check=True)
                    else: subprocess.run(['xdg-open', target_file], check=True)
                    success = True
        except Exception as e:
            print(f"Failed to play latest: {e}")
    return {"success": success}

@router.get('/api/play_file')
async def play_file(request: Request, path: Optional[str] = None):
    success = False
    if path and os.path.exists(path):
        try:
            if sys.platform == 'win32': os.startfile(path)
            elif sys.platform == 'darwin': subprocess.run(['open', path], check=True)
            else: subprocess.run(['xdg-open', path], check=True)
            success = True
        except Exception as e:
            print(f"Failed to play file securely: {e}")
    return {"success": success}

@router.get('/api/clear_cache')
async def clear_cache():
    if os.path.exists('library_cache.json'):
        try: os.remove('library_cache.json')
        except: pass
    if os.path.exists('upcoming_cache.json'):
        try: os.remove('upcoming_cache.json')
        except: pass
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    cache_dir = os.path.join(base_dir, 'image_cache')
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir, ignore_errors=True)
        os.makedirs(cache_dir, exist_ok=True)
    return {"success": True}

@router.get('/api/folders')
async def get_folders(request: Request):
    agent = request.app.state.agent
    folders = []
    if agent and hasattr(agent, 'settings'):
        base_dir = agent.settings.base_anime_folder
        if os.path.exists(base_dir):
            try:
                for item in sorted(os.listdir(base_dir)):
                    if os.path.isdir(os.path.join(base_dir, item)) and not item.startswith('.'):
                        folders.append(item)
            except Exception as e:
                print(f"Error listing folders: {e}")
    return folders

@router.post('/api/organize_folders')
async def organize_folders(request: Request):
    agent = request.app.state.agent
    results = []
    if agent and hasattr(agent, 'settings'):
        base_dir = agent.settings.base_anime_folder
        if os.path.exists(base_dir):
            from src.parser import AnimeParser
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
    return {"success": True, "results": results}

@router.get('/api/library/exclusions')
async def get_library_exclusions(request: Request):
    agent = request.app.state.agent
    exclusions = []
    if agent and hasattr(agent, 'settings'):
        exclusions = agent.settings.library_exclusions or []
    return exclusions

@router.post('/api/library/exclude')
async def library_exclude(request: Request, body: PathRequest):
    agent = request.app.state.agent
    success = False
    if agent and hasattr(agent, 'settings') and body.path:
        agent.settings.add_library_exclusion(body.path)
        if os.path.exists('library_cache.json'):
            try: os.remove('library_cache.json')
            except: pass
        success = True
    return {"success": success}

@router.post('/api/library/include')
async def library_include(request: Request, body: PathRequest):
    agent = request.app.state.agent
    success = False
    if agent and hasattr(agent, 'settings') and body.path:
        agent.settings.remove_library_exclusion(body.path)
        if os.path.exists('library_cache.json'):
            try: os.remove('library_cache.json')
            except: pass
        success = True
    return {"success": success}

@router.post('/api/change_status')
async def change_status(request: Request, body: ChangeStatusRequest):
    agent = request.app.state.agent
    success = False
    if agent and hasattr(agent, 'anilist'):
        success = agent.anilist.change_status(body.mediaId, body.status, progress=int(body.episode) if body.episode is not None else None)
    return {"success": success}

@router.post('/api/update_title_override')
async def update_title_override(request: Request, body: UpdateTitleRequest):
    agent = request.app.state.agent
    success = False
    if agent and hasattr(agent, 'settings'):
        agent.settings.update_title_override(body.mediaId, body.customTitle)
        success = True
    return {"success": success}

@router.post('/api/reset_title_overrides')
async def reset_title_overrides(request: Request):
    agent = request.app.state.agent
    success = False
    if agent and hasattr(agent, 'settings'):
        agent.settings.set("title_overrides", {})
        success = True
    return {"success": success}

@router.get('/api/full_refresh')
async def full_refresh(request: Request):
    agent = request.app.state.agent
    if agent:
        agent.current_media_map = {}
        agent.selected_media_id = None
        agent.current_anilist_progress = 0
        agent.current_media_id = None
        agent._cached_anilist_episodes = None
        agent.last_synced_filename = None
        if hasattr(agent, 'anilist'): agent.anilist.user_id = None
    
    # Image cache
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    cache_dir = os.path.join(base_dir, 'image_cache')
    if os.path.exists(cache_dir): shutil.rmtree(cache_dir, ignore_errors=True)
    if os.path.exists('library_cache.json'):
        try: os.remove('library_cache.json')
        except: pass
    setattr(agent, 'manual_episode_override', None)
    return {"success": True}

@router.get('/api/sync')
async def sync_progress(request: Request):
    agent = request.app.state.agent
    success = False
    if agent and agent.active_watcher and agent.active_watcher.is_connected:
        filename = agent.active_watcher.get_current_filename()
        if filename:
            if hasattr(agent, 'sync_progress_manual') and getattr(agent, 'manual_episode_override', None) is not None:
                agent.sync_progress_manual(filename, agent.manual_episode_override, getattr(agent, 'selected_media_id', None))
                success = True
            else:
                agent.sync_progress(filename)
                success = True
    return {"success": success}

@router.get('/api/library/cleanup_candidates')
async def cleanup_candidates(request: Request):
    agent = request.app.state.agent
    candidates = []
    if not agent or not hasattr(agent, 'settings'):
        return []
        
    base_dir = agent.settings.base_anime_folder
    if not base_dir or not os.path.exists(base_dir):
        return []
    
    from src.parser import AnimeParser
    video_exts = ('.mkv', '.mp4', '.avi')
    
    # Load AniList cache for matching
    anilist_entries = []
    if hasattr(agent, 'anilist'):
        anilist_entries = agent.anilist._load_list_cache() or []
    
    # Map mediaId to list status/progress
    anilist_map = {e.get('mediaId'): e for e in anilist_entries if isinstance(e, dict)}
    
    # Scan both directories and loose files
    candidates = []
    try:
        items_to_check = os.listdir(base_dir)
    except Exception:
        return []
    
    for item in items_to_check:
        item_path = os.path.join(base_dir, item)
        if item.startswith('.'): continue
            
        is_dir = os.path.isdir(item_path)
        is_file = os.path.isfile(item_path) and item.lower().endswith(video_exts)
        
        if not is_dir and not is_file: continue
            
        # Match search term
        match_search = item if is_dir else item
        parsed = None
        try:
            parsed = AnimeParser.parse_filename(match_search)
        except Exception:
            pass
        matched_entry = None
        
        if parsed and parsed.get('title'):
            title = parsed['title']
            # Search overrides first
            overrides = agent.settings.title_overrides or {}
            for mid_str, custom_title in overrides.items():
                if custom_title.lower() == title.lower():
                    matched_entry = anilist_map.get(int(mid_str))
                    break
            
            if not matched_entry:
                for e in anilist_entries:
                    romaji = e.get('title', {}).get('romaji') or ''
                    english = e.get('title', {}).get('english') or ''
                    if (romaji and romaji.lower() == title.lower()) or (english and english.lower() == title.lower()):
                        matched_entry = e
                        break
        
        if matched_entry:
            status = matched_entry.get('listStatus')
            progress = matched_entry.get('progress') or 0
            
            # Sub-files if it's a directory, or just the file itself
            files_to_eval = []
            if is_dir:
                try:
                    files_to_eval = [(f, os.path.join(item_path, f)) for f in os.listdir(item_path) if f.lower().endswith(video_exts)]
                except: pass
            else:
                files_to_eval = [(item, item_path)]
                
            for filename, f_path in files_to_eval:
                p_file = None
                try:
                    p_file = AnimeParser.parse_filename(filename)
                except Exception:
                    pass
                if p_file and p_file.get('episode') is not None:
                    ep = p_file.get('episode')
                    if isinstance(ep, list): ep = ep[-1]
                    
                    is_candidate = False
                    if status == 'COMPLETED':
                        is_candidate = True
                    elif status == 'CURRENT' and ep <= progress:
                        is_candidate = True
                        
                    if is_candidate:
                        try:
                            size = os.path.getsize(f_path)
                            candidates.append({
                                'path': f_path,
                                'size': size,
                                'animeTitle': matched_entry.get('title', {}).get('romaji') or item,
                                'listStatus': status,
                                'progress': progress,
                                'episode': ep
                            })
                        except: pass
                        
    return candidates

@router.get('/api/library')
async def get_library(request: Request, force_refresh: str = 'false'):
    agent = request.app.state.agent
    force_refresh = force_refresh.lower() == 'true'
    cache_file = 'library_cache.json'

    if not force_refresh and os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                return {"success": True, "data": json.load(f)}
        except: pass

    if not agent or not hasattr(agent, 'settings'):
        return {"success": False, "data": []}

    base_dir = agent.settings.base_anime_folder
    if not base_dir or not os.path.exists(base_dir):
        return {"success": False, "data": []}

    from src.parser import AnimeParser
    video_exts = ('.mkv', '.mp4', '.avi')
    exclusions = agent.settings.library_exclusions or []
    
    # Load AniList cache for matching
    anilist_entries = []
    if hasattr(agent, 'anilist'):
        anilist_entries = agent.anilist._load_list_cache() or []
    anilist_map = {e.get('mediaId'): e for e in anilist_entries if isinstance(e, dict)}

    def scan_node(node_path, level=0):
        if node_path in exclusions: return None
        
        name = os.path.basename(node_path)
        if name.startswith('.'): return None
        
        is_dir = os.path.isdir(node_path)
        is_file = os.path.isfile(node_path) and name.lower().endswith(video_exts)
        
        if not is_dir and not is_file: return None
        
        try:
            stat = os.stat(node_path)
            size = stat.st_size
        except: return None
        
        node = {
            'name': name,
            'type': 'directory' if is_dir else 'file',
            'path': node_path,
            'size': size
        }

        # Attempt to match to AniList (for both folders and loose files)
        parsed = None
        try:
            parsed = AnimeParser.parse_filename(name)
        except Exception:
            pass
        if parsed and parsed.get('title'):
            title = parsed['title']
            matched = None
            
            # Check overrides
            overrides = agent.settings.title_overrides or {}
            for mid_str, custom_title in overrides.items():
                if custom_title.lower() == title.lower():
                    matched = anilist_map.get(int(mid_str))
                    break
            
            if not matched:
                for e in anilist_entries:
                    romaji = e.get('title', {}).get('romaji') or ''
                    english = e.get('title', {}).get('english') or ''
                    if (romaji and romaji.lower() == title.lower()) or (english and english.lower() == title.lower()):
                        matched = e
                        break
            
            if matched:
                node['mediaId'] = matched.get('mediaId')
                node['listStatus'] = matched.get('listStatus')
                node['progress'] = matched.get('progress') or 0
                if not is_dir:
                    node['episode'] = parsed.get('episode')

        if is_dir:
            node['children'] = []
            # Only scan 1 level deep for files inside folders
            if level <= 1:
                try:
                    items = sorted(os.listdir(node_path))
                    for item in items:
                        child = scan_node(os.path.join(node_path, item), level + 1)
                        if child: node['children'].append(child)
                except: pass
                
            # Calculate total size of directory
            if node['children']:
                node['size'] = sum(c['size'] for c in node['children'])
            
            # Count local episodes if matched
            if 'mediaId' in node:
                ep_count = 0
                for c in node['children']:
                    if c['type'] == 'file' and c['name'].lower().endswith(video_exts):
                        p_file = None
                        try:
                            p_file = AnimeParser.parse_filename(c['name'])
                        except Exception:
                            pass
                        if p_file and p_file.get('episode') is not None:
                            ep_count += 1
                node['localEpisodeCount'] = ep_count
        
        return node

    # Build the tree
    library_tree = []
    try:
        for item in sorted(os.listdir(base_dir)):
            node = scan_node(os.path.join(base_dir, item), 1)
            if node: library_tree.append(node)
    except Exception as e:
        print(f"Error accessing base directory: {e}")
        
    # Save to cache
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(library_tree, f, ensure_ascii=False, indent=2)
    except: pass

    return {"success": True, "data": library_tree}

@router.get('/api/image')
def get_image(url: str):
    if not url:
        return Response(status_code=400)

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    cache_dir = os.path.join(base_dir, 'image_cache')
    os.makedirs(cache_dir, exist_ok=True)
    
    filename = hashlib.md5(url.encode()).hexdigest()
    cache_path = os.path.join(cache_dir, filename)
    
    if not os.path.exists(cache_path):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
            r = requests.get(url, headers=headers, timeout=5)
            r.raise_for_status()
            content_type = r.headers.get('content-type', 'image/jpeg')
            with open(cache_path, 'wb') as f:
                f.write(r.content)
            with open(cache_path + '.meta', 'w') as f:
                f.write(content_type)
        except Exception:
            # Fallback to redirecting the client to the original URL if proxy/caching fails
            return Response(status_code=302, headers={"Location": url})
    
    try:
        with open(cache_path + '.meta', 'r') as f:
            content_type = f.read()
    except Exception:
        content_type = 'image/jpeg'
        
    try:
        with open(cache_path, 'rb') as f:
            content = f.read()
        return Response(content=content, media_type=content_type, headers={'Cache-Control': 'public, max-age=31536000'})
    except Exception:
        return Response(status_code=302, headers={"Location": url})
