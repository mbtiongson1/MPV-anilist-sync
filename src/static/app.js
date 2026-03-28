document.addEventListener('DOMContentLoaded', () => {
    // ===== Element References =====
    const statusBubble = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const nowPlaying = document.getElementById('now-playing');
    const idleState = document.getElementById('idle-state');
    const npBanner = document.getElementById('np-banner');
    const npCover = document.getElementById('np-cover');
    const npTitle = document.getElementById('np-title');
    const npStudio = document.getElementById('np-studio');
    const npSeason = document.getElementById('np-season');
    const npStats = document.getElementById('np-stats');
    const npSummary = document.getElementById('np-summary');
    const npSummaryToggle = document.getElementById('np-summary-toggle');
    const btnEditNowPlaying = document.getElementById('btn-edit-nowplaying');
    const npProgressLabel = document.getElementById('np-progress-label');
    const npProgressSegments = document.getElementById('np-progress-segments');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const btnSync = document.getElementById('btn-sync');
    const animeGrid = document.getElementById('anime-grid');
    const filterName = document.getElementById('filter-name');
    const filterSeason = document.getElementById('filter-season');
    const filterYear = document.getElementById('filter-year');
    const filterSort = document.getElementById('filter-sort');
    const tabCurrent = document.getElementById('tab-current');
    const tabPlanning = document.getElementById('tab-planning');
    const tabCompleted = document.getElementById('tab-completed');
    const countCurrent = document.getElementById('count-current');
    const countPlanning = document.getElementById('count-planning');
    const countCompleted = document.getElementById('count-completed');
    const btnRefreshList = document.getElementById('btn-refresh-list');
    const btnToggleView = document.getElementById('btn-toggle-view');
    const btnReauthorize = document.getElementById('btn-reauthorize');
    const btnFullRefresh = document.getElementById('btn-full-refresh');
    const detailsModal = document.getElementById('details-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBody = document.getElementById('modal-body');

    // Settings Modal
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const settingsModalOverlay = document.getElementById('settings-modal-overlay');
    const settingsModalClose = document.getElementById('settings-modal-close');
    const settingsSaveBtn = document.getElementById('settings-save-btn');
    const inputSettingGroups = document.getElementById('setting-groups');
    const inputSettingResolution = document.getElementById('setting-resolution');
    const inputSettingDownloadDir = document.getElementById('setting-download-dir');
    const npPlayerBadge = document.getElementById('np-player-badge');
    const tabTorrents = document.getElementById('tab-torrents');
    const tabLibrary = document.getElementById('tab-library');
    const libraryContent = document.getElementById('library-content');
    const inputSettingBaseAnimeFolder = document.getElementById('setting-base-anime-folder');
    
    // View Buttons
    const btnViewGrid = document.getElementById('btn-view-grid');
    const btnViewList = document.getElementById('btn-view-list');
    const btnViewTree = document.getElementById('btn-view-tree');
    
    let userSettings = null;
    let libraryData = []; // Cached library scanner results

    // ===== State =====
    let animeList = [];
    let activeTab = 'CURRENT';
    let lastNowPlayingTitle = null;
    let viewMode = 'details';
    // persist view mode across reloads
    const savedViewMode = localStorage.getItem('mpvViewMode');
    if (savedViewMode && ['grid', 'list', 'details'].includes(savedViewMode)) {
        viewMode = savedViewMode;
    }
    let expandedCard = null; // mediaId of expanded card
    let sortBy = 'progress'; // 'popularity', 'score', 'title', 'progress', 'season', 'studio'
    let sortDirection = -1; // 1 = asc, -1 = desc
    let activeSearchTerm = ""; // to pass search terms to torrents tab

    // ===== Torrent Filter State (persists within session) =====
    let torrentFilters = {
        category: '1_2',
        nyaaFilter: '0',
        resolution: '',
        group: '',
        episode: '',
        airingOnly: true,
        dateFilter: 'all',
    };

    // ===== Torrent Results Cache (persists across tab switches) =====
    let torrentCache = {
        items: [],       // last rendered items
        query: null,     // last search query (null = batch scan)
        mediaId: null,   // mediaId of the anime searched (for auto-selecting next ep)
        isBatch: false,  // true if last action was batch scan
        sortBy: 'date',
        sortDir: -1
    };

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function getCachedImageUrl(url) {
        if (!url) return '';
        return `/api/image?url=${encodeURIComponent(url)}`;
    }

    // ===== Fuzzy Search Helper =====
    function fuzzyMatch(query, text) {
        if (!query || !text) return false;
        query = query.toLowerCase();
        text = text.toLowerCase();
        // Simple fuzzy: check if all query chars appear in order in text
        let queryIndex = 0;
        for (let char of text) {
            if (char === query[queryIndex]) {
                queryIndex++;
                if (queryIndex === query.length) return true;
            }
        }
        return false;
    }

    function parseSize(sizeStr) {
        if (!sizeStr) return 0;
        const match = sizeStr.match(/^(\d+(\.\d+)?)\s*([KMGT]i?B)$/i);
        if (!match) return 0;
        const val = parseFloat(match[1]);
        const unit = match[3].toUpperCase();
        const units = { 
            'B': 1, 
            'KB': 1024, 'KIB': 1024, 
            'MB': 1024**2, 'MIB': 1024**2, 
            'GB': 1024**3, 'GIB': 1024**3, 
            'TB': 1024**4, 'TIB': 1024**4 
        };
        return val * (units[unit] || 1);
    }

    function getRelativeTime(timestamp) {
        if (!timestamp) return '';
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 84000) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    }

    function renderSegments(container, progress, total, isCurrent, nextAiringEpisode, mediaId = null) {
        container.innerHTML = '';
        
        let validTotal = (total && total > 0) ? total : 0;
        let available = validTotal;
        
        // If it's currently airing, available episodes is nextAiringEpisode - 1
        if (nextAiringEpisode && nextAiringEpisode.episode) {
            available = Math.max(0, nextAiringEpisode.episode - 1);
            // If total isn't known but we have nextAiringEpisode, limit validTotal
            if (validTotal === 0) validTotal = available + 1; // Arbitrary estimate
            if (available > validTotal) available = validTotal;
        }

        if (validTotal <= 0) validTotal = Math.max(progress, 1);
        if (available < progress) available = progress;

        const pWatched = Math.min((progress / validTotal) * 100, 100);
        const pAvailable = Math.min(((available - progress) / validTotal) * 100, 100);

        let barHtml = `
            <div class="progress-bar-container">
                <div class="progress-bar-watched" style="width: ${pWatched}%;"></div>
                <div class="progress-bar-available" style="width: ${pAvailable}%;"></div>
            </div>
        `;

        if (mediaId && !isCurrent) {
            // Smaller inline +/- buttons for list/grid items
            barHtml = `
                <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                    <button class="icon-btn btn-minus-prog" data-media-id="${mediaId}" style="padding: 0.1rem; width: 22px; height: 22px; flex-shrink: 0;" aria-label="Decrease Episode" title="-1 Episode">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    ${barHtml}
                    <button class="icon-btn btn-plus-prog" data-media-id="${mediaId}" style="padding: 0.1rem; width: 22px; height: 22px; flex-shrink: 0;" aria-label="Increase Episode" title="+1 Episode">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            `;
        }

        container.innerHTML = barHtml;
    }

    function renderRecentAnime() {
        const listContainer = document.getElementById('recent-anime-list');
        if (!listContainer) return;

        const recent = [...animeList].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 10);
        listContainer.innerHTML = '';

        if (recent.length === 0) {
            listContainer.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">No recent anime</div>';
            return;
        }

        recent.forEach(anime => {
            const title = anime.title?.romaji || anime.title?.english || 'Unknown';
            const cover = getCachedImageUrl(anime.coverImage?.medium || anime.coverImage?.large || '');
            const progress = anime.progress || 0;
            const total = anime.episodes || '?';

            const el = document.createElement('div');
            el.style.cssText = 'display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem; background: var(--bg-card); border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background 0.2s ease;';
            el.onmouseover = () => el.style.background = 'var(--bg-card-hover)';
            el.onmouseout = () => el.style.background = 'var(--bg-card)';

            el.innerHTML = `
                <img src="${cover}" style="width: 32px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); margin-bottom: 0.1rem;">${escapeHtml(title)}</div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Ep ${progress} / ${total}</span>
                        <span style="font-size: 0.7rem; color: var(--accent); opacity: 0.8; font-weight: 500;">${getRelativeTime(anime.updatedAt)}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <button class="icon-btn btn-search-torrents" data-media-id="${anime.mediaId}" data-title="${escapeHtml(title)}" style="padding: 0.3rem;" title="Search Torrents">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </button>
                    <button class="icon-btn btn-open-folder" data-media-id="${anime.mediaId}" style="padding: 0.3rem;" title="Open folder">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                    </button>
                </div>
            `;
            listContainer.appendChild(el);
        });

        // Attach folder events globally (since we populate them here)
        listContainer.querySelectorAll('.btn-open-folder').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const mediaId = btn.getAttribute('data-media-id');
                fetch('/api/open_folder?mediaId=' + mediaId).catch(console.error);
            };
        });
    }

    // ===== Now Playing Status (2s poll) =====
    let latestStatus = null;

    async function checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            latestStatus = data;

            if (data.running && data.title) {
                statusBubble.className = 'status-bubble online';
                statusText.textContent = 'Running';
                nowPlaying.classList.remove('hidden');
                idleState.classList.add('hidden');

                // Update badge with watcher name if available
                if (data.watcher_name) {
                    npPlayerBadge.textContent = `NOW PLAYING (${data.watcher_name})`;
                } else {
                    npPlayerBadge.textContent = 'NOW PLAYING';
                }

                // Prefer base title but keep full title for display
                const displayTitle = data.base_title || data.title;

                // Build link for title (AniList page)
                const selectedMediaId = data.selected_media_id;
                if (selectedMediaId) {
                    npTitle.innerHTML = `<a href="https://anilist.co/anime/${selectedMediaId}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayTitle)}</a>`;
                } else {
                    npTitle.textContent = displayTitle;
                }

                // Season selector
                if (Array.isArray(data.season_options) && data.season_options.length > 0) {
                    npSeason.innerHTML = data.season_options
                        .sort((a, b) => (b.seasonYear || 0) - (a.seasonYear || 0))
                        .map(opt => {
                            const label = opt.title || `Season ${opt.season || ''} ${opt.seasonYear || ''}`;
                            return `<option value="${opt.mediaId}" ${opt.mediaId === selectedMediaId ? 'selected' : ''}>${escapeHtml(label)}</option>`;
                        })
                        .join('');
                    npSeason.closest('.np-season-selector').style.display = 'flex';
                } else {
                    npSeason.closest('.np-season-selector').style.display = 'none';
                }

                // Stats
                if (data.media_details) {
                    const details = data.media_details;
                    const stats = [];
                    if (details.status) stats.push(`<span class="np-stat">${escapeHtml(details.status)}</span>`);
                    if (details.season && details.seasonYear) stats.push(`<span class="np-stat">${escapeHtml(details.season)} ${details.seasonYear}</span>`);
                    if (details.episodes) stats.push(`<span class="np-stat">${details.episodes} eps</span>`);
                    if (details.averageScore) stats.push(`<span class="np-stat">★ ${details.averageScore}%</span>`);
                    if (details.popularity) stats.push(`<span class="np-stat">♥ ${formatPopularity(details.popularity)}</span>`);
                    npStats.innerHTML = stats.join(' ');

                    // Studio
                    npStudio.textContent = details.studio || '';

                    // Summary
                    const summary = details.description || '';
                    if (summary) {
                        npSummary.textContent = summary.replace(/<[^>]+>/g, '');
                        npSummary.classList.remove('expanded');
                        npSummaryToggle.textContent = 'See more';
                        npSummaryToggle.style.display = 'block';
                    } else {
                        npSummary.textContent = '';
                        npSummaryToggle.style.display = 'none';
                    }
                } else {
                    npStats.innerHTML = '';
                    npSummary.textContent = '';
                    npSummaryToggle.style.display = 'none';
                    npStudio.textContent = '';
                }

                // Cover and banner images
                if (data.media_details) {
                    const rawCoverUrl = data.media_details.coverImage?.large || data.media_details.coverImage?.medium || '';
                    const rawBannerUrl = data.media_details.bannerImage || rawCoverUrl;
                    const coverUrl = getCachedImageUrl(rawCoverUrl);
                    const bannerUrl = getCachedImageUrl(rawBannerUrl);
                    npCover.src = coverUrl;
                    npBanner.style.backgroundImage = bannerUrl ? `url(${bannerUrl})` : '';

                    // Attach click targets
                    npCover.style.cursor = rawCoverUrl ? 'pointer' : 'default';
                    npCover.onclick = () => { if (rawCoverUrl) window.open(rawCoverUrl, '_blank'); };
                    npBanner.style.cursor = rawBannerUrl ? 'pointer' : 'default';
                    npBanner.onclick = () => { if (rawBannerUrl) window.open(rawBannerUrl, '_blank'); };
                }

                // Determine total: prefer AniList episode count, then local folder count
                const total = data.anilist_total_episodes || data.total_episodes || 0;
                const watched = data.watched_episodes || 0;
                
                let nextAiring = null;
                if (data.media_details && data.media_details.nextAiringEpisode) {
                    nextAiring = data.media_details.nextAiringEpisode;
                }
                
                const totalStr = total > 0 ? total : '?';
                npProgressLabel.textContent = `E${watched} / ${totalStr}`;
                renderSegments(npProgressSegments, watched, total, true, nextAiring);

                // Try to find matching anime in list for extra metadata
                if (data.base_title !== lastNowPlayingTitle) {
                    lastNowPlayingTitle = data.base_title;
                    updateNowPlayingMetadata(data.base_title);
                }
            } else {
                statusBubble.className = 'status-bubble offline';
                statusText.textContent = 'Not Running';
                nowPlaying.classList.add('hidden');
                idleState.classList.remove('hidden');
                lastNowPlayingTitle = null;
                // Reset cover/banner
                npBanner.style.backgroundImage = '';
                npCover.src = '';
                npStudio.textContent = '';
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            statusBubble.className = 'status-bubble offline';
            statusText.textContent = 'Disconnected';
            nowPlaying.classList.add('hidden');
            idleState.classList.remove('hidden');
        }
    }

    function updateNowPlayingMetadata(baseTitle) {
        // Try to find this anime in the loaded list
        // Do not wipe out cover/banner here, since the status API already provides accurate ones.
        if (!baseTitle || animeList.length === 0) {
            npStudio.textContent = '';
            return;
        }

        const searchLower = baseTitle.toLowerCase();
        const match = animeList.find(a => {
            const t = a.title || {};
            return (
                (t.romaji && t.romaji.toLowerCase().includes(searchLower)) ||
                (t.english && t.english.toLowerCase().includes(searchLower)) ||
                (t.native && t.native.includes(baseTitle))
            );
        });

        if (match) {
            // Only update studio if present, do not override valid cover images from status API with empty ones
            npStudio.textContent = match.studio || '';
        } else {
            npStudio.textContent = '';
        }
    }

    // ===== Episode Adjustment =====
    async function adjustEpisode(change) {
        try {
            const response = await fetch('/api/adjust_episode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ change })
            });
            if (response.ok) {
                checkStatus();
            }
        } catch (error) {
            console.error('Failed to adjust episode:', error);
        }
    }

    btnMinus.addEventListener('click', () => adjustEpisode(-1));
    btnPlus.addEventListener('click', () => adjustEpisode(1));

    // ===== Sync Button =====
    btnSync.addEventListener('click', async () => {
        if (!confirm('Sync this progress to AniList?')) return;
        btnSync.disabled = true;
        btnSync.textContent = 'Syncing...';
        try {
            const response = await fetch('/api/sync', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                btnSync.textContent = 'Synced ✓';
                // Re-fetch list after syncing to update progress
                setTimeout(() => { fetchAnimeList(); }, 1000);
                setTimeout(() => {
                    btnSync.disabled = false;
                    btnSync.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.83-2.06"/></svg> Sync to AniList`;
                }, 3000);
            } else {
                alert('Failed to sync. Check backend logs.');
                btnSync.disabled = false;
                btnSync.textContent = 'Sync Failed ✗';
            }
        } catch (error) {
            alert('Network error reaching tracker agent.');
            btnSync.disabled = false;
            btnSync.textContent = 'Sync Error ✗';
        }
    });

    // ===== Now Playing Season Selection =====
    npSeason.addEventListener('change', async () => {
        const selectedId = parseInt(npSeason.value, 10);
        if (!isNaN(selectedId)) {
            await fetch('/api/select_season', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaId: selectedId })
            });
            checkStatus();
        }
    });

    // ===== Summary Toggle =====
    npSummaryToggle.addEventListener('click', () => {
        const expanded = npSummary.classList.toggle('expanded');
        npSummaryToggle.textContent = expanded ? 'See less' : 'See more';
    });

    // ===== Now Playing Details Modal =====
    function openDetailsModal() {
        if (!latestStatus || !latestStatus.media_details) return;
        const details = latestStatus.media_details;
        const rel = details.title?.romaji || details.title?.english || '';
        modalBody.innerHTML = `
            <h3>${escapeHtml(rel)}</h3>
            <p><strong>Status:</strong> ${escapeHtml(details.status || 'N/A')}</p>
            <p><strong>Season:</strong> ${escapeHtml(details.season || '')} ${details.seasonYear || ''}</p>
            <p><strong>Episodes:</strong> ${details.episodes || 'N/A'}</p>
            <p><strong>Score:</strong> ${details.averageScore || 'N/A'}</p>
            <p><strong>Popularity:</strong> ${details.popularity || 'N/A'}</p>
            <p><strong>Description:</strong></p>
            <p>${escapeHtml(details.description || 'No description available.')}</p>
        `;
        detailsModal.classList.remove('hidden');
    }

    btnEditNowPlaying.addEventListener('click', openDetailsModal);
    modalOverlay.addEventListener('click', () => detailsModal.classList.add('hidden'));
    modalClose.addEventListener('click', () => detailsModal.classList.add('hidden'));
    modalCloseBtn.addEventListener('click', () => detailsModal.classList.add('hidden'));

    // ===== Anime List Fetching =====
    async function fetchAnimeList() {
        try {
            const response = await fetch('/api/animelist');
            const data = await response.json();
            
            if (data.error === 'auth_failed') {
                animeGrid.innerHTML = `
                    <div class="empty-state">
                        <p>AniList authentication failed or expired.</p>
                        <button class="primary-btn" onclick="document.getElementById('btn-reauthorize').click()">Reauthorize Now</button>
                    </div>`;
                return;
            }
            
            animeList = data;
            renderRecentAnime();
            updateCounts();
            renderAnimeGrid();
            // Also refresh now-playing metadata if applicable
            if (lastNowPlayingTitle) {
                updateNowPlayingMetadata(lastNowPlayingTitle);
            }
        } catch (error) {
            console.error('Error fetching anime list:', error);
            animeGrid.innerHTML = `<div class="empty-state"><p>Could not load anime list.</p></div>`;
        }
    }

    function updateCounts() {
        const currentCount = animeList.filter(a => a.listStatus === 'CURRENT').length;
        const planningCount = animeList.filter(a => a.listStatus === 'PLANNING').length;
        const completedCount = animeList.filter(a => a.listStatus === 'COMPLETED').length;
        countCurrent.textContent = currentCount;
        countPlanning.textContent = planningCount;
        countCompleted.textContent = completedCount;
    }

    // ===== Filtering =====
    function getFilteredList() {
        const nameQuery = filterName.value.toLowerCase().trim();
        const seasonQuery = filterSeason.value;
        const yearQuery = filterYear.value ? parseInt(filterYear.value) : null;

        let filtered = animeList.filter(a => {
            // Exclude Adult/Ecchi by default
            if (a.genres && a.genres.some(g => ['Ecchi', 'Hentai', 'Adult'].includes(g))) return false;
            if (a.isAdult) return false;

            // Status tab filter
            if (a.listStatus !== activeTab) return false;

            // Name filter
            if (nameQuery) {
                const t = a.title || {};
                const titleMatch = [t.romaji, t.english, t.native]
                    .filter(Boolean)
                    .some(name => fuzzyMatch(nameQuery, name) || name.toLowerCase().includes(nameQuery));
                if (!titleMatch) return false;
            }

            // Season filter
            if (seasonQuery && a.season !== seasonQuery) return false;

            // Year filter
            if (yearQuery && a.seasonYear !== yearQuery) return false;

            return true;
        });

        // Sort
        if (sortBy) {
            const direction = sortDirection || 1;
            filtered.sort((a, b) => {
                let cmp = 0;
                switch (sortBy) {
                    case 'popularity':
                        cmp = (a.popularity || 0) - (b.popularity || 0);
                        break;
                    case 'score':
                        cmp = (a.averageScore || 0) - (b.averageScore || 0);
                        break;
                    case 'title':
                        const aTitle = (a.title?.romaji || a.title?.english || '').toLowerCase();
                        const bTitle = (b.title?.romaji || b.title?.english || '').toLowerCase();
                        cmp = aTitle.localeCompare(bTitle);
                        break;
                    case 'progress':
                        const aProg = a.progress || 0;
                        const aTotal = (a.episodes && a.episodes > 0) ? a.episodes : Infinity;
                        const bProg = b.progress || 0;
                        const bTotal = (b.episodes && b.episodes > 0) ? b.episodes : Infinity;

                        const pA = aTotal === Infinity ? (aProg > 0 ? (aProg / 1000) : 0) : (aProg / aTotal);
                        const pB = bTotal === Infinity ? (bProg > 0 ? (bProg / 1000) : 0) : (bProg / bTotal);
                        
                        cmp = pA - pB;
                        if (cmp === 0) {
                            cmp = aProg - bProg;
                        }
                        break;
                    case 'season':
                        cmp = (a.seasonYear || 0) - (b.seasonYear || 0);
                        if (cmp === 0) {
                            cmp = (a.season || '').localeCompare(b.season || '');
                        }
                        break;
                    case 'studio':
                        cmp = (a.studio || '').localeCompare(b.studio || '');
                        break;
                    default:
                        cmp = 0;
                }
                return cmp * direction;
            });
        }

        return filtered;
    }

    // ===== Rendering =====
    function renderAnimeGrid() {
        if (activeTab === 'LIBRARY') return;
        const filtered = getFilteredList();

        // Update grid class for view mode
        animeGrid.className = `anime-grid ${viewMode}-view`;

        if (activeTab === 'STATS') {
            const watchedList = animeList.filter(a => {
                if (a.genres && a.genres.some(g => ['Ecchi', 'Hentai', 'Adult'].includes(g))) return false;
                if (a.isAdult) return false;
                return a.listStatus === 'COMPLETED' || (a.progress || 0) > 0;
            });
            
            let totalAnime = watchedList.length;
            let totalEps = 0;
            let scoreSum = 0;
            let scoreCount = 0;
            let genres = {};
            let dailyActivity = {}; // timestamp (start of day) -> count
            
            watchedList.forEach(a => {
                totalEps += a.progress || 0;
                let s = 0;
                if (a.score && a.score > 0) {
                    // User score: if > 10, likely out of 100, otherwise out of 10
                    s = a.score > 10 ? a.score : a.score * 10;
                }
                
                if (s > 0) {
                    scoreSum += s;
                    scoreCount++;
                }
                
                if (a.genres && a.genres.length > 0) {
                    a.genres.forEach(g => {
                        genres[g] = (genres[g] || 0) + 1;
                    });
                }
                
                if (a.updatedAt) {
                    const date = new Date(a.updatedAt * 1000);
                    date.setHours(0,0,0,0);
                    const ts = date.getTime();
                    dailyActivity[ts] = (dailyActivity[ts] || 0) + 1;
                }
            });
            
            // Weekly Activity Distribution (day-of-week bucket from dailyActivity)
            // 0=Sun, 1=Mon, ..., 6=Sat (JS getDay)
            const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
            Object.entries(dailyActivity).forEach(([ts, count]) => {
                const dayOfWeek = new Date(parseInt(ts)).getDay();
                weeklyActivity[dayOfWeek] += count;
            });
            
            const meanScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : 0;
            const daysWatched = (totalEps * 24 / 60 / 24).toFixed(1);
            
            // Pareto Chart Logic - Truncate to top 9 + Others
            const allSortedGenres = Object.entries(genres).sort((a,b) => b[1] - a[1]);
            let sortedGenres = allSortedGenres.slice(0, 9);
            const othersSum = allSortedGenres.slice(9).reduce((sum, g) => sum + g[1], 0);
            if (othersSum > 0) {
                sortedGenres.push(['Others', othersSum]);
            }
            
            const totalGenreCount = Object.values(genres).reduce((a, b) => a + b, 0);
            let paretoHtml = '';
            if (sortedGenres.length > 0) {
                const width = 900;
                const height = 400;
                const margin = { top: 40, right: 80, bottom: 90, left: 60 };
                const chartWidth = width - margin.left - margin.right;
                const chartHeight = height - margin.top - margin.bottom;
                const maxCount = Math.max(...sortedGenres.map(g => g[1])) || 1;
                const barWidth = chartWidth / sortedGenres.length;
                
                let bars = '', points = [], cumulative = 0, axisTicks = '', gridLines = '';
                
                // Y-Axis Frequency Ticks (Left)
                for (let i = 0; i <= 5; i++) {
                    const y = chartHeight - (i / 5) * chartHeight;
                    const val = Math.round((i / 5) * maxCount);
                    axisTicks += `<text x="-10" y="${y + 4}" font-size="12" fill="var(--text-muted)" text-anchor="end">${val}</text>`;
                    gridLines += `<line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="3,3" />`;
                }
                
                // Y-Axis Cumulative % Ticks (Right)
                for (let i = 0; i <= 5; i++) {
                    const y = chartHeight - (i / 5) * chartHeight;
                    axisTicks += `<text x="${chartWidth + 10}" y="${y + 4}" font-size="12" fill="#FBBF24" text-anchor="start">${i * 20}%</text>`;
                }

                sortedGenres.forEach(([genre, count], i) => {
                    const x = i * barWidth;
                    const barHeight = (count / maxCount) * chartHeight;
                    const y = chartHeight - barHeight;
                    cumulative += count;
                    const cumulativePercent = (cumulative / totalGenreCount) * 100;
                    const cy = chartHeight - (cumulativePercent / 100) * chartHeight;
                    points.push(`${x + barWidth/2},${cy}`);
                    
                    bars += `
                        <rect x="${x + 8}" y="${y}" width="${barWidth - 16}" height="${barHeight}" fill="var(--accent)" opacity="0.8" rx="4">
                            <title>${genre}: ${count} (${((count/totalGenreCount)*100).toFixed(1)}%)</title>
                        </rect>
                        <text x="${x + barWidth/2}" y="${chartHeight + 20}" font-size="13" fill="var(--text-secondary)" text-anchor="end" transform="rotate(-35, ${x + barWidth/2}, ${chartHeight + 20})" font-weight="600">${genre}</text>
                    `;
                });
                
                const linePath = `M ${points.join(' L ')}`;
                paretoHtml = `
                    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; overflow: visible; font-family: inherit;">
                        <g transform="translate(${margin.left}, ${margin.top})">
                            ${gridLines}
                            <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="var(--border)" stroke-width="1.5" />
                            <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="var(--border)" stroke-width="1.5" />
                            <line x1="${chartWidth}" y1="0" x2="${chartWidth}" y2="${chartHeight}" stroke="var(--border)" stroke-width="1.5" />
                            ${axisTicks}
                            ${bars}
                            <path d="${linePath}" fill="none" stroke="#FBBF24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                            ${points.map((p, i) => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="5" fill="#FBBF24" stroke="var(--bg-card)" stroke-width="2" />`).join('')}
                            
                            <g transform="translate(0, -25)">
                                <rect width="14" height="14" fill="var(--accent)" rx="3" />
                                <text x="22" y="11" font-size="12" fill="var(--text-primary)" font-weight="600">Genre Frequency</text>
                                <line x1="150" y1="7" x2="185" y2="7" stroke="#FBBF24" stroke-width="3" />
                                <text x="195" y="11" font-size="12" fill="var(--text-primary)" font-weight="600">Cumulative Coverage (%)</text>
                            </g>
                        </g>
                    </svg>
                `;
            }

            // Genre Overview Logic
            const genreColors = {
                'Comedy': '#84cc16',
                'Action': '#0ea5e9',
                'Fantasy': '#a855f7',
                'Drama': '#f472b6',
                'Adventure': '#06b6d4',
                'Sci-Fi': '#6366f1',
                'Romance': '#ec4899',
                'Slice of Life': '#10b981',
                'Supernatural': '#8b5cf6',
                'Mystery': '#64748b',
                'Psychological': '#475569',
                'Music': '#f59e0b',
                'Others': '#fb923c'
            };

            const topGenres = sortedGenres;
            let genreOverviewHtml = '';
            let distributionBarHtml = '';

            if (topGenres.length > 0) {
                let chipsHtml = '';
                topGenres.forEach(([genre, count]) => {
                    const color = genreColors[genre] || '#10B981';
                    chipsHtml += `
                        <div class="genre-item">
                            <div class="genre-chip" style="background: ${color}; font-size: 14px; padding: 8px 12px;">${genre}</div>
                            <div class="genre-info">
                                <span class="genre-count" style="color: ${color}; font-size: 14px;">${count}</span> Entries
                            </div>
                        </div>
                    `;
                });

                // Distribution bar segments
                const sumDist = topGenres.reduce((s, g) => s + g[1], 0);
                
                topGenres.forEach(([genre, count]) => {
                    const color = genreColors[genre] || '#9CA3AF';
                    const percentage = (count / sumDist) * 100;
                    distributionBarHtml += `<div class="genre-dist-segment" style="width: ${percentage}%; background: ${color};" title="${genre}: ${count}"></div>`;
                });

                genreOverviewHtml = `
                    <div class="genre-overview-card">
                        <h3 class="genre-overview-title">Genre Overview</h3>
                        <div class="genre-chips" style="grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); display: grid; gap: 12px;">
                            ${chipsHtml}
                        </div>
                        <div class="genre-distribution-wrapper">
                            <div class="genre-distribution-bar">
                                ${distributionBarHtml}
                            </div>
                        </div>
                    </div>
                `;
            }

            // Heat Map Logic (Last 12 Months)
            const today = new Date();
            today.setHours(0,0,0,0);
            const heatWidth = 800;
            const heatHeight = 130;
            const cellSize = 12;
            const cellGap = 3;
            let heatCells = '';
            
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - (52 * 7 + today.getDay()));
            
            let months = [];
            let lastMonth = -1;
            
            for (let w = 0; w <= 52; w++) {
                for (let d = 0; d < 7; d++) {
                    const current = new Date(startDate);
                    current.setDate(startDate.getDate() + (w * 7 + d));
                    if (current > today) break;
                    
                    const ts = current.getTime();
                    const count = dailyActivity[ts] || 0;
                    
                    if (d === 0) {
                        const m = current.getMonth();
                        if (m !== lastMonth) {
                            months.push(`<text x="${w * (cellSize + cellGap)}" y="-5" font-size="10" fill="var(--text-muted)">${current.toLocaleString('default', { month: 'short' })}</text>`);
                            lastMonth = m;
                        }
                    }
                    
                    let color = 'rgba(255, 255, 255, 0.05)';
                    if (count > 0) color = 'rgba(16, 185, 129, 0.2)';
                    if (count > 1) color = 'rgba(16, 185, 129, 0.5)';
                    if (count > 2) color = 'rgba(16, 185, 129, 0.8)';
                    if (count > 4) color = 'var(--accent)';
                    
                    heatCells += `
                        <rect x="${w * (cellSize + cellGap)}" y="${d * (cellSize + cellGap)}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="2">
                            <title>${current.toDateString()}: ${count} updates</title>
                        </rect>
                    `;
                }
            }

            animeGrid.className = 'anime-grid stats-view';
            animeGrid.innerHTML = `
                <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
                        <div style="text-align: center;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">Total Anime</div>
                            <div style="font-size: 32px; color: var(--accent); font-weight: 800;">${totalAnime}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">Episodes</div>
                            <div style="font-size: 32px; color: var(--accent); font-weight: 800;">${totalEps}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">Days Watched</div>
                            <div style="font-size: 32px; color: var(--accent); font-weight: 800;">${daysWatched}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">Mean Score</div>
                            <div style="font-size: 32px; color: var(--accent); font-weight: 800;">${meanScore}</div>
                        </div>
                    </div>
                </div>

                ${genreOverviewHtml}

                <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                    <h3 style="margin-bottom: 24px; font-size: 16px; font-weight: 700; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; line-height: 1;">Genre Distribution (Pareto)</h3>
                    <div style="width: 100%;">${paretoHtml || '<div style="color: var(--text-muted); text-align: center; padding: 40px 0;">No genre data available</div>'}</div>
                </div>

                <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                    <h3 style="margin-bottom: 24px; font-size: 16px; font-weight: 700; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; line-height: 1;">Activity Heatmap (Updates)</h3>
                    <div style="overflow-x: auto; width: 100%; padding-bottom: 15px;">
                        <svg viewBox="0 0 ${heatWidth} ${heatHeight}" style="width: 100%; min-width: 750px; height: auto; overflow: visible;">
                            <g transform="translate(30, 20)">
                                ${heatCells}
                                ${months.join('')}
                                <text x="-25" y="10" font-size="9" fill="var(--text-muted)">Mon</text>
                                <text x="-25" y="40" font-size="9" fill="var(--text-muted)">Wed</text>
                                <text x="-25" y="70" font-size="9" fill="var(--text-muted)">Fri</text>
                                <text x="-25" y="100" font-size="9" fill="var(--text-muted)">Sun</text>
                            </g>
                        </svg>
                    </div>
                </div>

                <!-- Weekly Distribution Block Chart -->
                <div class="stats-card" style="grid-column: 1 / -1; background: var(--bg-card); padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-card);">
                    <h3 style="margin-bottom: 24px; font-size: 16px; font-weight: 700; color: var(--text-primary); border-left: 3px solid var(--accent); padding-left: 12px; line-height: 1;">Weekly Watch Distribution</h3>
                    ${(() => {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const maxWeekly = Math.max(...weeklyActivity, 1);
                        const BLOCK_ROWS = 8; // number of block rows per column
                        const BLOCK_SIZE = 18;
                        const BLOCK_GAP = 4;
                        const COL_GAP = 14;
                        const colWidth = BLOCK_SIZE + COL_GAP;

                        // Reorder columns to Mon–Sun (Mon=1 … Sat=6, Sun=0)
                        const ordered = [1, 2, 3, 4, 5, 6, 0];
                        const orderedNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                        const svgW = ordered.length * colWidth - COL_GAP + 60;
                        const svgH = BLOCK_ROWS * (BLOCK_SIZE + BLOCK_GAP) + 50;

                        let cols = '';
                        ordered.forEach((dowIdx, colI) => {
                            const count = weeklyActivity[dowIdx];
                            const ratio = count / maxWeekly;
                            // How many full blocks to fill (out of BLOCK_ROWS)
                            const filledBlocks = Math.round(ratio * BLOCK_ROWS);
                            const x = colI * colWidth;

                            // Count label above
                            cols += `<text x="${x + BLOCK_SIZE / 2}" y="-8" font-size="11" fill="var(--text-secondary)" text-anchor="middle" font-weight="700">${count}</text>`;

                            for (let row = 0; row < BLOCK_ROWS; row++) {
                                // Render from bottom up
                                const blockIdx = BLOCK_ROWS - 1 - row;
                                const y = blockIdx * (BLOCK_SIZE + BLOCK_GAP);
                                const isFilled = row < filledBlocks;
                                let fill, opacity;
                                if (!isFilled) {
                                    fill = 'rgba(255,255,255,0.05)';
                                    opacity = 1;
                                } else {
                                    // Gradient: bottom blocks brighter
                                    const blockRatio = (row + 1) / filledBlocks;
                                    if (blockRatio <= 0.33) { fill = 'rgba(16,185,129,0.25)'; opacity = 1; }
                                    else if (blockRatio <= 0.66) { fill = 'rgba(16,185,129,0.55)'; opacity = 1; }
                                    else { fill = 'var(--accent)'; opacity = 1; }
                                }
                                cols += `<rect x="${x}" y="${y}" width="${BLOCK_SIZE}" height="${BLOCK_SIZE}" fill="${fill}" rx="3" opacity="${opacity}"><title>${orderedNames[colI]}: ${count} update${count !== 1 ? 's' : ''}</title></rect>`;
                            }

                            // Day label below
                            cols += `<text x="${x + BLOCK_SIZE / 2}" y="${BLOCK_ROWS * (BLOCK_SIZE + BLOCK_GAP) + 14}" font-size="11" fill="${ratio > 0.5 ? 'var(--text-primary)' : 'var(--text-muted)'}" text-anchor="middle" font-weight="${ratio > 0.5 ? '700' : '400'}">${orderedNames[colI]}</text>`;
                        });

                        // Legend
                        const legendX = ordered.length * colWidth + 8;
                        const legendItems = [
                            { fill: 'rgba(255,255,255,0.05)', label: 'None' },
                            { fill: 'rgba(16,185,129,0.25)', label: 'Low' },
                            { fill: 'rgba(16,185,129,0.55)', label: 'Mid' },
                            { fill: 'var(--accent)', label: 'High' },
                        ];
                        let legend = '';
                        legendItems.forEach((item, i) => {
                            const ly = i * 28;
                            legend += `<rect x="${legendX}" y="${ly}" width="14" height="14" fill="${item.fill}" rx="3"/>`;
                            legend += `<text x="${legendX + 20}" y="${ly + 11}" font-size="10" fill="var(--text-muted)">${item.label}</text>`;
                        });

                        return `
                                <div style="overflow-x: auto; width: 100%;">
                                    <svg viewBox="0 0 ${svgW} ${svgH}" style="overflow: visible; height: auto; min-width: ${svgW}px; max-width: 500px; display: block;">
                                        <g transform="translate(10, 24)">
                                            ${cols}
                                            ${legend}
                                        </g>
                                    </svg>
                                </div>`;
                    })()}
                </div>
            `;
            return;
        }

        if (activeTab === 'TORRENTS') {
            const searchTerm = activeSearchTerm || '';
            activeSearchTerm = ''; // reset after use

            // Pre-fill group from settings on first ever open
            if (!torrentFilters.group && userSettings && userSettings.preferred_groups) {
                const groups = userSettings.preferred_groups;
                torrentFilters.group = Array.isArray(groups) ? (groups[0] || '').replace(/[\[\]]/g, '') : String(groups).split(',')[0].replace(/[\[\]]/g, '').trim();
            }

            animeGrid.className = 'anime-grid torrents-view';
            animeGrid.innerHTML = `
                <div class="torrents-toolbar">
                    <div class="torrents-search">
                        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" id="torrents-search-input" placeholder="Search Nyaa.si..." value="${escapeHtml(searchTerm || torrentCache.query || '')}">
                        <button class="clear-input-btn" data-input-id="torrents-search-input" title="Clear">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <button id="btn-search-go" class="search-go-btn" title="Search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                    </div>
                    <button id="btn-scan-airing" class="refresh-btn" title="Scan recently airing anime for missing episodes" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:12px;font-weight:600;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Scan Recent
                    </button>
                    <a href="https://nyaa.si/?c=1_2" target="_blank" rel="noopener" class="refresh-btn nyaa-link-btn" title="Open Nyaa.si" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Nyaa.si
                    </a>
                </div>

                <!-- Filter Bar -->
                <div class="torrents-filter-bar" id="torrents-filter-bar">
                    <div class="filter-group">
                        <label class="filter-label">Category</label>
                        <select id="tf-category" class="filter-select">
                            <option value="1_2">English Subs</option>
                            <option value="1_3">Non-English</option>
                            <option value="1_4">Raw</option>
                            <option value="1_0">All Anime</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Trust</label>
                        <select id="tf-filter" class="filter-select">
                            <option value="0">All</option>
                            <option value="1">No Remakes</option>
                            <option value="2">Trusted Only</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Resolution</label>
                        <select id="tf-resolution" class="filter-select">
                            <option value="">Default</option>
                            <option value="1080p">1080p</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Date</label>
                        <select id="tf-date" class="filter-select">
                            <option value="all">All Time</option>
                            <option value="24h">Last 24h</option>
                            <option value="48h">Last 48h</option>
                            <option value="7d">Last 7d</option>
                            <option value="30d">Last 30d</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Date</label>
                        <select id="tf-date" class="filter-select">
                            <option value="all">All Time</option>
                            <option value="24h">Last 24h</option>
                            <option value="48h">Last 48h</option>
                            <option value="7d">Last 7d</option>
                            <option value="30d">Last 30d</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Subs / Group</label>
                        <div class="input-with-clear">
                            <input type="text" id="tf-group" class="filter-input" placeholder="e.g. SubsPlease" maxlength="40">
                            <button class="clear-input-btn" data-input-id="tf-group" title="Clear">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Episodes</label>
                        <div class="input-with-clear">
                            <input type="text" id="tf-episode" class="filter-input" placeholder="e.g. 5-10, 12" style="width:90px;">
                            <button class="clear-input-btn" data-input-id="tf-episode" title="Clear">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>
                    <div class="filter-group filter-toggle-group">
                        <label class="filter-label">Airing Only</label>
                        <label class="toggle-switch" title="Scan only currently airing anime">
                            <input type="checkbox" id="tf-airing-only" ${torrentFilters.airingOnly ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div id="torrents-results">
                    <div class="empty-state torrents-placeholder">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <p>Search for an anime, or click <strong>Scan Recent</strong> to find missing episodes.</p>
                    </div>
                </div>
                <div id="batch-download-bar" class="batch-download-bar hidden">
                    <div class="info">
                        <span id="batch-count">0 torrents selected</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="btn-select-remaining" class="btn-download-selected btn-secondary" style="background: rgba(255,255,255,0.1); color: white;">Select Remaining</button>
                        <button id="btn-download-selected" class="btn-download-selected">Download Selected</button>
                    </div>
                </div>
            `;

            // ---- Restore & sync filter state ----
            const tfCategory  = document.getElementById('tf-category');
            const tfFilter    = document.getElementById('tf-filter');
            const tfRes       = document.getElementById('tf-resolution');
            const tfDate      = document.getElementById('tf-date');
            const tfGroup     = document.getElementById('tf-group');
            const tfEpisode   = document.getElementById('tf-episode');
            const tfAiring    = document.getElementById('tf-airing-only');

            tfCategory.value  = torrentFilters.category;
            tfFilter.value    = torrentFilters.nyaaFilter;
            tfRes.value       = torrentFilters.resolution;
            tfGroup.value     = torrentFilters.group;
            tfEpisode.value   = torrentFilters.episode;

            const getFilters = () => ({
                category:   tfCategory.value,
                nyaaFilter: tfFilter.value,
                resolution: tfRes.value,
                dateFilter: tfDate.value,
                group:      tfGroup.value.trim(),
                episode:    tfEpisode.value.trim(),
                airingOnly: tfAiring.checked,
            });

            const saveFilters = () => {
                Object.assign(torrentFilters, getFilters());
            };

            /** Parse episode expression like '5', '5-10', '11,12', '5-7,10' into array of ints */
            const parseEpisodeExpr = (expr) => {
                if (!expr) return [];
                const eps = [];
                expr.split(',').forEach(part => {
                    part = part.trim();
                    if (!part) return;
                    const rangeParts = part.split('-').map(s => parseInt(s.trim(), 10));
                    if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
                        for (let e = rangeParts[0]; e <= rangeParts[1]; e++) eps.push(e);
                    } else if (rangeParts.length === 1 && !isNaN(rangeParts[0])) {
                        eps.push(rangeParts[0]);
                    }
                });
                return eps;
            };

            const resultsContainer = document.getElementById('torrents-results');
            const searchInput      = document.getElementById('torrents-search-input');
            const batchBar         = document.getElementById('batch-download-bar');
            const batchCountText   = document.getElementById('batch-count');

            let selectedTorrents = new Set();

            const updateBatchBar = () => {
                const count = selectedTorrents.size;
                if (count > 0) {
                    batchBar.classList.remove('hidden');
                    batchCountText.textContent = `${count} torrent${count > 1 ? 's' : ''} selected`;
                } else {
                    batchBar.classList.add('hidden');
                }
            };

            // Build search URL params from current filters
            const buildSearchParams = (query) => {
                const f = getFilters();
                const q = f.group ? `${query} ${f.group}` : query;
                const p = new URLSearchParams({ q, category: f.category, filter: f.nyaaFilter });
                if (f.resolution) p.set('resolution', f.resolution);
                if (torrentCache.mediaId) p.set('media_id', torrentCache.mediaId);
                // For manual search, send first episode only (or none)
                const eps = parseEpisodeExpr(f.episode);
                if (eps.length === 1) p.set('episode', eps[0]);
                return p.toString();
            };

            const buildBatchParams = () => {
                const f = getFilters();
                const p = new URLSearchParams({
                    airing_only: f.airingOnly ? 'true' : 'false',
                    category:    f.category,
                    filter:      f.nyaaFilter,
                });
                if (f.resolution) p.set('resolution', f.resolution);
                return p.toString();
            };

            const performSearch = async (query) => {
                saveFilters();
                const f = getFilters();
                const eps = parseEpisodeExpr(f.episode);

                torrentCache = { items: [], query, isBatch: false };
                resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Searching Nyaa...</p></div>';
                selectedTorrents.clear(); updateBatchBar();

                try {
                    let allItems = [];
                    if (eps.length > 1) {
                        // Parallel search for each episode in range
                        const searches = eps.map(ep => {
                            const q = f.group ? `${query} ${f.group}` : query;
                            const p = new URLSearchParams({ q, category: f.category, filter: f.nyaaFilter, episode: ep });
                            if (f.resolution) p.set('resolution', f.resolution);
                            return fetch(`/api/nyaa_search?${p.toString()}`).then(r => r.json()).then(results =>
                                results.map(r => ({ torrent: r, animeTitle: query, episode: ep, _fromSearch: true }))
                            ).catch(() => []);
                        });
                        const results = await Promise.all(searches);
                        allItems = results.flat();
                    } else {
                        const resp = await fetch(`/api/nyaa_search?${buildSearchParams(query)}`);
                        const results = await resp.json();
                        allItems = results.map(r => ({ torrent: r, animeTitle: query, _fromSearch: true }));
                    }

                    torrentCache = { items: allItems, query, isBatch: false };

                    // Fallback: if no mediaId, try fuzzy matching title against animeList
                    if (!torrentCache.mediaId) {
                        const q = query.toLowerCase();
                        const found = animeList.find(a => {
                            const t = a.title;
                            return (t.userPreferred && t.userPreferred.toLowerCase().includes(q)) || 
                                   (t.english && t.english.toLowerCase().includes(q)) || 
                                   (t.romaji && t.romaji.toLowerCase().includes(q));
                        });
                        if (found) torrentCache.mediaId = found.mediaId;
                    }

                    renderTorrentTable(allItems);
                } catch (e) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>Search failed.</p></div>';
                }
            };

            const loadBatchMissing = async () => {
                saveFilters();
                torrentCache = { items: [], query: null, isBatch: true };
                resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Scanning recent anime for missing episodes...</p></div>';
                selectedTorrents.clear(); updateBatchBar();
                try {
                    const resp = await fetch(`/api/nyaa_batch_search?${buildBatchParams()}`);
                    const results = await resp.json();
                    torrentCache = { items: results, query: null, isBatch: true };
                    renderTorrentTable(results);
                } catch (e) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>Scan failed.</p></div>';
                }
            };



            // ---- Render table ----
            const renderTorrentTable = (items, sortCol = torrentCache.sortBy, sortDir = torrentCache.sortDir) => {
                const targetAnime = torrentCache.mediaId ? animeList.find(a => String(a.mediaId) === String(torrentCache.mediaId)) : null;
                const nextEp = targetAnime ? (targetAnime.progress + 1) : null;

                // Filter by date if applicable
                const now = new Date();
                const filterMap = {
                    '24h': 24 * 3600 * 1000,
                    '48h': 48 * 3600 * 1000,
                    '7d':  7 * 24 * 3600 * 1000,
                    '30d': 30 * 24 * 3600 * 1000
                };
                const ms = filterMap[torrentFilters.dateFilter];
                if (ms) {
                    items = items.filter(it => {
                        if (!it.torrent?.pubDate) return false;
                        const pd = new Date(it.torrent.pubDate);
                        return (now - pd) <= ms;
                    });
                }

                // Is the anime recent (airingAt within past 7 days) or a next-needed episode?
                const isRecent = (item) => {
                    // 1. If airingAt metadata is provided directly (from batch scan)
                    if (item.airingAt) {
                        const now = Date.now() / 1000;
                        const sevenDaysAgo = now - (7 * 24 * 60 * 60);
                        return item.airingAt > sevenDaysAgo && item.airingAt < now + (7 * 24 * 60 * 60);
                    }
                    // 2. If it matches target anime the next episode we need
                    if (targetAnime && (item.torrent?.episode || item.episode)) {
                        const ep = item.torrent?.episode || item.episode;
                        if (ep === nextEp) return true;
                        // Or if it matches the current airing episode precisely
                        if (targetAnime.nextAiringEpisode && ep === targetAnime.nextAiringEpisode.episode) return true;
                    }
                    return false;
                };

                if (!items || items.length === 0) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>No results found.</p></div>';
                    return;
                }

                let sorted = [...items];
                if (sortCol) {
                    sorted.sort((a, b) => {
                        let valA, valB;
                        const tA = a.torrent;
                        const tB = b.torrent;
                        
                        switch (sortCol) {
                            case 'ep':
                                valA = parseFloat(a.episode ?? tA?.episode ?? 0);
                                valB = parseFloat(b.episode ?? tB?.episode ?? 0);
                                break;
                            case 'date': {
                                const parseD = (str) => { if(!str) return 0; try { return new Date(str).getTime(); } catch(e) { return 0; } };
                                valA = parseD(tA?.pubDate);
                                valB = parseD(tB?.pubDate);
                                break;
                            }
                            case 'group':
                                valA = (tA?.group || '').toLowerCase();
                                valB = (tB?.group || '').toLowerCase();
                                break;
                            case 'title':
                                valA = (tA?.title || '').toLowerCase();
                                valB = (tB?.title || '').toLowerCase();
                                break;
                            case 'size':
                                valA = parseSize(tA?.size);
                                valB = parseSize(tB?.size);
                                break;
                            case 'seeders':
                                valA = tA?.seeders ?? 0;
                                valB = tB?.seeders ?? 0;
                                break;
                            case 'leechers':
                                valA = tA?.leechers ?? 0;
                                valB = tB?.leechers ?? 0;
                                break;
                            default:
                                return 0;
                        }
                        
                        if (typeof valA === 'string') {
                            return sortDir * valA.localeCompare(valB);
                        }
                        return sortDir * (valA - valB);
                    });
                }

                const individual = sorted.filter(it => !it.torrent?.is_batch);
                const batches    = sorted.filter(it =>  it.torrent?.is_batch);

                const renderRows = (list, startIdx) => list.map((item, i) => {
                    const idx = startIdx + i;
                    const t = item.torrent;
                    const isDownloaded = !!item.is_downloaded;
                    const isWatched    = !!item.is_watched;
                    const isDisabled   = isDownloaded || isWatched;
                    
                    // Pre-check if:
                    // A) It is a batch scan and it is not consumed (existing logic)
                    // B) It is a search match for the SPECIFIC next episode we need
                    const isBatchScan  = !item._fromSearch;
                    const isNextNeeded = targetAnime && item.torrent?.episode === nextEp;
                    const isPreChecked = (isBatchScan && !isDownloaded && !isWatched) || (isNextNeeded && !isDownloaded && !isWatched);

                    const statusText   = isWatched ? 'Watched' : (isDownloaded ? 'Downloaded' : '');
                    const statusClass  = isWatched ? 'watched' : 'downloaded';
                    const rowId        = `torrent-row-${idx}`;
                    const displayEp    = item.episode ?? t?.episode ?? '-';
                    const titleLink    = t?.view_link
                        ? `<a href="${escapeHtml(t.view_link)}" target="_blank" rel="noopener" class="torrent-title-link">${escapeHtml(t?.title || '')}</a>`
                        : escapeHtml(t?.title || '');
                    const magnetBtn    = t?.magnet
                        ? `<a href="${escapeHtml(t.magnet)}" class="icon-btn" title="Open Magnet" style="padding:4px;display:inline-flex;">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15A6 6 0 0 0 18 15"/><path d="M6 15V9a6 6 0 0 1 12 0v6"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
                           </a>`
                        : '';
                    const recentClass = isRecent(item) ? ' row-recent' : '';

                    return `
                        <tr class="${isDisabled ? 'row-disabled' : ''}${recentClass}" id="${rowId}">
                            <td class="checkbox-cell">
                                <input type="checkbox" class="torrent-checkbox custom-checkbox"
                                    data-idx="${idx}"
                                    ${isDisabled ? 'disabled' : (isPreChecked ? 'checked' : '')}
                                    data-url="${escapeHtml(t?.link || '')}"
                                    data-mediaid="${item.mediaId || ''}"
                                    data-title="${escapeHtml(item.animeTitle || '')}">
                            </td>
                            <td style="font-weight:700;text-align:center;">${displayEp}</td>
                            <td><span class="torrent-group">${escapeHtml(t?.group || '')}</span></td>
                            <td class="torrent-title-cell" title="${escapeHtml(t?.title || '')}">
                                <div class="torrent-title-wrap">${titleLink}</div>
                            </td>
                            <td style="white-space:nowrap;font-size:0.7rem;color:var(--text-muted);">${t?.pubDate ? new Date(t.pubDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}</td>
                            <td style="white-space:nowrap;">${escapeHtml(t?.size || '')}</td>
                            <td class="torrent-seeders">${t?.seeders ?? 0}</td>
                            <td class="torrent-leechers">${t?.leechers ?? 0}</td>
                            <td style="white-space:nowrap; text-align: right;">
                                <div style="display: inline-flex; align-items: center; gap: 0.5rem; justify-content: flex-end; width: 100%;">
                                    ${statusText ? `<span class="status-badge ${statusClass}">${statusText}</span>` : ''}
                                    ${magnetBtn}
                                    <button class="icon-btn btn-direct-download" data-idx="${idx}" title="Download .torrent" style="padding:4px;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                const getSortArrow = (col) => {
                    if (torrentCache.sortBy !== col) return '';
                    return torrentCache.sortDir === 1 ? ' ↑' : ' ↓';
                };

                const tableHead = `
                    <thead>
                        <tr>
                            <th class="checkbox-cell"><input type="checkbox" id="select-all-torrents" class="custom-checkbox"></th>
                            <th class="th-sortable" data-sort="ep" style="text-align:center;cursor:pointer;user-select:none;">Ep${getSortArrow('ep')}</th>
                            <th class="th-sortable" data-sort="group" style="cursor:pointer;user-select:none;">Subs${getSortArrow('group')}</th>
                            <th class="th-sortable" data-sort="title" style="cursor:pointer;user-select:none;">Torrent Title${getSortArrow('title')}</th>
                            <th class="th-sortable" data-sort="date" style="cursor:pointer;user-select:none;">Date${getSortArrow('date')}</th>
                            <th class="th-sortable" data-sort="size" style="cursor:pointer;user-select:none;">Size${getSortArrow('size')}</th>
                            <th class="th-sortable" data-sort="seeders" style="cursor:pointer;user-select:none;">Seeds${getSortArrow('seeders')}</th>
                            <th class="th-sortable" data-sort="leechers" style="cursor:pointer;user-select:none;">Leech${getSortArrow('leechers')}</th>
                            <th style="text-align: right; width: 160px;">Actions</th>
                        </tr>
                    </thead>`;

                let html = `<div class="torrents-table-container"><table class="torrents-table">${tableHead}<tbody>`;
                html += renderRows(individual, 0);
                html += `</tbody></table></div>`;

                if (batches.length > 0) {
                    html += `
                        <details class="batch-section" open>
                            <summary class="batch-section-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                Batch / Pack Releases (${batches.length})
                            </summary>
                            <div class="torrents-table-container">
                                <table class="torrents-table">${tableHead}<tbody>
                                ${renderRows(batches, individual.length)}
                                </tbody></table>
                            </div>
                        </details>`;
                }

                resultsContainer.innerHTML = html;

                // Track checked items
                selectedTorrents.clear();
                document.querySelectorAll('.torrent-checkbox').forEach(cb => {
                    if (!cb.disabled && cb.checked) selectedTorrents.add(cb.dataset.idx);
                    cb.addEventListener('change', (e) => {
                        if (e.target.checked) selectedTorrents.add(e.target.dataset.idx);
                        else selectedTorrents.delete(e.target.dataset.idx);
                        updateBatchBar();
                    });
                });
                updateBatchBar();

                // Select-all
                document.getElementById('select-all-torrents')?.addEventListener('change', (e) => {
                    document.querySelectorAll('.torrent-checkbox').forEach(cb => {
                        if (!cb.disabled) {
                            cb.checked = e.target.checked;
                            if (cb.checked) selectedTorrents.add(cb.dataset.idx);
                            else selectedTorrents.delete(cb.dataset.idx);
                        }
                    });
                    updateBatchBar();
                });

                // Header sorting
                document.querySelectorAll('.torrents-table thead th.th-sortable').forEach(th => {
                    th.addEventListener('click', () => {
                        const col = th.dataset.sort;
                        if (torrentCache.sortBy === col) {
                            torrentCache.sortDir *= -1;
                        } else {
                            torrentCache.sortBy = col;
                            torrentCache.sortDir = -1; // Default to descending
                        }
                        renderTorrentTable(torrentCache.items);
                    });
                });

                // Direct download
                document.querySelectorAll('.btn-direct-download').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const idx = e.currentTarget.dataset.idx;
                        const cb  = document.querySelector(`.torrent-checkbox[data-idx="${idx}"]`);
                        if (cb) downloadTorrents([{ url: cb.dataset.url, mediaId: cb.dataset.mediaid, animeTitle: cb.dataset.title }], [idx]);
                    });
                });
            };

            const downloadTorrents = async (items, indices) => {
                const btn = document.getElementById('btn-download-selected');
                if (!btn) return;
                const origText = btn.textContent;
                btn.disabled = true; btn.textContent = 'Downloading...';
                try {
                    const resp = await fetch('/api/nyaa_download', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items })
                    });
                    const result = await resp.json();
                    if (result.success) {
                        indices.forEach(idx => {
                            const row = document.getElementById(`torrent-row-${idx}`);
                            if (!row) return;
                            const cb = row.querySelector('.torrent-checkbox');
                            if (cb) { cb.disabled = true; cb.checked = false; }
                            row.classList.add('row-disabled');
                            const lastCell = row.cells[row.cells.length - 1];
                            if (lastCell) lastCell.innerHTML = '<span class="status-badge downloaded">Downloaded ✓</span>';
                            selectedTorrents.delete(idx.toString());
                        });
                        updateBatchBar();
                        showToast(`Queued ${items.length} torrent${items.length > 1 ? 's' : ''}`);
                    } else { showToast('Failed to queue some torrents', 'error'); }
                } catch (e) { showToast('Network error during download', 'error'); }
                finally { btn.disabled = false; btn.textContent = origText; }
            };

            // Download selected
            document.getElementById('btn-download-selected').addEventListener('click', () => {
                const items = [], indices = [];
                selectedTorrents.forEach(idx => {
                    const cb = document.querySelector(`.torrent-checkbox[data-idx="${idx}"]`);
                    if (cb) { items.push({ url: cb.dataset.url, mediaId: cb.dataset.mediaid, animeTitle: cb.dataset.title }); indices.push(idx); }
                });
                if (items.length) downloadTorrents(items, indices);
            });

            // Scan Recent button
            document.getElementById('btn-scan-airing').addEventListener('click', loadBatchMissing);

            // Select Remaining episodes logic
            document.getElementById('btn-select-remaining')?.addEventListener('click', () => {
                const currentSelections = Array.from(selectedTorrents).map(idx => {
                    const cb = document.querySelector(`.torrent-checkbox[data-idx="${idx}"]`);
                    const row = cb?.closest('tr');
                    return {
                        idx,
                        group: row?.querySelector('.torrent-group')?.textContent.trim(),
                        ep: parseFloat(row?.cells[1]?.textContent.trim() || 0)
                    };
                }).filter(s => s.group);

                if (currentSelections.length === 0) {
                    showToast('First select an episode to define the group and starting point.', 'info');
                    return;
                }

                // Logic: same group, episode > max currently selected
                const targetGroup = currentSelections[0].group;
                const maxEp = Math.max(...currentSelections.map(s => s.ep));
                let count = 0;

                document.querySelectorAll('.torrent-checkbox').forEach(cb => {
                    if (cb.disabled || cb.checked) return;
                    const row = cb.closest('tr');
                    const group = row?.querySelector('.torrent-group')?.textContent.trim();
                    const ep = parseFloat(row?.cells[1]?.textContent.trim() || 0);

                    if (group === targetGroup && ep > maxEp) {
                        cb.checked = true;
                        selectedTorrents.add(cb.dataset.idx);
                        count++;
                    }
                });
                
                if (count > 0) {
                    updateBatchBar();
                    showToast(`Selected ${count} more episodes from ${targetGroup}`);
                } else {
                    showToast(`No newer episodes found for ${targetGroup}`);
                }
            });

            // Search input + Enter button
            const triggerSearch = () => {
                const v = searchInput.value.trim();
                if (v) performSearch(v);
            };
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') triggerSearch();
            });
            document.getElementById('btn-search-go').addEventListener('click', triggerSearch);

            // Filter changes re-run active action
            [tfCategory, tfFilter, tfRes, tfDate, tfAiring].forEach(el => {
                el.addEventListener('change', () => {
                    if (torrentCache.isBatch) loadBatchMissing();
                    else if (torrentCache.query) performSearch(torrentCache.query);
                });
            });

            // Clear buttons functionality
            document.querySelectorAll('.torrents-view .clear-input-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const inputId = btn.dataset.inputId;
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.value = '';
                        input.focus();
                        // If it's a filter, it might trigger search
                        if (inputId === 'tf-group' || inputId === 'tf-episode') {
                            if (torrentCache.isBatch) loadBatchMissing();
                            else if (torrentCache.query) performSearch(torrentCache.query);
                        }
                    }
                });
            });

            // ---- Restore cached results or run new search ----
            if (searchTerm) {
                performSearch(searchTerm);
            } else if (torrentCache.items.length > 0) {
                renderTorrentTable(torrentCache.items);
                if (torrentCache.query) searchInput.value = torrentCache.query;
            }

            return;
        }

        if (filtered.length === 0) {
            animeGrid.innerHTML = `
                <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>No anime found</p>
                </div>
            `;
            return;
        }



        function renderRows(list) {
            return list.map(anime => {
                const title = anime.title?.romaji || anime.title?.english || anime.title?.native || 'Unknown';
                const progress = anime.progress || 0;
                const total = anime.episodes || '?';
                const rawCover = anime.coverImage?.large || anime.coverImage?.medium || '';
                const cover = getCachedImageUrl(rawCover);
                const formatPop = formatPopularity(anime.popularity || 0);
                const score = anime.averageScore ? anime.averageScore + '%' : '-';

                const editIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>`;
                const folderIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`;
                const resumeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;

                const searchIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

                let actionButtons = `
                    <button class="icon-btn btn-open-folder" data-media-id="${anime.mediaId}" title="Open Folder">${folderIcon}</button>
                    <button class="icon-btn btn-search-torrents" data-media-id="${anime.mediaId}" data-title="${escapeHtml(title)}" title="Search Torrents">${searchIcon}</button>
                    <button class="icon-btn edit-btn" data-media-id="${anime.mediaId}" title="Edit Progress">${editIcon}</button>
                `;
                
                if (anime.listStatus === 'COMPLETED') {
                    actionButtons += `
                        <button class="icon-btn btn-resume" data-media-id="${anime.mediaId}" title="Move to In Progress">${resumeIcon}</button>
                    `;
                }

                if (viewMode === 'grid') {
                    return `
                        <div class="anime-card" data-media-id="${anime.mediaId}" style="cursor: pointer;">
                            <div class="anime-card-cover" style="background-image: url('${cover}')">
                                <div class="anime-progress">
                                    <div id="seg-${anime.mediaId}" class="progress-segments"></div>
                                </div>
                            </div>
                            <div class="anime-info">
                                <div class="anime-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
                                <div class="anime-meta">Ep ${progress} / ${total}</div>
                            </div>
                            <div class="card-overlay">
                                <div style="display: flex; gap: 0.25rem; margin-left: auto;">
                                    ${actionButtons}
                                </div>
                            </div>
                        </div>
                    `;
                } else if (viewMode === 'list') {
                    return `
                        <div class="anime-list-item" data-media-id="${anime.mediaId}" style="cursor: pointer;">
                            <img src="${cover}" class="anime-list-cover" alt="cover">
                            <div class="list-info">
                                <div class="list-title">${escapeHtml(title)}</div>
                                <div class="list-meta">
                                    <span>${progress} / ${total}</span>
                                    <span>★ ${score}</span>
                                </div>
                                <div id="seg-${anime.mediaId}" class="progress-segments"></div>
                            </div>
                            <div style="display: flex; gap: 0.25rem; margin-left: auto;">
                                ${actionButtons}
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <tr class="details-row" data-media-id="${anime.mediaId}" style="cursor: pointer;">
                            <td>${escapeHtml(title)}</td>
                            <td>${progress} / ${total}</td>
                            <td>${score}</td>
                            <td>${formatPop}</td>
                            <td>${anime.season || '-'} ${anime.seasonYear || ''}</td>
                            <td>${escapeHtml(anime.studio || '-')}</td>
                            <td style="text-align: right; display: flex; justify-content: flex-end; gap: 0.25rem;">
                                ${actionButtons}
                            </td>
                        </tr>
                    `;
                }
            });
        }

        const rowHtml = renderRows(filtered).join('');

        if (viewMode === 'details') {
            animeGrid.innerHTML = `
                <table class="details-table">
                    <thead>
                        <tr>
                            <th data-sort="title" data-label="Title">Title</th>
                            <th data-sort="progress" data-label="Progress">Progress</th>
                            <th data-sort="score" data-label="Score">Score</th>
                            <th data-sort="popularity" data-label="Popularity">Popularity</th>
                            <th data-sort="season" data-label="Season">Season</th>
                            <th data-sort="studio" data-label="Studio">Studio</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowHtml}
                    </tbody>
                </table>
            `;
            attachDetailsHeaderSorting();
        } else {
            animeGrid.innerHTML = rowHtml;
        }

        // Render segments after DOM update
        filtered.forEach(anime => {
            const container = document.getElementById(`seg-${anime.mediaId}`);
            if (container) {
                renderSegments(container, anime.progress || 0, anime.episodes || 0, false, anime.nextAiringEpisode, anime.mediaId);
            }
        });

        // Attach new action event listeners
        const tableBody = animeGrid.querySelector('tbody') || animeGrid; // If not details view, use animeGrid directly

        tableBody.querySelectorAll('.btn-minus-prog, .btn-plus-prog').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                btn.disabled = true;
                const mediaId = btn.getAttribute('data-media-id');
                const anime = animeList.find(a => a.mediaId == mediaId);
                if (!anime) return;
                
                let newProgress = (anime.progress || 0) + (btn.classList.contains('btn-plus-prog') ? 1 : -1);
                if (newProgress < 0) newProgress = 0;
                
                try {
                    btn.classList.add('loading');
                    const resp = await fetch('/api/update_progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId: parseInt(mediaId, 10), episode: newProgress })
                    });
                    const result = await resp.json();
                    if (result.success) {
                        anime.progress = newProgress;
                        fetchAnimeList(); // Refresh list to get accurate state
                    } else {
                        alert('Failed to update progress.');
                        btn.disabled = false;
                    }
                } catch(e) {
                    btn.disabled = false;
                }
            };
        });

        tableBody.querySelectorAll('.btn-open-folder').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const mediaId = btn.getAttribute('data-media-id');
                fetch('/api/open_folder?mediaId=' + mediaId).catch(console.error);
            };
        });
        
        // Double click handlers for whole rows/cards
        const itemsToBind = tableBody.querySelectorAll('.anime-card, .anime-list-item, .details-row');
        itemsToBind.forEach(item => {
            item.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const mediaId = item.getAttribute('data-media-id');
                if (mediaId) {
                    fetch('/api/open_folder?mediaId=' + mediaId).catch(console.error);
                }
            });
        });


        tableBody.querySelectorAll('.btn-resume').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const mediaId = btn.getAttribute('data-media-id');
                if (confirm("Move this anime back to 'In Progress'?")) {
                    fetch('/api/change_status', {
                        method: 'POST',
                        body: JSON.stringify({ mediaId: parseInt(mediaId), status: 'CURRENT' }),
                        headers: { 'Content-Type': 'application/json' }
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) fetchAnimeList();
                    });
                }
            };
        });

        // Re-attach details events listeners for edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mediaId = btn.dataset.mediaId;
                const anime = animeList.find(a => a.mediaId == mediaId);
                if (anime) {
                    openAnimeDetailsModal(anime);
                }
            });
        });

        // Add event listeners for save buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const mediaId = btn.dataset.mediaId;
                const input = document.querySelector(`#expand-${mediaId} .edit-episode-input`);
                if (input) {
                    const newProgress = parseInt(input.value);
                    if (!Number.isFinite(newProgress) || newProgress < 0) return;
                    const resp = await fetch('/api/update_progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId: parseInt(mediaId, 10), episode: newProgress })
                    });
                    const result = await resp.json();
                    if (result.success) {
                        expandedCard = null;
                        fetchAnimeList();
                        checkStatus();
                    } else {
                        alert('Failed to update progress.');
                    }
                }
            });
        });

        function openAnimeDetailsModal(anime) {
            const title = anime.title?.romaji || anime.title?.english || anime.title?.native || 'Unknown';
            const description = anime.description || 'No description available.';
            const stats = [];
            if (anime.status) stats.push(`<strong>Status:</strong> ${escapeHtml(anime.status)}`);
            if (anime.season && anime.seasonYear) stats.push(`<strong>Season:</strong> ${escapeHtml(anime.season)} ${anime.seasonYear}`);
            if (anime.episodes) stats.push(`<strong>Episodes:</strong> ${anime.episodes}`);
            if (anime.averageScore) stats.push(`<strong>Score:</strong> ${anime.averageScore}%`);
            if (anime.popularity) stats.push(`<strong>Popularity:</strong> ${formatPopularity(anime.popularity)}`);

            modalBody.innerHTML = `
                <h3>${escapeHtml(title)}</h3>
                <div class="modal-meta">${stats.map(s => `<p>${s}</p>`).join('')}</div>
                <p><strong>Description</strong></p>
                <p>${escapeHtml(description)}</p>
                <div class="modal-actions">
                    <label>
                        Set progress:
                        <input type="number" id="modal-progress" value="${anime.progress || 0}" min="0" />
                    </label>
                    <button id="modal-save" class="primary-btn">Save</button>
                </div>
            `;

            document.getElementById('modal-save').addEventListener('click', async () => {
                const newProgress = parseInt(document.getElementById('modal-progress').value, 10);
                if (!Number.isFinite(newProgress) || newProgress < 0) return;
                const resp = await fetch('/api/update_progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mediaId: anime.mediaId, episode: newProgress })
                });
                const result = await resp.json();
                if (result.success) {
                    detailsModal.classList.add('hidden');
                    fetchAnimeList();
                    checkStatus();
                } else {
                    alert('Failed to update progress.');
                }
            });

            detailsModal.classList.remove('hidden');
        }
    }

    // ===== Helpers =====
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    function formatPopularity(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function setSort(column) {
        if (!column) return;
        if (sortBy === column) {
            sortDirection = -sortDirection;
        } else {
            sortBy = column;
            sortDirection = -1;
        }
        if (filterSort) {
            const optionExists = Array.from(filterSort.options).some(opt => opt.value === sortBy);
            if (optionExists) {
                filterSort.value = sortBy;
            }
        }
        renderAnimeGrid();
    }

    function getSortIndicator(column) {
        if (sortBy !== column) return '';
        return sortDirection === 1 ? ' ▲' : ' ▼';
    }

    function attachDetailsHeaderSorting() {
        const headers = document.querySelectorAll('.details-table th[data-sort]');
        headers.forEach(th => {
            const column = th.dataset.sort;
            const label = th.dataset.label || th.textContent;
            th.textContent = label + getSortIndicator(column);
            th.style.cursor = 'pointer';
            th.onclick = () => setSort(column);
        });
    }

    function setActiveTab(tab) {
        activeTab = tab;
        tabCurrent.classList.toggle('active', tab === 'CURRENT');
        tabPlanning.classList.toggle('active', tab === 'PLANNING');
        tabCompleted.classList.toggle('active', tab === 'COMPLETED');
        tabTorrents.classList.toggle('active', tab === 'TORRENTS');
        if (tabLibrary) tabLibrary.classList.toggle('active', tab === 'LIBRARY');
        const tabStats = document.getElementById('tab-stats');
        if (tabStats) tabStats.classList.toggle('active', tab === 'STATS');
        
        const filterBar = document.querySelector('.filter-bar');
        const viewToggles = document.querySelector('.view-toggle-group'); 
        const topDashboard = document.querySelector('.top-dashboard-grid');
        const listHeader = document.querySelector('.anime-list-section .section-header');
        
        if (tab === 'LIBRARY') {
            if (topDashboard) topDashboard.classList.add('hidden');
            if (listHeader) listHeader.classList.add('hidden');
            animeGrid.classList.add('hidden');
            if (libraryContent) libraryContent.classList.remove('hidden');
            if (filterBar) filterBar.classList.add('hidden');
            
            // Hide all view toggles for Library (as only Tree is allowed now)
            if (viewToggles) viewToggles.classList.add('hidden');
            
            const hasData = libraryData && Object.keys(libraryData).length > 0;
            if (hasData) renderLibraryView();
            fetchLibrary(false, hasData);
        } else {
            if (topDashboard) topDashboard.classList.remove('hidden');
            if (listHeader) listHeader.classList.remove('hidden');
            animeGrid.classList.remove('hidden');
            if (libraryContent) libraryContent.classList.add('hidden');
            
            if (filterBar) {
                filterBar.classList.toggle('hidden', (tab === 'TORRENTS' || tab === 'STATS'));
            }
            
            // Show view toggles for main tabs
            if (viewToggles) viewToggles.classList.remove('hidden');
            
            renderAnimeGrid();
        }
    }

    tabCurrent.addEventListener('click', () => setActiveTab('CURRENT'));
    tabPlanning.addEventListener('click', () => setActiveTab('PLANNING'));
    tabCompleted.addEventListener('click', () => setActiveTab('COMPLETED'));
    tabTorrents.addEventListener('click', () => setActiveTab('TORRENTS'));
    if (tabLibrary) tabLibrary.addEventListener('click', () => setActiveTab('LIBRARY'));
    const tabStats = document.getElementById('tab-stats');
    if (tabStats) tabStats.addEventListener('click', () => setActiveTab('STATS'));
    
    // ===== Organize Folders Button =====
    const btnOrganizeFolders = document.getElementById('btn-organize-folders');
    if (btnOrganizeFolders) {
        btnOrganizeFolders.addEventListener('click', async () => {
            const originalText = btnOrganizeFolders.innerHTML;
            btnOrganizeFolders.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> Organizing...';
            btnOrganizeFolders.disabled = true;
            
            try {
                const resp = await fetch('/api/organize_folders', { method: 'POST' });
                const result = await resp.json();
                if (result.success) {
                    if (result.results && result.results.length > 0) {
                        alert(`Organized ${result.results.length} files:\n` + result.results.join('\n'));
                    } else {
                        alert('No loose valid video files were found to organize.');
                    }
                } else {
                    alert('Organization failed. Check logs.');
                }
            } catch (e) {
                alert('Network error reaching tracker agent.');
            }
            
            btnOrganizeFolders.innerHTML = originalText;
            btnOrganizeFolders.disabled = false;
        });
    }

    // ===== Filter Events =====
    filterName.addEventListener('input', () => {
        if (activeTab === 'LIBRARY') renderLibraryView();
        else renderAnimeGrid();
    });
    filterSeason.addEventListener('change', renderAnimeGrid);
    filterYear.addEventListener('input', renderAnimeGrid);
    filterSort.addEventListener('change', (e) => {
        const newSort = e.target.value;
        if (sortBy === newSort) {
            sortDirection = -sortDirection;
        } else {
            sortBy = newSort;
            sortDirection = -1;
        }
        renderAnimeGrid();
    });

    // ===== Refresh Button =====
    btnRefreshList.addEventListener('click', () => {
        if (activeTab === 'LIBRARY') {
            libraryContent.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing library...</p></div>`;
            fetchLibrary(true);
        } else {
            animeGrid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing...</p></div>`;
            fetchAnimeList();
        }
    });

    // ===== Reauthorize Button =====
    btnReauthorize.addEventListener('click', async () => {
        if (confirm('This will open your browser to reauthorize with AniList. Continue?')) {
            try {
                const response = await fetch('/api/reauthorize', { method: 'POST' });
                if (response.ok) {
                    alert('Reauthorization initiated. Check your browser.');
                } else {
                    alert('Failed to initiate reauthorization.');
                }
            } catch (error) {
                console.error('Reauthorization error:', error);
                alert('Network error during reauthorization.');
            }
        }
    });

    // ===== Full Refresh & Clear Cache Button =====
    btnFullRefresh.addEventListener('click', async () => {
        if (confirm('This will clear all cached data and refresh everything. Continue?')) {
            try {
                const response = await fetch('/api/full_refresh', { method: 'POST' });
                if (response.ok) {
                    // Clear local storage
                    localStorage.clear();
                    // Reload the page to reset everything
                    window.location.reload();
                } else {
                    alert('Failed to perform full refresh.');
                }
            } catch (error) {
                console.error('Full refresh error:', error);
                alert('Network error during full refresh.');
            }
        }
    });

    // ===== View Toggle =====
    function setViewMode(mode) {
        viewMode = mode;
        localStorage.setItem('mpvViewMode', viewMode);
        
        if (btnViewGrid) btnViewGrid.classList.toggle('active', mode === 'grid');
        if (btnViewList) btnViewList.classList.toggle('active', mode === 'list' || mode === 'details');
        if (btnViewTree) btnViewTree.classList.toggle('active', mode === 'tree');
        
        if (activeTab === 'LIBRARY') renderLibraryView();
        else renderAnimeGrid();
    }

    if (btnViewGrid) btnViewGrid.addEventListener('click', () => setViewMode('grid'));
    if (btnViewList) btnViewList.addEventListener('click', () => setViewMode('details'));
    if (btnViewTree) btnViewTree.addEventListener('click', () => setViewMode('tree'));
    
    // Set initial active state based on saved mode
    // (Button toggles handled by setViewMode, but we don't want to re-render yet.)
    // Wait for the regular render lifecycle. Just set visuals.
    if (btnViewGrid) btnViewGrid.classList.toggle('active', viewMode === 'grid');
    if (btnViewList) btnViewList.classList.toggle('active', viewMode === 'list' || viewMode === 'details');
    if (btnViewTree) btnViewTree.classList.toggle('active', viewMode === 'tree');

    // ===== Settings Load/Save =====
    async function loadSettings() {
        try {
            const resp = await fetch('/api/settings');
            userSettings = await resp.json();
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }

    function openSettingsModal() {
        if (userSettings) {
            inputSettingGroups.value = userSettings.preferred_groups || '';
            inputSettingResolution.value = userSettings.preferred_resolution || '1080p';
            inputSettingDownloadDir.value = userSettings.default_download_dir || '';
            if (inputSettingBaseAnimeFolder) inputSettingBaseAnimeFolder.value = userSettings.base_anime_folder || '';
        }
        settingsModal.classList.remove('hidden');
    }

    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
    }

    btnSettings.addEventListener('click', openSettingsModal);
    settingsModalOverlay.addEventListener('click', closeSettingsModal);
    settingsModalClose.addEventListener('click', closeSettingsModal);

    settingsSaveBtn.addEventListener('click', async () => {
        const payload = {
            preferred_groups: inputSettingGroups.value,
            preferred_resolution: inputSettingResolution.value,
            default_download_dir: inputSettingDownloadDir.value
        };
        if (inputSettingBaseAnimeFolder) payload.base_anime_folder = inputSettingBaseAnimeFolder.value;

        try {
            settingsSaveBtn.textContent = 'Saving...';
            const resp = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (resp.ok) {
                await loadSettings();
                closeSettingsModal();
            } else {
                alert('Failed to save settings.');
            }
        } catch (e) {
            alert('Error saving settings.');
        } finally {
            settingsSaveBtn.textContent = 'Save Settings';
        }
    });

    // ===== Initial Load =====
    loadSettings();
    checkStatus();
    fetchAnimeList();

    // Global Event Delegation for dynamic torrent search buttons
    document.addEventListener('click', (e) => {
        const torrentBtn = e.target.closest('.btn-search-torrents');
        if (torrentBtn) {
            e.stopPropagation();
            const title = torrentBtn.getAttribute('data-title');
            const mediaId = torrentBtn.getAttribute('data-media-id');
            if (title) {
                activeSearchTerm = title;
                torrentCache.mediaId = mediaId; // Track which anime we are searching
                setActiveTab('TORRENTS');
            }
        }
    });

    const btnSearchNpTorrents = document.getElementById('btn-search-np-torrents');
    if (btnSearchNpTorrents) {
        btnSearchNpTorrents.addEventListener('click', () => {
            if (latestStatus && latestStatus.title) {
                activeSearchTerm = latestStatus.base_title || latestStatus.title;
                torrentCache.mediaId = activeMediaId;
                setActiveTab('TORRENTS');
            }
        });
    }

    if (document.getElementById('btn-open-np-folder')) {
        document.getElementById('btn-open-np-folder').addEventListener('click', () => {
            if (activeMediaId) {
                fetch('/api/open_folder?mediaId=' + activeMediaId).catch(console.error);
            }
        });
    }
    
    // ===== Library Implementation =====
    async function fetchLibrary(forceRefresh = false, silent = false) {
        if (!libraryContent) return;
        
        if (!silent || !libraryData || Object.keys(libraryData).length === 0) {
            libraryContent.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Scanning library folders...</p></div>';
        }
        
        try {
            const resp = await fetch('/api/library' + (forceRefresh ? '?force_refresh=true' : ''));
            const result = await resp.json();
            if (result.success) {
                libraryData = result.data;
                renderLibraryView();
            } else if (!silent) {
                libraryContent.innerHTML = '<div class="empty-state"><p>No library found or scanned yet.</p></div>';
            }
        } catch (e) {
            if (!silent) {
                libraryContent.innerHTML = '<div class="empty-state"><p>Network error scanning library.</p></div>';
            }
        }
    }

    function renderLibraryView() {
        if (!libraryData || !libraryContent) return;
        
        libraryContent.innerHTML = '';
        libraryContent.className = 'library-tree-container';
        
        const root = document.createElement('div');
        root.className = 'tree-root';
        
        function renderNode(node, level = 0) {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'tree-node';
            
            const itemEl = document.createElement('div');
            itemEl.className = 'tree-item';
            itemEl.style.paddingLeft = `${level * 16 + 8}px`;
            
            const chevron = document.createElement('div');
            chevron.className = `tree-chevron ${node.type === 'directory' ? '' : 'leaf'}`;
            chevron.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            
            const icon = document.createElement('div');
            icon.className = 'tree-icon';
            if (node.type === 'directory') {
                icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>';
            } else {
                icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>';
            }
            
            const label = document.createElement('div');
            label.className = 'tree-label';
            label.textContent = node.name;
            if (node.mediaId) {
                 label.style.fontWeight = '700';
                 label.style.color = 'var(--accent)';
                 label.title = 'AniList Matched: ' + node.name;
            }
            
            const meta = document.createElement('div');
            meta.className = 'tree-meta';
            if (node.type === 'file') {
                meta.textContent = formatBytes(node.size);
            } else {
                meta.textContent = `${node.children.length} items`;
            }
            
            const actions = document.createElement('div');
            actions.className = 'tree-actions';
            
            const openFolder = document.createElement('button');
            openFolder.className = 'tree-action-btn';
            openFolder.title = 'Open Folder';
            openFolder.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            openFolder.onclick = (e) => {
                e.stopPropagation();
                fetch('/api/open_folder?path=' + encodeURIComponent(node.path)).catch(console.error);
            };
            actions.appendChild(openFolder);
            
            if (node.type === 'directory') {
                const searchTorrents = document.createElement('button');
                searchTorrents.className = 'tree-action-btn';
                searchTorrents.title = 'Search Torrents';
                searchTorrents.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
                searchTorrents.onclick = (e) => {
                    e.stopPropagation();
                    activeSearchTerm = node.name;
                    setActiveTab('TORRENTS');
                };
                actions.appendChild(searchTorrents);
            }
            
            itemEl.appendChild(chevron);
            itemEl.appendChild(icon);
            itemEl.appendChild(label);
            itemEl.appendChild(meta);
            itemEl.appendChild(actions);
            
            nodeEl.appendChild(itemEl);
            
            if (node.type === 'directory' && node.children) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                
                // Force expand if it's the root or top level children containing matches
                let isExpanded = level === 0;
                if (isExpanded) {
                    chevron.classList.add('expanded');
                    childrenContainer.classList.add('expanded');
                }
                
                chevron.onclick = (e) => {
                    e.stopPropagation();
                    isExpanded = !isExpanded;
                    chevron.classList.toggle('expanded', isExpanded);
                    childrenContainer.classList.toggle('expanded', isExpanded);
                };
                
                itemEl.ondblclick = (e) => {
                    e.stopPropagation();
                    chevron.click();
                };
                
                node.children.forEach(child => {
                    childrenContainer.appendChild(renderNode(child, level + 1));
                });
                nodeEl.appendChild(childrenContainer);
            } else if (node.type === 'file') {
                itemEl.ondblclick = (e) => {
                    e.stopPropagation();
                    fetch('/api/open_folder?path=' + encodeURIComponent(node.path)).catch(console.error);
                };
            }
            
            return nodeEl;
        }
        
        libraryContent.appendChild(renderNode(libraryData, 0));
    }
    
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Poll now-playing every 2 seconds
    setInterval(checkStatus, 2000);

    // Refresh anime list every 60 seconds
    setInterval(fetchAnimeList, 60000);
});
