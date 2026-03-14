document.addEventListener('DOMContentLoaded', () => {
    const statusBubble = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const titleText = document.getElementById('anime-title');
    const suggestionText = document.getElementById('suggestion-text');

    async function checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();

            if (data.running && data.title) {
                // MPV is running and something is playing
                statusBubble.className = 'status-bubble online';
                statusText.textContent = 'Running';
                
                titleText.className = 'title-success';
                titleText.textContent = data.title;
                suggestionText.style.display = 'none';
            } else {
                // MPV is not running or nothing is playing
                statusBubble.className = 'status-bubble offline';
                statusText.textContent = 'Not Running';
                
                titleText.className = 'title-error';
                titleText.textContent = 'Waiting for video...';
                suggestionText.style.display = 'block';
                suggestionText.textContent = 'Open an .mkv or video file in MPV to get started tracking automatically.';
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
        }
    }

    // Check immediately, then poll every 2 seconds
    checkStatus();
    setInterval(checkStatus, 2000);
});
