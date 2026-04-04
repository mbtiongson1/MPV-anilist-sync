# 🎬 MPV Anilist Tracker (v4.2.8)

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

## 🚀 Getting Started

### 1. Configure MPV (Optional)

The agent relies on Inter-Process Communication (IPC) for MPV. You must instruct MPV to open this socket.

Add the following inside your `mpv.conf` file:

```text
# On Windows:
input-ipc-server=\\.\pipe\mpvsocket

# On macOS/Linux:
input-ipc-server=/tmp/mpvsocket
```

### 2. Install Dependencies

Make sure you are running Python 3. Initialize a virtual environment and install the required modules:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# macOS
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Running the Tracker

Start the Python script from the terminal:

```bash
python src/main.py
```

- **First Launch**: A browser window will open for you to authenticate with AniList.
- **Web UI**: Access the control panel at `http://localhost:8080`.

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

Alternatively, use the provided workflow: `/build_frontend`

### Building Standalone Apps

You can package the application into a standalone distribution (.exe or .app):

1. **Install Build Dependencies**: `pip install Pillow pyinstaller dmgbuild`
2. **Run Build**: `python package.py`

Alternatively, use the provided workflow: `/package`
