# 🎬 MPV Anilist Tracker (v5.0.0)

A lightweight, background Python agent for Windows and macOS that detects when an anime video is being played, extracts the title and episode from the filename, and automatically syncs your watch progress to your **Anilist.co** account.

---

## 📖 About the App

MPV Anilist Tracker is a comprehensive, local-first anime tracking ecosystem designed to bridge the gap between your offline media library and your online AniList profile. 

Instead of manually updating your watch progress after finishing an episode, this agent seamlessly monitors your local video players (MPV, MPC-HC, VLC) or browser windows. When it detects an anime is playing, it automatically identifies the show and episode using advanced filename parsing, matches it against your AniList, and syncs your progress.

Beyond simple tracking, it features a **powerful Web UI** that serves as your personal anime dashboard:
- **Watch Dashboard:** View your in-progress, planned, and completed anime lists with rich metadata, seasonal info, and live airing countdowns.
- **Local Library Management:** Scan your local anime folders, view your files in a structured tree, and let the app automatically organize loose video files into cleanly named folders.
- **Smart Storage Cleanup:** Automatically identify and batch-delete video files for episodes you've already watched to free up disk space.
- **Nyaa.si Integration:** Built-in torrent search and auto-scanning. It checks your currently airing shows and helps you find missing episodes directly from the dashboard.
- **Advanced Statistics:** Visualize your watching habits with weekly activity heatmaps, genre distribution (Pareto charts), and watch-time statistics.
- **Pending Changes System:** Work offline or queue up progress/status changes, and bulk-sync them to AniList when you are ready.

---

## ✨ Features

- **Multi-Player Support**: Detects playback in MPV, MPC-HC, VLC, and browser window titles on Windows.
- **🚀 Manual Sync**: You have full control. Sync your progress to AniList manually with a single click when you're ready.
- **🧠 Smart Parsing**: Cleans up complicated filenames (e.g. `[SubsPlease] Sousou no Frieren - 01 (1080p).mkv`) accurately using `guessit`.
- **🌐 Web UI**: Modern beige/earth-toned browser interface to manage your watch list and track progress.
- **🔍 Nyaa Integration**: Search for missing episodes directly from the Web UI using Nyaa.si.
- **💾 Local Caching**: Works offline or with limited API calls by caching your AniList entries locally.
- **🗑️ Smart Cleanup**: Suggest completed or watched files for cleanup, automatically calculating disk savings and allowing bulk trashing.
- **📁 Library Manager**: Interactive explorer with multi-select checkboxes for bulk file management directly from the browser.
- **⚙️ Settings Management**: Configure folder paths, refresh intervals, and more via the UI.
- **🖥️ Cross-Platform**: Full support for both Windows and macOS with native UI elements.

---

## 🚀 Quickstart

If you just want the app running, use the platform section below. The fastest supported path right now is the Python source checkout, not a packaged `.exe` or `.dmg`.

### Before You Start

1. Install Python 3.11+.
2. Install Node.js 18+.
3. Configure MPV IPC if you want reliable MPV detection.

Add this to your `mpv.conf`:

```text
# Windows
input-ipc-server=\\.\pipe\mpvsocket

# macOS / Linux
input-ipc-server=/tmp/mpvsocket
```

### Windows Quickstart

```powershell
git clone <this-repo>
cd MPV
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements-dev.txt
cd frontend
npm install
cd ..
python dev.py
```

What this does:
- Starts the backend on `http://localhost:8080`
- Starts the frontend dev UI on `http://localhost:5173`
- Auto-reloads the backend when Python files change

If you do not want the dev server and only want the backend + built UI:

```powershell
.\venv\Scripts\activate
cd frontend
npm install
npm run build
cd ..
python src/main.py
```

### macOS Quickstart

```bash
git clone <this-repo>
cd MPV
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
cd frontend
npm install
cd ..
./run.sh
```

What this does:
- Starts the same dev environment as `python dev.py`
- Streams startup output to the terminal
- Saves the same output to `logs/run.log`

If you only want the backend + built UI:

```bash
source venv/bin/activate
cd frontend
npm install
npm run build
cd ..
python3 src/main.py
```

### What You Should See

- Backend API: `http://localhost:8080`
- Frontend UI while developing: usually `http://localhost:5173`
- If port `5173` is already in use, Vite will move to the next free port such as `5174`
- On first launch, AniList authentication may open in your browser

### If Nothing Shows Up

1. Check `logs/run.log` on macOS if you used `./run.sh`
2. Check whether `5173` or `8080` are already in use
3. If the frontend is blank, run `npm -C frontend run build` or restart `python dev.py`
4. If MPV is not detected, verify `/tmp/mpvsocket` on macOS or `\\.\pipe\mpvsocket` on Windows

### 4. Running via Docker (GitHub Packages)

You can also run the tracker as a headless background container using our pre-built Docker images, straight from GitHub Container Registry:

```bash
# Pull the latest version
docker pull ghcr.io/mbtiongson1/mpv-anilist-sync:latest

# Run the container (be sure to mount your media folders and config mappings)
docker run -d -p 8080:8080 \
  -v /path/to/your/anime:/app/anime \
  name mpv-anilist-sync \
  ghcr.io/mbtiongson1/mpv-anilist-sync:latest
```
*Note: The Docker container acts primarily as a headless library manager and Web UI; it may not automatically detect local host video players via IPC natively without additional network configuration.*

### Running Unit Tests

Run the backend unit tests from the project root using your virtualenv Python:

```bash
./venv/bin/python -m unittest discover -s tests -p "test_*.py" -v
```

---

## 📂 Project Structure

- `src/main.py`: The core background tracker and synchronization loop.
- `src/watchers/`: Contains specific playback watchers for different players.
- `src/parser.py`: Wraps file name parsing logic to identify Episode and Title.
- `src/anilist.py`: The GraphQL Client for AniList API interactions.
- `src/web_server.py`: The backend for the modern Web UI.
- `src/nyaa.py`: Integration with Nyaa.si for torrent searching.
- `src/settings.py`: Manages user configuration and folder mappings.
- `VERSION`: Single source of truth for the application version.

## 📦 Packaging & Versioning

### Versioning

The project uses a central `VERSION` file in the root directory. This version is automatically read by the build scripts and the main application.

To update the version:

1. Modify the string in `VERSION` (e.g., `4.0.1`).
2. Re-run the build process.

### Building the Frontend

If you make changes to the React UI in `frontend/src`, you must rebuild the static files so the Python backend can serve them from `frontend/dist`.

1. **Navigate to the frontend directory**: `cd frontend`
2. **Install dependencies**: `npm install`
3. **Build the app**: `npm run build`

Alternatively, you can just run `python dev.py` which will run Vite and the backend dynamically with hot-reloading. Build workflows such as `/build_frontend` are also available.

### Packaging Status

The packaging path is currently experimental.

- The repo contains `package.py` plus PyInstaller spec files for Windows and macOS
- The intended outputs are a Windows executable and a macOS `.app` / `.dmg`
- At the moment, this is not a reliable supported install path

Current reality:
- Source checkout + Python virtualenv is the recommended way to run the app
- `python package.py` may build partially, but you should expect breakage
- The generated `.exe` / `.dmg` should be treated as work-in-progress, not release artifacts

If you still want to try packaging:

```bash
pip install Pillow pyinstaller dmgbuild
python package.py
```

Packaged desktop builds now open the local web UI automatically and store runtime files under the platform user-data directory instead of inside the app bundle:

- macOS: `~/Library/Application Support/MPV Anilist Tracker`
- Windows: `%APPDATA%\MPV Anilist Tracker`

The release workflow also launches the freshly built app and verifies both `/` and `/api/status` before uploading the `.dmg` or `.exe`.

Alternatively, use the provided workflow: `/package`
