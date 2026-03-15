import os
import platform
import subprocess
import shutil

def run_pyinstaller(spec_file):
    print(f"Running PyInstaller with {spec_file}...")
    subprocess.check_call(["python", "-m", "PyInstaller", spec_file, "--noconfirm", "--clean"])

def build_windows():
    print("Building for Windows...")
    run_pyinstaller("build/windows.spec")
    print("Windows build complete! Executable is in the 'dist' folder.")

def build_macos():
    print("Building for macOS...")
    run_pyinstaller("build/macos.spec")
    
    app_path = "dist/MPV Anilist Tracker.app"
    dmg_path = "dist/MPV_Anilist_Tracker.dmg"
    
    if os.path.exists(app_path):
        print("Creating DMG (Requires dmgbuild to be installed...)")
        try:
            import dmgbuild
            settings = {
                'format': 'UDBZ',
                'title': 'MPV Anilist Tracker',
                'icon': 'build/app_icon.icns',
                'background': 'builtin-arrow',
                'window_rect': ((100, 100), (600, 400)),
                'icon_size': 128,
                'contents': [
                    {'x': 140, 'y': 120, 'type': 'app', 'path': app_path},
                    {'x': 450, 'y': 120, 'type': 'link', 'path': '/Applications'}
                ]
            }
            dmgbuild.build_dmg('MPV_Anilist_Tracker.dmg', 'MPV Anilist Tracker', 'settings.py', settings_dict=settings)
            
            # move to dist 
            if os.path.exists('MPV_Anilist_Tracker.dmg'):
                os.rename('MPV_Anilist_Tracker.dmg', dmg_path)
            
            print(f"macOS build complete! DMG is in {dmg_path}")
        except ImportError:
            print("dmgbuild is not installed. Skipping `.dmg` creation. The `.app` bundle is available in `dist/`.")
            print("To build the DMG on macOS, run: pip install dmgbuild")

if __name__ == "__main__":
    current_os = platform.system()
    if current_os == "Windows":
        build_windows()
    elif current_os == "Darwin":
        build_macos()
    else:
        print(f"Unsupported OS for this automated build script: {current_os}")
