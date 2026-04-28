#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/run.log"

mkdir -p "$LOG_DIR"
: > "$LOG_FILE"

cd "$ROOT_DIR"

if [ -x "$ROOT_DIR/venv/bin/python" ]; then
  PYTHON="$ROOT_DIR/venv/bin/python"
else
  PYTHON="${PYTHON:-python3}"
fi

echo "Starting MPV Anilist Tracker" | tee -a "$LOG_FILE"
echo "Python: $PYTHON" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"

"$PYTHON" "$ROOT_DIR/dev.py" 2>&1 | tee -a "$LOG_FILE"
