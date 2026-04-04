# -*- mode: python ; coding: utf-8 -*-

import os
import sys

# Ensure build directory is correct for resolving relative paths
spec_dir = os.path.dirname(os.path.abspath(SPEC))
project_root = os.path.dirname(spec_dir)

block_cipher = None

a = Analysis(
    [os.path.join(project_root, 'src', 'main.py')],
    pathex=[project_root],
    binaries=[],
    datas=[
        (os.path.join(project_root, 'VERSION'), '.'),
        (os.path.join(project_root, 'frontend', 'dist'), 'frontend/dist'),
        # Add any other static assets if needed
    ],
    hiddenimports=['PIL._imagingtk', 'PIL._tkinter_finder'],
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
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='MPV_Anilist_Tracker_raw',
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

app = BUNDLE(
    exe,
    name='MPV Anilist Tracker.app',
    icon=os.path.join(project_root, 'build', 'app_icon.icns'),
    bundle_identifier='com.mbtiongson.mpv-anilist-sync',
    info_plist={
        'CFBundleShortVersionString': '4.2.0', # In production, sync this with VERSION
        'NSHighResolutionCapable': True,
    },
)
