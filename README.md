# 🎬 MPV Anilist Tracker (v0.2.0)

A lightweight, background Python agent for Windows and macOS that detects when an anime video is being played, extracts the title and episode from the filename, and automatically syncs your watch progress to your **Anilist.co** account.

---

## ✨ Features

- **Multi-Player Support**: Detects playback in MPV, MPC-HC, VLC, and browser window titles on Windows.
- **🚀 Auto-Sync**: Automatically updates your watch list when you close a playing file or stop playback.
- **🧠 Smart Parsing**: Cleans up complicated filenames (e.g. `[SubsPlease] Sousou no Frieren - 01 (1080p).mkv`) accurately using `guessit`.
- **🌐 Web UI**: Modern beige/earth-toned browser interface to manage your watch list and track progress.
- **🔍 Nyaa Integration**: Search for missing episodes directly from the Web UI using Nyaa.si.
- **💾 Local Caching**: Works offline or with limited API calls by caching your AniList entries locally.
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

1. Modify the string in `VERSION` (e.g., `0.1.1`).
2. Re-run the build process.

### Building Standalone Apps

You can package the application into a standalone distribution (.exe or .app):

1. **Install Build Dependencies**: `pip install Pillow pyinstaller dmgbuild`
2. **Run Build**: `python package.py`

Alternatively, use the provided workflow: `/package`
