# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Ensure build directory is correct for resolving relative paths
spec_dir = os.path.dirname(os.path.abspath(SPEC))
project_root = os.path.dirname(spec_dir)
third_party_datas = collect_data_files('babelfish')
third_party_hiddenimports = collect_submodules('babelfish.converters')

with open(os.path.join(project_root, 'VERSION'), 'r', encoding='utf-8') as version_file:
    version = version_file.read().strip()

block_cipher = None

a = Analysis(
    [os.path.join(project_root, 'src', 'desktop_launcher.py')],
    pathex=[project_root],
    binaries=[],
    datas=[
        (os.path.join(project_root, 'VERSION'), '.'),
        (os.path.join(project_root, 'frontend', 'dist'), 'frontend/dist'),
    ] + third_party_datas,
    hiddenimports=['PIL._imagingtk', 'PIL._tkinter_finder'] + third_party_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='MPV_Anilist_Tracker',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(project_root, 'build', 'app_icon.icns')
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='MPV_Anilist_Tracker'
)

app = BUNDLE(
    coll,
    name='MPV Anilist Tracker.app',
    icon=os.path.join(project_root, 'build', 'app_icon.icns'),
    bundle_identifier='com.mbtiongson.mpv-anilist-sync',
    info_plist={
        'CFBundleShortVersionString': version,
        'NSHighResolutionCapable': True,
    },
)
