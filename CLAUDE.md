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
python dev.py          # Starts both Vite HMR server (5173) and FastAPI backend (8080) with watchdog auto-reload
```

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

## Architecture

### Request Flow

A new anime file detected by a watcher → `TrackerAgent` (src/main.py) → `AnimeParser` extracts title + episode → `AnilistClient` searches for matching media → multi-season resolution → status exposed via `/api/status` → Web UI presents sync button → POST to `/api/anilist/sync` → AniList GraphQL mutation.

### Backend

**`src/main.py` — `TrackerAgent`** is the central orchestrator. It:
- Holds references to all services (`AnilistClient`, `SettingsManager`, `NyaaInterface`)
- Manages a prioritized watcher list (MPC-HC → VLC → MPV → WindowTitle on Windows; MPV → VLC → WindowTitle on macOS/Linux)
- Runs a polling loop that calls the active watcher for the current filename
- Stores `current_media_map` (dict of `media_id → media_info`) for multi-season disambiguation and exposes it to the API layer via `app.state.agent`

**`src/watchers/`** — Each watcher implements `BaseWatcher` (base.py) with a `get_current_file()` method. MPV uses an IPC JSON socket, VLC uses its built-in HTTP API, MPC-HC uses Windows COM, and `WindowTitleWatcher` falls back to OS window title parsing.

**`src/anilist.py` — `AnilistClient`** wraps all AniList GraphQL queries (search, user list fetch, progress updates). Results are cached to minimise API calls.

**`src/api/`** — FastAPI routers mounted on the shared `app` in `src/api/__init__.py`:
- `router_status` → `/api/status` (current playback + sync state)
- `router_anilist` → `/api/anilist/*` (search, list, sync)
- `router_nyaa` → `/api/nyaa/*` (torrent search via nyaa.si)
- `router_library` → `/api/library/*` (local file scanning and cleanup)
- `router_os` → `/api/os/*` (open folder, trash file — cross-platform)

All routers reach `TrackerAgent` through `request.app.state.agent`.

**`src/web_server.py`** starts Uvicorn, mounts `frontend/dist/` (or `src/static/`) as the root static handler, and optionally runs in a background daemon thread via `run_server_in_background()`.

### Frontend

Preact + Vite. State is managed with `@preact/signals` in `frontend/src/store.js`. `frontend/src/api.js` is the HTTP client layer (all fetches go to relative `/api/*` paths, which Vite proxies to port 8080 in dev).

### Version

Single source of truth: `VERSION` file in the project root, read at startup by `src/runtime_env.resolve_resource_path`.

### Platform Data Directories

Resolved by `src/runtime_env.py`:
- **macOS:** `~/Library/Application Support/MPV Anilist Tracker`
- **Windows:** `%APPDATA%\MPV Anilist Tracker`
