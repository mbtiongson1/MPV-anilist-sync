import sys
import time
import subprocess
import os
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class BackendReloadHandler(FileSystemEventHandler):
    def __init__(self, command):
        self.command = command
        self.process = None
        self.last_restart = 0
        self.restart()

    def restart(self):
        # Debounce: prevent multiple restarts for the same change event
        now = time.time()
        if now - self.last_restart < 1.0:
            return
        self.last_restart = now

        if self.process:
            print("\n[Backend] Changes detected, restarting API server...")
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            time.sleep(1) # Give OS time to release resources
        else:
            print("\n[Backend] Starting API server...")
        
        self.process = subprocess.Popen(self.command)

    def on_any_event(self, event):
        if event.is_directory:
            return
        
        monitored_exts = {'.py', '.json'}
        if any(event.src_path.endswith(ext) for ext in monitored_exts):
            self.restart()

def run_vite(frontend_dir):
    is_windows = sys.platform == "win32"
    
    # Check if npm install is needed
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("\n[Frontend] node_modules not found. Running npm install...")
        subprocess.check_call(["npm", "install"], cwd=frontend_dir, shell=is_windows)
        
    print("\n[Frontend] Starting Vite Dev Server...")
    return subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir, shell=is_windows)

if __name__ == "__main__":
    # Ensure we're in the right directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    
    frontend_dir = os.path.join(base_dir, "frontend")
    
    print("="*60)
    print("Starting Development Environment...")
    print(" Backend API: http://localhost:8080")
    print(" Frontend UI (Vite with HMR): http://localhost:5173")
    print("="*60 + "\n")
    
    # 1. Start Frontend (Vite)
    vite_process = run_vite(frontend_dir)
    
    # 2. Start Backend (Python)
    # Ensure venv is used if active, else fallback to sys.executable
    command = [sys.executable, "src/main.py"]
    
    backend_handler = BackendReloadHandler(command)
    observer = Observer()
    observer.schedule(backend_handler, path="src", recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Shutting Down] Development servers stopping...")
        observer.stop()
        if backend_handler.process:
            backend_handler.process.terminate()
        if vite_process:
            vite_process.terminate()
    observer.join()
