#!/usr/bin/env python3
import subprocess
import os
import sys

def run(cmd):
    try:
        if isinstance(cmd, str):
            res = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        else:
            res = subprocess.run(cmd, check=True, capture_output=True, text=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e.cmd}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def main():
    # 1. Add all changes
    print("Stage changes...")
    subprocess.run(["git", "add", "."], check=True)
    
    # 2. Check for changes
    status = run("git status --porcelain")
    if not status:
        print("No changes to commit. Repository is clean.")
        return

    # 3. Generate a reasonably descriptive commit message
    lines = status.splitlines()
    files = []
    for line in lines:
        # line is like " M src/main.py"
        path = line[3:]
        fname = os.path.basename(path)
        files.append(fname)
    
    # De-duplicate
    unique_files = []
    [unique_files.append(x) for x in files if x not in unique_files]
    
    if len(unique_files) == 1:
        msg = f"Update: {unique_files[0]}"
    elif len(unique_files) <= 3:
        msg = f"Update: {', '.join(unique_files)}"
    else:
        msg = f"Update: {', '.join(unique_files[:3])} and {len(unique_files)-3} others"
    
    print(f"Generated commit message: {msg}")

    # 4. Commit locally first
    print("Committing changes...")
    subprocess.run(["git", "commit", "-m", msg], check=True)
    
    # 5. Pull any remote changes and rebase our own commit on top
    print("Syncing with remote (Pulling)...")
    try:
        subprocess.run(["git", "pull", "--rebase"], check=True)
    except subprocess.CalledProcessError:
        print("Conflict during sync. Please resolve manually.")
        sys.exit(1)
        
    # 6. Push local commits to remote
    print("Pushing changes...")
    subprocess.run(["git", "push"], check=True)
    
    print("\nSuccessfully published changes!")

if __name__ == "__main__":
    main()
