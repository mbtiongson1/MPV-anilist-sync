---
name: sync
description: Synchronizes the current branch with the remote. Stashes local changes and pulls if on main; otherwise, displays a summary of remote changes and asks whether to merge or stash local changes before pulling.
---

# Sync Skill

This skill automates the process of pulling the latest changes from origin while handling local changes appropriately based on the current branch.

## Workflow

1.  **Run Sync Script**: Execute `scripts/sync.sh` to determine the current branch and its state relative to origin.
2.  **Handle Main Branch**:
    -   If the current branch is `main`, the script automatically stashes any dirty changes and performs a `git pull origin main`.
3.  **Handle Other Branches**:
    -   If the current branch is NOT `main`, the script fetches the latest from origin and checks for incoming changes.
    -   If there are incoming changes, it displays a summary (commits) and outputs `PROMPT_USER`.
    -   The agent must then ask the user: "I've fetched the latest changes for your current branch. Would you like to **merge** them into your local branch, or **stash** your current changes first then pull?"
4.  **Execute User Choice**:
    -   **Merge**: Run `git merge origin/<current_branch>` or `git pull`.
    -   **Stash**: Run `git stash push -m "Auto-stash before sync" && git pull origin <current_branch>`.

## Trigger Commands
- `/sync`
- "Sync the latest changes"
- "Update my current branch"
- "Pull latest and stash"
