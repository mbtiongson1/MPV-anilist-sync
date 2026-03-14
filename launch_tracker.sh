#!/bin/bash
# Wrapper script to start the MPV Anilist Tracker in the background
cd /Users/marcotiongson/Documents/MPV
source venv/bin/activate
# Run the python script directly. (It drops into the background GUI thread automatically)
exec python src/main.py
