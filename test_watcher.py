import sys
import os
sys.path.append("/Users/marcotiongson/Documents/MPV")

from src.mpv_watcher import MPVWatcher

watcher = MPVWatcher()
success = watcher.connect()
print(f"Connected: {success}")
if success:
    print(f"Filename: {watcher.get_current_filename()}")
