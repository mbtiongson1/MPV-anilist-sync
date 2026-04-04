import subprocess
import os
import sys

def run_command(command):
    try:
        # Use shell=True for simple command invocation but beware of security later.
        # Here it's mainly for git commands in a script.
        # Path for git on macOS might need explicit pointing if /usr/bin/git fails normally,
        # but since we're in a script, it should follow the user's path.
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e.cmd}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return None

def get_current_version():
    version_file = os.path.join(os.path.dirname(__file__), "../../VERSION")
    if os.path.exists(version_file):
        with open(version_file, "r") as f:
            return f.read().strip()
    return "0.0.0"

def get_automated_commit_message(custom_msg=None):
    if custom_msg:
        return custom_msg
    
    # Get short status summary
    status = run_command("git status --short")
    if not status:
        return "chore: general updates"
    
    version = get_current_version()
    
    # Try to derive some simple context
    msg = f"chore: updates and sync (v{version})"
    
    # Check if a version update happened specifically
    if "VERSION" in status:
        msg = f"release: version bump to v{version}"
        
    return msg

def publish(custom_msg=None):
    print("🚀 Starting sync and publish...")
    
    # 1. Pull changes
    print("🔄 Pulling latest changes (rebase)...")
    # Stash local changes to allow rebase if dirty
    is_dirty = run_command("git status --porcelain") != ""
    if is_dirty:
        print("📥 Stashing local changes...")
        run_command("git stash")
        
    if run_command("git pull --rebase") is None:
        print("❌ Git pull failed. Please resolve conflicts manually.")
        if is_dirty:
            run_command("git stash pop")
        return False
        
    if is_dirty:
        print("📤 Popping stashed changes...")
        run_command("git stash pop")
        
    # 2. Add changes
    print("➕ Staging all changes...")
    run_command("git add .")
    
    # Check if there are things to commit
    diff = run_command("git diff --staged --name-only")
    if not diff:
        print("⚠️ No changes to commit.")
    else:
        # 3. Commit
        msg = get_automated_commit_message(custom_msg)
        print(f"📝 Committing: {msg}")
        run_command(f'git commit -m "{msg}"')
        
    # 4. Tagging and Push
    version_changed = "VERSION" in (run_command("git diff HEAD~1 --name-only") or "")
    version = get_current_version()
    
    if version_changed:
        print(f"🏷️ Version change detected. Creating tag v{version}...")
        run_command(f'git tag -a v{version} -m "Release v{version}"')
        
    print("⬆️ Pushing to remote (including tags)...")
    if run_command("git push --follow-tags") is None:
        print("❌ Git push failed. Ensure origin is set up correctly.")
        return False
        
    print("✅ Successfully published!")
    if version_changed:
        print(f"🚀 Release v{version} triggered on GitHub Actions!")
    return True

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else None
    if publish(msg):
        sys.exit(0)
    else:
        sys.exit(1)
