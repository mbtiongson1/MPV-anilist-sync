#!/bin/bash

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ -z "$current_branch" ]; then
    echo "Error: Not a git repository."
    exit 1
fi

# Get status
status=$(git status --porcelain)

if [ "$current_branch" = "main" ]; then
    # If main: stash (if changes) and pull
    if [ -n "$status" ]; then
        echo "Stashing current changes on main..."
        git stash push -m "Auto-stash before sync on main"
    fi
    echo "Pulling latest changes for main..."
    git pull origin main
else
    # If not main: fetch and show summary
    echo "Current branch is '$current_branch'."
    echo "Fetching origin/$current_branch..."
    git fetch origin "$current_branch" 2>/dev/null
    
    # Check for incoming changes
    log_summary=$(git log "HEAD..origin/$current_branch" --oneline)
    
    if [ -z "$log_summary" ]; then
        echo "Your branch is already up to date with origin/$current_branch."
    else
        echo "Summary of changes in origin/$current_branch:"
        echo "$log_summary"
        echo ""
        echo "PROMPT_USER: Branch is not main. Should I merge the changes or just stash your current work?"
    fi
fi
