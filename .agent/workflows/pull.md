---
description: Merge the current branch into the main branch and push to origin.
---

# 📥 Pull to Main

This workflow automates the process of merging your active development branch into the `main` branch. It ensures your local `main` is synchronized with the remote before merging and pushing back to GitHub.

## ⚠️ Important

Ensure your current branch is clean (no uncommitted changes) before running this.

## 📋 Steps

1. **Get Current Branch Name**
   Identify the branch you're currently working on.
   // turbo
   ```bash
   git branch --show-current
   ```

2. **Run the Merge Automation**
   This script handles the checkout, pulling `main`, merging your branch, and pushing back to origin.
   // turbo
   ```bash
   python3 .agent/scripts/pull_to_main.py
   ```

3. **Return to Dev Branch**
   Switch back to your development branch to continue working.
   // turbo
   ```bash
   git checkout -
   ```

---
### 🛠️ Manual Alternative
If you prefer doing it manually:
```bash
git checkout main
git pull origin main
git merge <your-branch-name> --no-edit
git push origin main
git checkout -
```
