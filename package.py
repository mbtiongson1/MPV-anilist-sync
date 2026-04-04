import os
import platform
import subprocess
import shutil

def get_version():
    try:
        with open("VERSION", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "unknown"

VERSION = get_version()

def build_frontend():
    """Build the Preact frontend before packaging."""
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if not os.path.exists(os.path.join(frontend_dir, 'package.json')):
        print("Warning: frontend/package.json not found, skipping frontend build.")
        return
    print("Building frontend...")
    subprocess.check_call(['npm', 'install'], cwd=frontend_dir)
    subprocess.check_call(['npm', 'run', 'build'], cwd=frontend_dir)
    print("Frontend build complete.")

def run_pyinstaller(spec_file):
    print(f"Running PyInstaller with {spec_file}...")
    subprocess.check_call(["python", "-m", "PyInstaller", spec_file, "--noconfirm", "--clean"])

def build_windows():
    print(f"Building for Windows (v{VERSION})...")
    build_frontend()
    # Ensure icons are converted
    subprocess.check_call(["python", "build/convert_icon.py"])
    run_pyinstaller("build/windows.spec")
    
    # Rename output for versioning if it's a single file or directory
    # For now, we'll just print that it's complete. 
    # Usually, we'd want to move/rename the final executable.
    print(f"Windows build complete! Executable is in the 'dist' folder.")

def build_macos():
    print(f"Building for macOS (v{VERSION})...")
    build_frontend()
    # Ensure icons are converted
    subprocess.check_call(["python", "build/convert_icon.py"])
    run_pyinstaller("build/macos.spec")
    
    app_path = "dist/MPV Anilist Tracker.app"
    dmg_path = f"dist/MPV_Anilist_Tracker_v{VERSION}.dmg"
    
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
            dmg_file = 'MPV_Anilist_Tracker.dmg'
            dmgbuild.build_dmg(dmg_file, 'MPV Anilist Tracker', settings_dict=settings)
            
            # move to dist 
            if os.path.exists(dmg_file):
                if not os.path.exists('dist'):
                    os.makedirs('dist')
                shutil.move(dmg_file, dmg_path)
            
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
