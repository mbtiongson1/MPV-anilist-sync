from __future__ import annotations

import os
import threading
import time
import urllib.request
import webbrowser

from src.main import TrackerAgent
from src.runtime_env import app_url, port_from_env, prepare_runtime_environment
from src.web_server import start_web_server


def _open_browser_when_ready(port: int):
    if os.environ.get("MPV_TRACKER_NO_BROWSER") == "1":
        return

    url = app_url(port)
    deadline = time.time() + 30

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1):
                webbrowser.open(url)
                return
        except Exception:
            time.sleep(0.5)

    print(f"Web UI did not become ready at {url}")


def main():
    data_dir = prepare_runtime_environment()
    port = port_from_env(8080)

    print(f"Using runtime data directory: {data_dir}")
    print(f"Starting packaged web UI on {app_url(port)}")

    agent = TrackerAgent()
    if not agent.anilist.is_authenticated():
        print("Warning: No valid AniList token found. Running in local cache mode.")

    threading.Thread(target=_open_browser_when_ready, args=(port,), daemon=True).start()

    agent_thread = threading.Thread(target=agent.start, daemon=True)
    agent_thread.start()

    try:
        start_web_server(agent, port)
    except KeyboardInterrupt:
        print("\nStopping Tracker Agent...")
    finally:
        agent.stop()


if __name__ == "__main__":
    main()
