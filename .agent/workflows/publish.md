---
description: Publish and sync the local repository to the remote origin with an automated commit message.
---

# 🛫 Publish

This workflow automates the common git sync process: pulling latest changes (rebase), staging all local changes, generating an automated commit message based on the recent version and changes, and pushing to the remote origin.

## Prerequisites

- Git initialized in the repository.
- A configured remote origin.

## Steps

1. **Verify Git Status**
   Check if there are any uncommitted changes and ensure the local repository is clean enough for a pull.
   // turbo

   ```bash
   git status
   ```

2. **Run the Publish Automation**
   This script handles the pull, staging, commit, and push steps in sequence.
   // turbo

   ```bash
   python3 .agent/scripts/publish.py
   ```

3. **Verify Git History**
   Check the latest commit to ensure everything was pushed correctly.
   // turbo

   ```bash
   git log -n 1
   ```

## Command Example

You can also run it with a custom message if needed:

```bash
python3 .agent/scripts/publish.py "Initial commit for v1.0.0"
```
