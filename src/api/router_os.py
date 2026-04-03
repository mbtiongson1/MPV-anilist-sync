from fastapi import APIRouter, Request, HTTPException
import os
import sys
import subprocess
import shlex
import urllib.parse

from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class FolderRequest(BaseModel):
    mediaId: Optional[int] = None
    path: Optional[str] = None

class PathsRequest(BaseModel):
    paths: List[str]

class PathRequest(BaseModel):
    path: str

@router.get('/api/open_folder')
async def open_folder_get(request: Request, mediaId: Optional[int] = None, path: Optional[str] = None):
    return await open_folder(request, FolderRequest(mediaId=mediaId, path=path))

@router.post('/api/open_folder')
async def open_folder(request: Request, body: FolderRequest):
    agent = request.app.state.agent
    folder_path = None
    
    if body.path:
        folder_path = body.path
    elif agent and body.mediaId:
        try:
            folder_path = agent.settings.get_media_folder(int(body.mediaId))
            if not os.path.exists(folder_path) or folder_path == agent.settings.default_download_dir:
                if hasattr(agent, 'anilist'):
                    entries = agent.anilist._load_list_cache()
                    for entry in entries:
                        if entry.get('mediaId') == int(body.mediaId):
                            name = entry.get('title', {}).get('romaji') or entry.get('title', {}).get('english') or str(body.mediaId)
                            title_safe = "".join([c for c in name if c.isalnum() or c in (' ', '-', '_')]).strip()
                            subfolder = os.path.join(agent.settings.default_download_dir, title_safe)
                            if os.path.exists(subfolder):
                                folder_path = subfolder
                            break
        except Exception as e:
            print(f"Failed to determine folder path from mediaId: {e}")

    # Fallback to last played
    if not folder_path and not body.mediaId:
        folder_path = agent.settings.last_played_file

    if folder_path:
        # Resolve to real absolute path safely
        folder_path = os.path.abspath(folder_path)
        if os.path.isfile(folder_path):
            folder_to_open = os.path.dirname(folder_path)
            target = folder_path
        else:
            folder_to_open = folder_path
            target = folder_path

        try:
            if not os.path.exists(folder_to_open):
                os.makedirs(folder_to_open, exist_ok=True)
            
            if sys.platform == 'win32':
                os.startfile(folder_to_open)
            elif sys.platform == 'darwin':
                # Use secure subprocess.run
                subprocess.run(['open', '-R' if os.path.isfile(target) else '', target], check=True)
            else:
                subprocess.run(['xdg-open', folder_to_open], check=True)
            return {"success": True}
        except Exception as e:
            print(f"Failed to open folder securely: {e}")
            return {"success": False}
    return {"success": False}

@router.get('/api/play_pause')
async def play_pause(request: Request):
    agent = request.app.state.agent
    success = False
    if agent:
        if agent.active_watcher and agent.active_watcher.is_connected:
            agent.active_watcher.toggle_pause()
            success = True
        elif sys.platform == 'darwin':
            try:
                subprocess.run(['osascript', '-e', 'tell application "System Events" to key code 49'], check=True)
                success = True
            except Exception as e:
                print(f"Error toggling play/pause on darwin: {e}")
    return {"success": success}

@router.get('/api/play_next')
async def play_next(request: Request):
    agent = request.app.state.agent
    success = False
    if agent and agent.active_watcher and agent.active_watcher.is_connected:
        agent.active_watcher.next_episode()
        success = True
    return {"success": success}

@router.get('/api/play_prev')
async def play_prev(request: Request):
    agent = request.app.state.agent
    success = False
    if agent and agent.active_watcher and agent.active_watcher.is_connected:
        agent.active_watcher.previous_episode()
        success = True
    return {"success": success}

@router.get('/api/resume')
async def resume(request: Request):
    agent = request.app.state.agent
    success = False
    last_file = agent.settings.last_played_file
    if last_file:
        last_file = os.path.normpath(last_file)
        if os.path.exists(last_file):
            try:
                abs_path = os.path.abspath(last_file)
                if sys.platform == 'win32':
                    os.startfile(abs_path)
                    success = True
                elif sys.platform == 'darwin':
                    subprocess.run(['open', abs_path], check=True)
                    success = True
                else:
                    subprocess.run(['xdg-open', abs_path], check=True)
                    success = True
            except Exception as e:
                print(f"Exception during resume: {e}")
    return {"success": success}

@router.post('/api/move_to_trash')
async def move_to_trash(request: Request, body: PathsRequest):
    from send2trash import send2trash
    success_count = 0
    for p in body.paths:
        if os.path.exists(p):
            try:
                send2trash(p)
                success_count += 1
            except Exception as e:
                print(f"Failed to trash {p}: {e}")
    
    if os.path.exists('library_cache.json'):
        try:
            os.remove('library_cache.json')
        except Exception as e:
            print(f"Cache deletion error: {e}")
            
    return {"success": success_count == len(body.paths), "count": success_count}

@router.get('/api/open_trash')
async def open_trash(request: Request):
    try:
        if sys.platform == 'win32':
            subprocess.run(['explorer', 'shell:RecycleBinFolder'], check=True)
        elif sys.platform == 'darwin':
            subprocess.run(['open', 'trash:///'], check=True)
        else:
            subprocess.run(['xdg-open', 'trash:///'], check=True)
        return {"success": True}
    except Exception as e:
        print(f"Error opening trash: {e}")
        return {"success": False}
