---
description: Build and package the MPV Anilist Tracker for Windows (.exe) and macOS (.dmg)
---

This workflow automates the process of converting the application icon and packaging the Python source code into standalone distributions.

### Prerequisites

- **Windows**: Python 3.x installed.
- **macOS**: Python 3.x installed. For `.dmg` creation, `dmgbuild` is recommended (`pip install dmgbuild`).

### Steps

1. **Install Build Dependencies**
   // turbo
   ```bash
   pip install Pillow pyinstaller
   ```

2. **Prepare Application Icons**
   This step converts the `app_icon.png` in the root directory into `.ico` (Windows) and `.icns` (macOS) formats.
   // turbo
   ```bash
   python build/convert_icon.py
   ```

3. **Package the Application**
   Run the unified build script. It will automatically detect your OS and generate the appropriate distribution in the `dist/` folder.
   // turbo
   ```bash
   python package.py
   ```

### Output Locations

- **Windows**: `dist/MPV_Anilist_Tracker.exe`
- **macOS**: `dist/MPV Anilist Tracker.app` and (if `dmgbuild` is installed) `dist/MPV_Anilist_Tracker.dmg`
