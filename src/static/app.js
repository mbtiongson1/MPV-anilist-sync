document.addEventListener('DOMContentLoaded', () => {
    const statusBubble = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const titleText = document.getElementById('anime-title');
    const suggestionText = document.getElementById('suggestion-text');
    
    // New elements
    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const btnSync = document.getElementById('btn-sync');

    async function checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();

            if (data.running && data.title) {
                // MPV is running and something is playing
                statusBubble.className = 'status-bubble online';
                statusText.textContent = 'Running';
                
                titleText.className = 'title-success';
                titleText.textContent = data.base_title || data.title;
                suggestionText.style.display = 'none';
                
                // Show and update progress UI
                progressContainer.style.display = 'flex';
                let totalStr = data.total_episodes > 0 ? data.total_episodes : '?';
                progressText.textContent = `E${data.watched_episodes} / ${totalStr}`;
                
            } else {
                // MPV is not running or nothing is playing
                statusBubble.className = 'status-bubble offline';
                statusText.textContent = 'Not Running';
                
                titleText.className = 'title-error';
                titleText.textContent = 'Waiting for video...';
                suggestionText.style.display = 'block';
                suggestionText.textContent = 'Open an .mkv or video file in MPV to get started tracking automatically.';
                
                progressContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching tracker status:', error);
            // Server might be down
            statusBubble.className = 'status-bubble offline';
            statusText.textContent = 'Disconnected';
            
            titleText.className = 'title-error';
            titleText.textContent = 'Agent Offline';
            suggestionText.style.display = 'block';
            suggestionText.textContent = 'The background tracking agent is not running. Please restart the launchctl service.';
            
            progressContainer.style.display = 'none';
        }
    }

    // Handlers for + and - buttons
    async function adjustEpisode(change) {
        try {
            const response = await fetch('/api/adjust_episode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ change })
            });
            if (response.ok) {
                // Instantly re-check status after adjusting
                checkStatus();
            }
        } catch (error) {
            console.error('Failed to adjust episode:', error);
        }
    }

    btnMinus.addEventListener('click', () => adjustEpisode(-1));
    btnPlus.addEventListener('click', () => adjustEpisode(1));

    // Handler for sync button
    btnSync.addEventListener('click', async () => {
        const confirmSync = confirm("Are you sure you want to sync this progress to AniList?");
        if (confirmSync) {
            btnSync.disabled = true;
            btnSync.innerHTML = "Syncing...";
            try {
                const response = await fetch('/api/sync', { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    btnSync.innerHTML = "Synced! ✓";
                    setTimeout(() => {
                        btnSync.disabled = false;
                        btnSync.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.83-2.06"/></svg> Sync Now`;
                    }, 3000);
                } else {
                    alert("Failed to sync to AniList. Check backend logs.");
                    btnSync.disabled = false;
                    btnSync.innerHTML = "Sync Failed ✗";
                }
            } catch (error) {
                console.error('Failed to sync:', error);
                alert("Network error: Failed to reach the tracker agent.");
                btnSync.disabled = false;
                btnSync.innerHTML = "Sync Error ✗";
            }
        }
    });

    // Check immediately, then poll every 2 seconds
    checkStatus();
    setInterval(checkStatus, 2000);
});
