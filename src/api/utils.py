import os
import sys

def is_safe_path(target_path: str, agent) -> bool:
    """
    Validates if a target path is safely contained within allowed directories.
    Handles symlinks and case-manipulation bypasses on Windows.
    """
    if not target_path or not isinstance(target_path, str):
        return False

    path = target_path.lstrip()
    if path.startswith('\\\\') or path.startswith('//'):
        return False

    allowed_dirs = []
    if agent and hasattr(agent, 'settings'):
        if getattr(agent.settings, 'base_anime_folder', None):
            allowed_dirs.append(os.path.realpath(agent.settings.base_anime_folder))
        if getattr(agent.settings, 'default_download_dir', None):
            allowed_dirs.append(os.path.realpath(agent.settings.default_download_dir))
        if getattr(agent.settings, 'media_folders_map', None):
            mf_map = agent.settings.media_folders_map
            if isinstance(mf_map, dict):
                for folder in mf_map.values():
                    if folder and isinstance(folder, str):
                        allowed_dirs.append(os.path.realpath(folder))

    if not allowed_dirs:
        return False

    real_target_path = os.path.realpath(path)
    norm_target = os.path.normcase(real_target_path)

    for allowed_dir in allowed_dirs:
        try:
            norm_allowed = os.path.normcase(allowed_dir)
            common = os.path.normcase(os.path.commonpath([norm_allowed, norm_target]))
            if common == norm_allowed:
                return True
        except ValueError:
            # commonpath can raise ValueError on Windows if drives are different
            pass

    return False


def validate_configured_dir(path) -> str:
    """
    Validates a user-supplied root directory (base_anime_folder, default_download_dir)
    before it is stored, since is_safe_path trusts these values as its sandbox.
    Fails closed: raises ValueError for anything not clearly a specific absolute
    directory. Does not require the directory to exist yet.
    """
    if not isinstance(path, str):
        raise ValueError("Path must be a string")
    cleaned = path.strip()
    if not cleaned:
        raise ValueError("Path is empty")
    if '\x00' in cleaned:
        raise ValueError("Path contains a null byte")
    if cleaned.startswith('\\\\') or cleaned.startswith('//'):
        raise ValueError("Network/UNC paths are not allowed")
    # Reject '..' as a path component (but allow names like 'Season..2')
    if '..' in cleaned.replace('\\', '/').split('/'):
        raise ValueError("Path traversal is not allowed")
    if not os.path.isabs(cleaned):
        raise ValueError("Path must be absolute")

    try:
        real = os.path.realpath(cleaned)
    except (OSError, ValueError) as e:
        raise ValueError(f"Invalid path: {e}")

    # A filesystem root (/, C:\, or a symlink resolving to one) would make
    # every file on the machine "safe".
    if os.path.dirname(real) == real or os.path.splitdrive(real)[1] in ('', '\\', '/'):
        raise ValueError("Filesystem root directories are not allowed")
    return cleaned
