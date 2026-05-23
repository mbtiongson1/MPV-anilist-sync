# Architecture

MPV Anilist Tracker is split into a Python/FastAPI backend and a Preact/Vite frontend. They communicate exclusively through a local HTTP API on port 8080.

---

## High-Level Data Flow

```
Video Player (MPV / VLC / MPC-HC)
       │  IPC / HTTP / COM / window title
       ▼
  src/watchers/        ← polls for current filename
       │
       ▼
  TrackerAgent         ← central orchestrator (src/main.py)
   ├─ AnimeParser      ← anitopy + guessit filename parsing
   ├─ AnilistClient    ← GraphQL queries + local cache
   ├─ NyaaInterface    ← torrent search (nyaa.si)
   └─ SettingsManager  ← JSON config on disk
       │
       ▼
  FastAPI (src/api/)   ← exposes state and actions
       │
       ▼
  Preact Web UI        ← user reviews and triggers sync
       │
       ▼
  AniList GraphQL API  ← watch progress written here
```

---

## Backend

### TrackerAgent (`src/main.py`)

The single long-running object created at startup. It owns:

- **Watcher priority list** — tried in order until one returns a filename. Platform-specific ordering: Windows uses MPC-HC first; macOS/Linux uses MPV first.
- **`current_media_map`** — `{media_id: media_info}` populated after a filename is parsed and matched on AniList. Supports multi-season anime where the same file might belong to one of several related AniList entries.
- **`selected_media_id`** — the entry the user has confirmed (or the auto-resolved one).
- **`_resolve_episode_to_media()`** — walks the AniList sequel chain to map a global episode number (e.g. episode 37 of a continuous-numbering rip) to the correct season entry and local episode.

The agent is attached to the FastAPI `app.state.agent` so every router can access it without passing it as a parameter.

### Watchers (`src/watchers/`)

| Watcher | Mechanism | Platform |
|---|---|---|
| `MPVWatcher` | JSON IPC socket (`python-mpv-jsonipc`) | All |
| `VLCWatcher` | VLC HTTP API (`http://localhost:8080/requests/status.xml`) | All |
| `MPCHCWatcher` | MPC-HC HTTP API | Windows only |
| `WindowTitleWatcher` | OS window title enumeration | Fallback |

All implement `BaseWatcher.get_current_file() → Optional[str]`.

### AnilistClient (`src/anilist.py`)

Thin wrapper around AniList's GraphQL endpoint (`https://graphql.anilist.co`). Key operations:

- `search_anime(title)` — fuzzy title search with relations (used to build `current_media_map`)
- `get_user_list()` — fetch the authenticated user's full list; cached locally
- `update_progress(media_id, episode)` — the write operation triggered by the UI

Authentication is OAuth token-based, stored in the platform data directory.

### Filename Parsing (`src/parser.py`)

`AnimeParser` chains two libraries:
1. **anitopy** — anime-specific tokeniser (understands group tags, video quality, season/episode patterns)
2. **guessit** — general media parser used as fallback

The output is `{title, episode_number, season}` which is passed to `AnilistClient.search_anime`.

### API Layer (`src/api/`)

FastAPI application defined in `src/api/__init__.py`. Routers:

| Module | Prefix | Responsibility |
|---|---|---|
| `router_status` | `/api/status` | Returns `TrackerAgent` current state as JSON |
| `router_anilist` | `/api/anilist` | Search, list, progress sync, season selection |
| `router_nyaa` | `/api/nyaa` | Torrent search for missing episodes |
| `router_library` | `/api/library` | Scan configured folders, return file list, bulk delete |
| `router_os` | `/api/os` | Open folder in Finder/Explorer, move file to trash |

`src/web_server.py` starts Uvicorn, mounts the built frontend at `/`, and optionally runs the server in a background daemon thread (`run_server_in_background`).

### Settings (`src/settings.py`)

`SettingsManager` reads and writes `config.json` in the platform data directory. Settings include watch folders, AniList token, refresh interval, and per-show title overrides.

### Library Indexer (`src/library_index.py`)

Scans the configured folders for video files and builds an in-memory index. Exposes it through `router_library` for the Library view. Supports bulk delete of watched files.

### Nyaa Integration (`src/nyaa.py`)

Parses RSS feeds from nyaa.si for a given search query. Used by the Torrents view to surface missing episodes for currently-airing shows on the user's AniList.

---

## Frontend

**Stack:** Preact 10, Vite 8, `@preact/signals` for reactive state.

**Entry:** `frontend/src/main.jsx` renders `<App />` into `#app`.

**State** (`frontend/src/store.js`): Preact Signals — flat reactive values shared across components. No reducer pattern; components read signals directly and call API functions on user action.

**API client** (`frontend/src/api.js`): `fetch` wrappers that hit relative `/api/*` paths. Vite dev server proxies these to `localhost:8080`; the production build is served by the same FastAPI process so no proxy is needed.

**Views:**
- `AnimeGrid` — browsable AniList list (watching, plan-to-watch, etc.)
- `LibraryView` — local file browser backed by `/api/library`
- `TorrentsView` — Nyaa search results for airing shows
- `StatsView` — watch-time heatmaps and genre breakdown
- `NowPlaying` — live playback status, season picker, sync button

---

## Development Orchestration (`dev.py`)

`dev.py` starts two processes:
1. **Vite dev server** (`npm run dev`, port 5173) with HMR
2. **Python backend** (`python src/main.py`, port 8080) monitored by `watchdog` — restarts on any `.py` or `.json` change under `src/`

---

## Packaging

`package.py` uses PyInstaller to produce:
- Windows: single `.exe`
- macOS: `.app` bundle + `.dmg` (via `dmgbuild`)

The `VERSION` file at the project root is the single source of truth for version strings across the Python code and CI workflows.

---

## CI/CD (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push / PR | Run Python test suite |
| `release.yml` | push to main | Build and publish GitHub release |
| `packaging.yml` | manual / release | Build platform binaries |
| `auto-tag.yml` | push to main | Tag commit from `VERSION` |
| `auto-merge.yml` | PR | Auto-merge approved bot PRs |
| `openapi.yml` | push | Generate OpenAPI spec from FastAPI |
