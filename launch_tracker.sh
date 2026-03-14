#!/bin/bash
# Wrapper script to start the MPV Anilist Tracker in the background
cd /Users/marcotiongson/Documents/MPV
source venv/bin/activate

# Loop to ensure the app stays running
while true; do
    echo "Starting MPV Anilist Tracker..."
    python src/main.py
    echo "MPV Anilist Tracker exited or crashed. Restarting in 5 seconds..."
    sleep 5
done
