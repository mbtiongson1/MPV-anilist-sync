import subprocess
import sys
import os

def run_command(command):
    try:
        # Simple execution
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e.cmd}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return None

def pull_to_main():
    # 1. Store the name of the current branch
    current_branch = run_command("git branch --show-current")
    if not current_branch:
        print("❌ Could not determine current branch.")
        return False
        
    print(f"🔄 Merging '{current_branch}' into 'main'...")
    
    # 2. Add changes in case the user missed something
    # (Safe but optional, usually best to let the user decide)
    
    # 3. Checkout main
    print("🧹 Switching to 'main'...")
    if run_command("git checkout main") is None:
        print("❌ Git checkout main failed. Is there a 'main' branch?")
        return False
        
    # 4. Pull origin main (sync)
    print("🔄 Syncing 'main' from origin...")
    # Use rebase = false for pull on main usually if it's the golden branch
    if run_command("git pull origin main") is None:
        print("❌ Git pull origin main failed. Check for network or conflicts.")
        # Rollback
        run_command(f"git checkout {current_branch}")
        return False
        
    # 5. Merge current_branch into main
    print(f"📥 Merging {current_branch} into main...")
    if run_command(f"git merge {current_branch} --no-edit") is None:
        print(f"❌ Git merge failed. Resolve conflicts on 'main' manually or restore with 'git merge --abort'.")
        # Rollback to the previous branch
        run_command(f"git checkout {current_branch}")
        return False
        
    # 6. Push to origin main
    print("⬆️ Pushing merged main to origin...")
    if run_command("git push origin main") is None:
        print("❌ Git push origin main failed.")
        return False
        
    # 7. Switch back to current_branch
    print(f"🔙 Returning to '{current_branch}' branch...")
    run_command(f"git checkout {current_branch}")
    
    print(f"✅ Successfully merged {current_branch} into main and pushed!")
    return True

if __name__ == "__main__":
    if pull_to_main():
        sys.exit(0)
    else:
        sys.exit(1)
