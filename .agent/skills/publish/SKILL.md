---
name: Publish
description: Automatically publish to git with automated commit message and push/pull sync the remote and local.
---

# 🛫 Publish Skill

This skill allows the agent to handle the entire git lifecycle for a change: checking status, pulling remote changes (rebase), staging local changes, and pushing with an automated commit message.

## 🛠️ When to Use

- When the user asks to "publish changes", "push to git", or "sync with remote".
- When finishing a task and the changes need to be shared.
- Automatically invoked after a version update.

## 📋 Required Files

- `.agent/scripts/publish.py`: The single source of truth for the publish logic and commit message generation.
- `.agent/workflows/publish.md`: The workflow that enables the `/publish` slash command.

## ⚙️ How to Use

1. **Perform a default sync and publish:**
   This will automatically generate a message based on the current branch state and version.

   ```bash
   python3 .agent/scripts/publish.py
   ```

2. **Publish with a custom message:**

   ```bash
   python3 .agent/scripts/publish.py "Update: feature implementation"
   ```

## 📝 Features

- **Automated Message Generation**: Dynamically constructs messages like `release: version bump to vX.Y.Z` or `chore: updates and sync (vX.Y.Z)`.
- **Safe Syncing**: Uses `git pull --rebase` to avoid messy merge commits.
- **Staging**: Automatically stages all changes before committing.
- **Pushing**: Ensures local changes reach the remote repository.
