#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import platform
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def artifact_executable() -> Path:
    if platform.system() == "Darwin":
        return ROOT / "dist" / "MPV Anilist Tracker.app" / "Contents" / "MacOS" / "MPV_Anilist_Tracker"
    if platform.system() == "Windows":
        return ROOT / "dist" / "MPV_Anilist_Tracker.exe"
    raise RuntimeError(f"Unsupported platform for smoke test: {platform.system()}")


def wait_for_http(url: str, timeout: float = 45.0) -> bytes:
    deadline = time.time() + timeout
    last_error: Exception | None = None

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                return response.read()
        except Exception as exc:
            last_error = exc
            time.sleep(0.5)

    raise RuntimeError(f"Timed out waiting for {url}: {last_error}")


def terminate_process(proc: subprocess.Popen):
    if proc.poll() is not None:
        return

    if platform.system() == "Windows":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], check=False)
        return

    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


def main():
    executable = artifact_executable()
    if not executable.exists():
        raise FileNotFoundError(f"Packaged executable not found: {executable}")

    port = os.environ.get("MPV_TRACKER_SMOKE_PORT", "18080")
    env = os.environ.copy()
    env["MPV_TRACKER_PORT"] = port
    env["MPV_TRACKER_NO_BROWSER"] = "1"

    proc = subprocess.Popen(
        [str(executable)],
        cwd=str(ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    try:
        index_html = wait_for_http(f"http://127.0.0.1:{port}/").decode("utf-8", errors="replace")
        status_json = wait_for_http(f"http://127.0.0.1:{port}/api/status").decode("utf-8", errors="replace")

        if '<div id="app"></div>' not in index_html:
            raise RuntimeError("Packaged UI did not serve the frontend shell.")

        payload = json.loads(status_json)
        if "watcher_name" not in payload:
            raise RuntimeError("Packaged API returned unexpected status payload.")

        print(f"Smoke test passed for {executable.name} on port {port}")
    finally:
        terminate_process(proc)
        output = ""
        if proc.stdout is not None:
            try:
                output = proc.stdout.read()
            except Exception:
                output = ""
        if output.strip():
            print(output)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Smoke test failed: {exc}", file=sys.stderr)
        raise
