from __future__ import annotations

import os
import sys
from pathlib import Path

APP_NAME = "MPV Anilist Tracker"
APP_SLUG = "mpv-anilist-tracker"


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def resource_root() -> Path:
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        return Path(meipass)
    return Path(__file__).resolve().parent.parent


def resolve_resource_path(*parts: str) -> Path:
    return resource_root().joinpath(*parts)


def user_data_dir() -> Path:
    home = Path.home()

    if sys.platform == "darwin":
        return home / "Library" / "Application Support" / APP_NAME

    if sys.platform == "win32":
        base = os.environ.get("APPDATA") or os.environ.get("LOCALAPPDATA")
        if base:
            return Path(base) / APP_NAME
        return home / "AppData" / "Roaming" / APP_NAME

    xdg_data_home = os.environ.get("XDG_DATA_HOME")
    if xdg_data_home:
        return Path(xdg_data_home) / APP_SLUG
    return home / ".local" / "share" / APP_SLUG


def prepare_runtime_environment() -> Path:
    if not is_frozen() and os.environ.get("MPV_TRACKER_FORCE_USER_DATA_DIR") != "1":
        return Path.cwd()

    data_dir = user_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    os.chdir(data_dir)
    return data_dir


def port_from_env(default: int = 8080) -> int:
    raw = os.environ.get("MPV_TRACKER_PORT")
    if not raw:
        return default

    try:
        return int(raw)
    except ValueError:
        return default


def app_url(port: int) -> str:
    return f"http://127.0.0.1:{port}"
