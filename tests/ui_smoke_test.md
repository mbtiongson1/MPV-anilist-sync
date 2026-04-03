# UI Smoke Test Guide

This test verifies the MPV Anilist Tracker's web interface is functional and accessible locally.

## Pre-requisites

- The backend must be running (e.g., via `python3 dev.py` or `python3 src/main.py`).
- The default port is **8080**.

## Browser Subagent Task

Navigate to `http://localhost:8080` and perform the following checks:

1. **Check Title**: Verify the page title contains "MPV AniList Tracker".
2. **Verify Idle State**: If no media is playing, the `#idle-state` element should be visible.
3. **Check Sidebar**: Ensure the navigation sidebar is present.
4. **Confirm Grid**: Verify that the anime grid (even if empty or loading) is initialized.
5. **Status Check**: Verify the `#status-text` contains "DISCONNECTED" or "IDLE" or active player info.

## Automated Execution (via browser_subagent)

```markdown
Navigate to http://localhost:8080 and verify the "MPV AniList Tracker" header exists. Confirm the presence of the now-playing banner (idle or active) and the sidebar navigation. Report any missing key UI elements.
```
