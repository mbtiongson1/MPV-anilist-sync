import sys
import time
import subprocess
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ReloadHandler(FileSystemEventHandler):
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
            print("\n" + "="*40)
            print("Changes detected, restarting application...")
            print("="*40 + "\n")
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        else:
            print("\n" + "="*40)
            print("Starting application in development mode...")
            print("="*40 + "\n")
        
        # Start the process. Using sys.executable ensures we use the same python interpreter.
        self.process = subprocess.Popen(self.command)

    def on_any_event(self, event):
        if event.is_directory:
            return
        
        # Extensions to monitor
        monitored_exts = {'.py', '.js', '.html', '.css'}
        if any(event.src_path.endswith(ext) for ext in monitored_exts):
            self.restart()

if __name__ == "__main__":
    # Ensure we're in the right directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run using the same interpreter and point to src/main.py
    command = [sys.executable, "src/main.py"]
    
    handler = ReloadHandler(command)
    observer = Observer()
    observer.schedule(handler, path="src", recursive=True)
    observer.start()
    
    print("Watching for changes in src/ directory...")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping development server...")
        observer.stop()
        if handler.process:
            handler.process.terminate()
    observer.join()
