# MPV Anilist Tracker

A lightweight, background Python agent for macOS that detects when an anime video is being played in MKV, extracts the title and episode from the filename, and automatically syncs your watch progress to your **Anilist.co** account.

## Features
- **MPV IPC Connection**: Safely listens to MPV via a Unix socket (no root access required).
- **Auto-Sync**: Automatically updates your watch list when you close a playing file or stop playback.
- **Smart Parsing**: Cleans up complicated filenames (e.g. `[SubsPlease] Sousou no Frieren - 01 (1080p).mkv`) accurately using `guessit`.
- **System Tray Icon**: Resides quietly in your macOS menu bar with a minimalist graphical log.
- **Web Dashboard**: View "Now Playing" and your AniList list at `http://localhost:8080`.
- **Romaji & English Native**: Native support to successfully search and pair both naming conventions through Anilist GraphQL.

## Getting Started

### 1. Configure MPV
The agent relies on Inter-Process Communication (IPC) to know what video is playing safely. You must instruct MPV to open this socket.

Add the following inside your `~/.config/mpv/mpv.conf` file:
```text
input-ipc-server=/tmp/mpvsocket
```

### 2. Install Dependencies
Make sure you are running Python 3. Initialize a virtual environment and install the required modules:

```bash
cd ~/Documents/MPV
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

*(Note: `pystray` may require additional dependencies depending on your Python/macOS environment, but standard setups usually support it out of the box).*

### 3. Running the Tracker manually
Start the Python script from the terminal to set up your account on first launch:

```bash
source venv/bin/activate
python src/main.py
```

- Open the dashboard at `http://localhost:8080`.
- If you're not authenticated (or your token expired), click **Authenticate**. This opens AniList in your browser and stores a fresh token in `config.json`.
- Start watching an anime in MPV and sync will happen automatically when playback stops or the file changes.

If your list is empty but you have anime on AniList, your token is likely expired. Re-authenticate from the dashboard (or from the Tkinter UI's **Authenticate** button).


### 4. Running Automatically in the Background
To make the tracker run silently on startup without keeping a Terminal window open, an macOS Application wrapper `MPV Anilist Tracker.app` has been created for you in the `MPV` folder.

1. Open **System Settings** -> **General** -> **Login Items**.
2. Click the `+` button in the "Open at Login" list.
3. Browse to `Documents/MPV/` and select **`MPV Anilist Tracker.app`**.
*(Alternatively, you can just double-click the `.app` whenever you want to start the tracker without opening a terminal).*

## Project Structure
- `src/main.py`: The core background tracker and synchronization loop execution.
- `src/mpv_watcher.py`: Interfaces with the IPC Socket exposed by MPV.
- `src/parser.py`: Wraps file name parsing logic to identify the Episode and Title.
- `src/anilist.py`: The GraphQL Client that queries Anime IDs and executes watch mutations.
- `src/ui.py`: The lightweight tkinter application window for system status views.
