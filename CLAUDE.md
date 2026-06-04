# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MPV Anilist Tracker is a cross-platform anime tracking application that detects video playback in MPV, MPC-HC, or VLC, parses filenames to identify the anime and episode, and syncs progress to AniList. It exposes a FastAPI backend (port 8080) with a Preact-based web UI (port 5173 in dev).

## Development Commands

### Setup

```bash
# Python backend
python3 -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\activate
pip install -r requirements-dev.txt

# Frontend
cd frontend && npm install && cd ..
```

### Run in Development

```bash
source venv/bin/activate
python dev.py          # Starts Vite HMR (5173) + FastAPI (8080) with watchdog auto-reload
```

`dev.py` watches `src/` for `.py` and `.json` changes and restarts the backend automatically. The frontend proxies `/api/*` to port 8080.

### Run Tests

```bash
# All tests
python -m unittest discover -s tests -p "test_*.py" -v

# Single test file
python -m unittest tests/test_parser.py -v

# Single test case
python -m unittest tests.test_parser.TestAnimeParser.test_basic_parse -v
```

### Build Frontend

```bash
cd frontend && npm run build     # Outputs to frontend/dist/
```

### Run Backend Only (requires built frontend)

```bash
python src/main.py
```

### Packaging

```bash
python package.py    # PyInstaller → .exe (Windows) or .app/.dmg (macOS)
```

## Architecture

### Request Flow

Video file detected by a watcher → `TrackerAgent` (`src/main.py`) → `AnimeParser` extracts title + episode → `AnilistClient` searches for matching media → multi-season resolution via `_resolve_episode_to_media()` → state exposed via `/api/status` → Web UI presents sync button → POST to `/api/anilist/sync` → AniList GraphQL mutation.

### Backend

**`src/main.py` — `TrackerAgent`** is the central orchestrator. It:
- Holds references to all services (`AnilistClient`, `SettingsManager`, `NyaaInterface`)
- Manages a prioritized watcher list (MPC-HC → VLC → MPV → WindowTitle on Windows; MPV → VLC → WindowTitle on macOS/Linux)
- Runs a polling loop that calls the active watcher for the current filename
- Stores `current_media_map` (`dict[media_id → media_info]`) for multi-season disambiguation; `_resolve_episode_to_media()` walks AniList sequel relations to map a global episode number to the correct season entry
- Exposes itself to the API layer via `app.state.agent`; all routers access it through `request.app.state.agent`

**`src/watchers/`** — Each watcher implements `BaseWatcher.get_current_file() → Optional[str]`:

| Watcher | Mechanism |
|---|---|
| `MPVWatcher` | JSON IPC socket (`python-mpv-jsonipc`) |
| `VLCWatcher` | VLC HTTP API on `localhost:8080/requests/status.xml` |
| `MPCHCWatcher` | MPC-HC HTTP API (Windows only) |
| `WindowTitleWatcher` | OS window title enumeration (fallback) |

**`src/parser.py` — `AnimeParser`** chains two parsers:
1. **anitopy** (primary) — anime-specific tokeniser, handles group tags, quality strings, season/episode patterns
2. **guessit** — general media parser used as fallback

**`src/anilist.py` — `AnilistClient`** wraps AniList's GraphQL endpoint (`https://graphql.anilist.co`). OAuth token stored in the platform data directory. Results are cached locally to minimise API calls.

**`src/settings.py` — `SettingsManager`** reads/writes `config.json` in the platform data directory. Exposes typed properties for `preferred_groups`, `preferred_resolution`, `default_download_dir`, `base_anime_folder`, `title_overrides`, `torrent_archive`, etc.

**`src/library_index.py`** scans configured folders for video files (`.mkv`, `.mp4`, `.avi`) and builds an in-memory index used by both `router_library` and `router_nyaa` to determine which episodes are already downloaded.

**`src/nyaa.py` — `NyaaInterface`** queries nyaa.si's RSS feed. Returns results with `title`, `link` (download URL), `view_link` (page URL), `timestamp` (Unix int parsed from `pubDate`), `seeders`, `leechers`, `size`, `episode`, `is_batch`, `magnet`.

**`src/api/`** — FastAPI routers mounted in `src/api/__init__.py`:
- `router_status` → `/api/status`
- `router_anilist` → `/api/anilist/*`, `/api/animelist`, `/api/update_progress`, `/api/upcoming`
- `router_nyaa` → `/api/nyaa_search`, `/api/nyaa_batch_search_candidates`, `/api/nyaa_download`
- `router_library` → `/api/library/*`, `/api/move_to_trash`, `/api/open_trash`
- `router_os` → `/api/os/*`

**`src/web_server.py`** starts Uvicorn, mounts `frontend/dist/` as root static handler, and can run in a background daemon thread via `run_server_in_background()`.

### Frontend

Preact + Vite. State is managed with `@preact/signals` in `frontend/src/store.js` — flat reactive signals, no reducer pattern. Components read signals directly and call API functions on user action.

`frontend/src/api.js` is the unified HTTP client (all `fetch` calls centralised here, hitting relative `/api/*` paths). Vite proxies these to port 8080 in dev; in production the same FastAPI process serves both.

Key signals in `store.js`: `animeList`, `latestStatus`, `userSettings`, `torrentFilters`, `torrentCache`, `libraryData`, `pendingApiRequests`.

### Version

Single source of truth: `VERSION` file in the project root, read at startup by `src/runtime_env.resolve_resource_path`.

### Platform Data Directories

Resolved by `src/runtime_env.py`:
- **macOS:** `~/Library/Application Support/MPV Anilist Tracker`
- **Windows:** `%APPDATA%\MPV Anilist Tracker`

`config.json` and the AniList OAuth token live here.
