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
