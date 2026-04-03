import os
import sys
import re

def update_version(target):
    # Standardize the target (remove 'v' prefix if provided)
    if isinstance(target, str) and target.startswith('v'):
        target = target[1:]
    
    # Path to the VERSION file
    version_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../VERSION"))
    if not os.path.exists(version_file_path):
        version_file_path = "VERSION" # Fallback to relative path if absolute logic fails
        
    # Read the old version
    try:
        with open(version_file_path, "r") as f:
            old_version = f.read().strip()
    except FileNotFoundError:
        print(f"Error: {version_file_path} not found.")
        return False

    # Standardize current version (ensure 3 parts)
    parts = old_version.split('.')
    while len(parts) < 3:
        parts.append('0')
    
    major, minor, patch = map(int, parts[:3])
    
    # Determine the new version
    if target in ['major', 'minor', 'patch', None]:
        if target == 'major':
            major += 1
            minor = 0
            patch = 0
        elif target == 'patch':
            patch += 1
        else: # 'minor', 'bump' or None (default)
            minor += 1
            patch = 0
        new_version = f"{major}.{minor}.{patch}"
    else:
        # Use provided string as the new version
        new_version = target
        
    # Update VERSION file
    print(f"Updating VERSION: {old_version} -> {new_version}")
    with open(version_file_path, "w") as f:
        f.write(new_version + "\n")
        
    # Update README.md
    readme_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../README.md"))
    if not os.path.exists(readme_path):
        readme_path = "README.md"
        
    if os.path.exists(readme_path):
        print(f"Updating README.md: Searching for v{old_version} and {old_version}")
        with open(readme_path, "r") as f:
            readme_content = f.read()
            
        # Replace occurrences with 'v' prefix
        updated_readme = readme_content.replace(f"v{old_version}", f"v{new_version}")
        
        # Also replace standalone occurrences in the title if they don't have v
        # but let's be careful. The current title has (v0.1.0).
        
        if updated_readme == readme_content:
            print("Warning: No changes made to README.md. Old version not found with 'v' prefix.")
            
        with open(readme_path, "w") as f:
            f.write(updated_readme)
        print("Successfully updated README.md.")
    else:
        print("Error: README.md not found.")
        return False

    return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    if update_version(target):
        # Automatically trigger publish script if version bump is successful
        # Path logic:
        # __file__ is .agent/skills/version_update/scripts/update_version.py
        # root is 4 levels up
        publish_script = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../scripts/publish.py"))
        if os.path.exists(publish_script):
            print(f"🚀 Version updated. Automatically publishing changes using {publish_script}...")
            import subprocess
            subprocess.run([sys.executable, publish_script])
        else:
            print(f"⚠️ Warning: Could not find publish.py script at {publish_script}")
    else:
        sys.exit(1)
