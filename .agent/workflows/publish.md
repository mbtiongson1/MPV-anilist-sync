# Git Publish Workflow

Automatically adds all changes, commits with a generated message, and syncs (pull/push) with git.

This workflow automates the process of committing and syncing changes to the repository.

## Steps

1. **Add and Commit with Generated Message**

   The following command adds all changes, generating a commit message based on the changed files, and performs a rebase pull before committing.

   // turbo

   ```bash
   python3 publish.py
   ```
