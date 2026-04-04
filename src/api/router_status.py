from fastapi import APIRouter, Request
from pydantic import BaseModel
import os

router = APIRouter()

class AdjustRequest(BaseModel):
    change: int

class SelectSeasonRequest(BaseModel):
    mediaId: int

@router.get('/api/status')
async def get_status(request: Request):
    agent = request.app.state.agent
    is_running = False
    title = ""
    base_title = ""
    episode = 0
    display_episode = 0
    total_episodes = 0
    anilist_progress = 0
    anilist_total_episodes = None
    selected_media = None
    season_options = []
    media_details = None
    is_paused = False
    can_next = False
    can_prev = False
    watcher_name = None
    manual_episode_override = getattr(agent, 'manual_episode_override', None)

    def _get_total_episodes(filename: str) -> int:
        try:
            import glob
            dir_path = os.path.dirname(filename)
            if not dir_path or not os.path.exists(dir_path):
                return 0
            video_exts = ('*.mkv', '*.mp4', '*.avi')
            count = 0
            for ext in video_exts:
                count += len(glob.glob(os.path.join(dir_path, ext)))
            return count
        except Exception:
            return 0

    if agent and agent.active_watcher and agent.active_watcher.is_connected:
        is_paused = agent.active_watcher.is_paused
        filename = agent.active_watcher.get_current_filename()
        if filename:
            try:
                folder = os.path.dirname(os.path.abspath(filename))
                if os.path.exists(folder):
                    from src.parser import AnimeParser
                    video_exts = ('.mkv', '.mp4', '.avi')
                    files = [f for f in os.listdir(folder) if f.lower().endswith(video_exts)]
                    parsed_files = []
                    for f in files:
                        p = AnimeParser.parse_filename(f)
                        if p and p.get('episode') is not None:
                            ep = p.get('episode')
                            if isinstance(ep, list): ep = ep[-1]
                            parsed_files.append(ep)
                    
                    current_p = AnimeParser.parse_filename(os.path.basename(filename))
                    current_ep = current_p.get('episode') if current_p else None
                    if isinstance(current_ep, list): current_ep = current_ep[-1]
                    
                    if current_ep is not None:
                        can_next = any(e > current_ep for e in parsed_files)
                        can_prev = any(e < current_ep for e in parsed_files)
            except Exception: pass

            total_episodes = _get_total_episodes(filename)

            from src.parser import AnimeParser
            parsed = AnimeParser.parse_filename(filename)
            if parsed and parsed.get('title'):
                base_title = parsed['title']
                ep_val = parsed.get('episode')
                if isinstance(ep_val, list):
                    ep_val = ep_val[-1]

                season_val = parsed.get('season')

                if manual_episode_override is not None:
                    episode = manual_episode_override
                else:
                    episode = ep_val if ep_val is not None else 1
                    agent.manual_episode_override = episode

                display_episode = episode
                if isinstance(episode, int) and episode > 0:
                    selected_media = None
                    if hasattr(agent, 'selected_media_id') and agent.selected_media_id:
                        selected_media = agent.current_media_map.get(agent.selected_media_id)

                    season1_episodes = None
                    if hasattr(agent, 'current_media_map'):
                        for m in agent.current_media_map.values():
                            if m.get('season') == 1 and isinstance(m.get('episodes'), int):
                                season1_episodes = m.get('episodes')
                                break

                    if (
                        selected_media
                        and isinstance(selected_media.get('episodes'), int)
                        and season1_episodes
                        and episode > selected_media.get('episodes')
                        and episode > season1_episodes
                    ):
                        display_episode = episode - season1_episodes

                season_label = None
                if selected_media and isinstance(selected_media.get('season'), int):
                    season_label = f"S{selected_media.get('season')}"
                elif season_val is not None:
                    try:
                        season_int = int(season_val)
                        season_label = f"S{season_int}"
                    except Exception:
                        season_label = None

                if season_label:
                    title = f"{base_title} - {season_label} E{display_episode}"
                else:
                    title = f"{base_title} - E{display_episode}"
            else:
                title = filename
                display_episode = episode
                agent.manual_episode_override = None

            if hasattr(agent, 'current_media_map'):
                season_options = []
                for mid, data in agent.current_media_map.items():
                    season_options.append({
                        'mediaId': mid,
                        'title': data.get('title', {}).get('romaji') or data.get('title', {}).get('english') or '',
                        'episodes': data.get('episodes'),
                        'season': data.get('season'),
                        'seasonYear': data.get('seasonYear'),
                        'popularity': data.get('popularity'),
                        'averageScore': data.get('averageScore'),
                    })

                selected_id = getattr(agent, 'selected_media_id', None)
                if selected_id is None and season_options:
                    selected_id = season_options[0]['mediaId']
                if selected_id:
                    selected_media = agent.current_media_map.get(selected_id)

            if selected_media:
                studios_nodes = selected_media.get('studios', {}).get('nodes', [])
                media_details = {
                    'mediaId': selected_media.get('id'),
                    'title': selected_media.get('title', {}),
                    'description': selected_media.get('description'),
                    'episodes': selected_media.get('episodes'),
                    'season': selected_media.get('season'),
                    'seasonYear': selected_media.get('seasonYear'),
                    'popularity': selected_media.get('popularity'),
                    'averageScore': selected_media.get('averageScore'),
                    'coverImage': selected_media.get('coverImage'),
                    'bannerImage': selected_media.get('bannerImage'),
                    'status': selected_media.get('status'),
                    'studio': studios_nodes[0]['name'] if studios_nodes else None,
                    'nextAiringEpisode': selected_media.get('nextAiringEpisode'),
                }
                anilist_progress = agent.get_progress_for_media(selected_id)
                agent.selected_media_id = selected_id
                anilist_total_episodes = selected_media.get('episodes')
            else:
                anilist_progress = getattr(agent, 'current_anilist_progress', 0)
                anilist_total_episodes = getattr(agent, '_cached_anilist_episodes', None)

            is_running = True
            watcher_name = agent.active_watcher.__class__.__name__.replace("Watcher", "")
    else:
        agent.manual_episode_override = None

    response = {
        "running": is_running,
        "watcher_name": watcher_name,
        "title": title,
        "base_title": base_title,
        "watched_episodes": display_episode,
        "total_episodes": total_episodes,
        "anilist_progress": anilist_progress,
        "anilist_total_episodes": anilist_total_episodes,
        "selected_media_id": getattr(agent, 'selected_media_id', None),
        "season_options": season_options,
        "media_details": media_details,
        "paused": is_paused,
        "can_next": can_next,
        "can_prev": can_prev,
        "last_played_file": agent.settings.last_played_file if agent else None,
        "last_played_title": os.path.basename(agent.settings.last_played_file) if agent and agent.settings.last_played_file else None,
    }
    return response

@router.post('/api/adjust_episode')
async def adjust_episode(request: Request, body: AdjustRequest):
    agent = request.app.state.agent
    current = getattr(agent, 'manual_episode_override', None)
    if current is not None:
        agent.manual_episode_override = max(1, current + body.change)
    return {"success": True, "new_episode": getattr(agent, 'manual_episode_override', None)}

@router.post('/api/select_season')
async def select_season(request: Request, body: SelectSeasonRequest):
    agent = request.app.state.agent
    if agent and hasattr(agent, 'set_selected_media'):
        agent.set_selected_media(body.mediaId)
    return {"success": True, "selected_media_id": body.mediaId}
