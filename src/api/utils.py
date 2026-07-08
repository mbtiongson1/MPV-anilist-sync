import os
import sys

def is_safe_path(target_path: str, agent) -> bool:
    """
    Validates if a target path is safely contained within allowed directories.
    Handles symlinks and case-manipulation bypasses on Windows.
    """
    allowed_dirs = []
    if agent and hasattr(agent, 'settings'):
        if agent.settings.base_anime_folder:
            allowed_dirs.append(os.path.realpath(agent.settings.base_anime_folder))
        if agent.settings.default_download_dir:
            allowed_dirs.append(os.path.realpath(agent.settings.default_download_dir))

    if not allowed_dirs:
        return False

    real_target_path = os.path.realpath(target_path)

    for allowed_dir in allowed_dirs:
        try:
            # Check if target is inside the allowed directory
            common = os.path.commonpath([allowed_dir, real_target_path])
            if os.path.normcase(common) == os.path.normcase(allowed_dir):
                return True
        except ValueError:
            # commonpath can raise ValueError on Windows if drives are different
            pass

    return False
