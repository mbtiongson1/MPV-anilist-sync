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
    
    let userSettings = null;

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
    function renderSegments(container, progress, total, isCurrent, nextAiringEpisode) {
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

        const barHtml = `
            <div class="progress-bar-container">
                <div class="progress-bar-watched" style="width: ${pWatched}%;"></div>
                <div class="progress-bar-available" style="width: ${pAvailable}%;"></div>
            </div>
        `;
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
                    <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); margin-bottom: 0.25rem;">${escapeHtml(title)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Ep ${progress} / ${total}</div>
                </div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
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
                        .sort((a, b) => (a.seasonYear || 0) - (b.seasonYear || 0))
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

                    // Summary
                    const summary = details.description || '';
                    npSummary.textContent = summary.replace(/<[^>]+>/g, '');
                    npSummary.classList.remove('expanded');
                    npSummaryToggle.textContent = 'See more';
                } else {
                    npStats.innerHTML = '';
                    npSummary.textContent = '';
                    npSummaryToggle.style.display = 'none';
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
        if (!baseTitle || animeList.length === 0) {
            npBanner.style.backgroundImage = '';
            npCover.src = '';
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
            const rawCoverUrl = match.coverImage?.large || match.coverImage?.medium || '';
            const rawBannerUrl = match.bannerImage || rawCoverUrl;
            const coverUrl = getCachedImageUrl(rawCoverUrl);
            const bannerUrl = getCachedImageUrl(rawBannerUrl);
            npCover.src = coverUrl;
            npBanner.style.backgroundImage = bannerUrl ? `url(${bannerUrl})` : '';
            npStudio.textContent = match.studio || '';
        } else {
            npBanner.style.backgroundImage = '';
            npCover.src = '';
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
                        const pA = a.episodes && a.episodes > 0 ? (a.progress || 0) / a.episodes : (a.progress === 0 ? 0 : 0.99);
                        const pB = b.episodes && b.episodes > 0 ? (b.progress || 0) / b.episodes : (b.progress === 0 ? 0 : 0.99);
                        cmp = pA - pB;
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
        const filtered = getFilteredList();

        // Update grid class for view mode
        animeGrid.className = `anime-grid ${viewMode}-view`;

        if (activeTab === 'TORRENTS') {
            animeGrid.className = 'anime-grid torrents-view';
            animeGrid.innerHTML = `
                <div class="torrents-header" style="margin-bottom: 20px; text-align: center;">
                    <button id="btn-find-torrents" class="primary-btn" style="font-size: 16px; padding: 12px 24px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 8px; font-weight: 600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Find available episodes
                    </button>
                    <p style="margin-top: 10px; color: #666; font-size: 14px;">Scans your "In Progress" list and finds torrents for the next episodes you need.</p>
                </div>
                <div id="torrents-results"></div>
            `;
            
            document.getElementById('btn-find-torrents').addEventListener('click', async () => {
                if (!userSettings || (!userSettings.preferred_groups && userSettings.default_download_dir === '')) {
                    alert("Please configure your settings first.");
                    openSettingsModal();
                    return;
                }
                
                const resultsContainer = document.getElementById('torrents-results');
                resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Searching Nyaa...</p></div>';
                
                try {
                    const resp = await fetch('/api/nyaa_batch_search');
                    const results = await resp.json();
                    
                    if (results.length === 0) {
                        resultsContainer.innerHTML = '<div class="empty-state"><p>No new episodes found.</p></div>';
                        return;
                    }
                    
                    let html = `
                        <table class="details-table" style="width: 100%; text-align: left; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                            <thead style="background: #fdfaf6;">
                                <tr>
                                    <th>Anime</th>
                                    <th>Ep</th>
                                    <th>Group</th>
                                    <th>Torrent Title</th>
                                    <th>Size</th>
                                    <th>Seeders</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    results.forEach(res => {
                        const t = res.torrent;
                        const shortGroup = t.group !== "Unknown" ? t.group : "";
                        html += `
                            <tr>
                                <td><strong>${escapeHtml(res.animeTitle)}</strong></td>
                                <td>${res.episode}</td>
                                <td><span class="np-badge" style="background:#e0dcd3; color:#433422;">${escapeHtml(shortGroup)}</span></td>
                                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</td>
                                <td>${escapeHtml(t.size)}</td>
                                <td style="color: #4CAF50; font-weight: bold;">${t.seeders}</td>
                                <td>
                                    <button class="primary-btn btn-download-torrent" data-url="${escapeHtml(t.link)}" data-mediaid="${res.mediaId}" style="padding: 6px 12px; font-size: 12px; cursor: pointer;">Download</button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    html += `</tbody></table>`;
                    resultsContainer.innerHTML = html;
                    
                    document.querySelectorAll('.btn-download-torrent').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const btnEl = e.target;
                            btnEl.disabled = true;
                            btnEl.textContent = 'Downloading...';
                            btnEl.style.opacity = '0.7';
                            
                            const url = btnEl.dataset.url;
                            const mediaId = btnEl.dataset.mediaid;
                            
                            try {
                                const resp = await fetch('/api/nyaa_download', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ url, mediaId })
                                });
                                const result = await resp.json();
                                if (result.success) {
                                    btnEl.textContent = 'Downloaded ✓';
                                    btnEl.style.backgroundColor = '#4CAF50';
                                    btnEl.style.color = '#fff';
                                } else {
                                    btnEl.textContent = 'Failed ✗';
                                    btnEl.style.backgroundColor = '#f44336';
                                    btnEl.style.color = '#fff';
                                }
                            } catch (err) {
                                btnEl.textContent = 'Error';
                            }
                        });
                    });
                    
                } catch (e) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>Error searching torrents.</p></div>';
                }
            });
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

        const unwatched = filtered.filter(a => (a.progress || 0) === 0);
        const watched = filtered.filter(a => (a.progress || 0) > 0);

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

                let actionButtons = `
                    <button class="icon-btn btn-open-folder" data-media-id="${anime.mediaId}" title="Open Folder">${folderIcon}</button>
                    <button class="icon-btn edit-btn" data-media-id="${anime.mediaId}" title="Edit Progress">${editIcon}</button>
                `;
                
                if (anime.listStatus === 'COMPLETED') {
                    actionButtons += `
                        <button class="icon-btn btn-resume" data-media-id="${anime.mediaId}" title="Move to In Progress">${resumeIcon}</button>
                    `;
                }

                if (viewMode === 'grid') {
                    return `
                        <div class="anime-card" data-media-id="${anime.mediaId}">
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
                        <div class="anime-list-item" data-media-id="${anime.mediaId}">
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
                        <tr class="details-row" data-media-id="${anime.mediaId}">
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

        const buildSection = (label, list) => {
            const header = viewMode === 'details'
                ? `<tr class="details-section-header"><td colspan="7">${escapeHtml(label)}</td></tr>`
                : `<div class="section-header">${escapeHtml(label)}</div>`;
            return `${header}${renderRows(list).join('')}`;
        };

        const rowHtml = (activeTab === 'CURRENT' && unwatched.length > 0)
            ? `${buildSection('Unwatched', unwatched)}${buildSection('Watching', watched)}`
            : renderRows(filtered).join('');

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
                renderSegments(container, anime.progress || 0, anime.episodes || 0, false, anime.nextAiringEpisode);
            }
        });

        // Attach new action event listeners
        const tableBody = animeGrid.querySelector('tbody') || animeGrid; // If not details view, use animeGrid directly

        tableBody.querySelectorAll('.btn-open-folder').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const mediaId = btn.getAttribute('data-media-id');
                fetch('/api/open_folder?mediaId=' + mediaId).catch(console.error);
            };
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
            sortDirection = 1;
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

    // ===== Tab Switching =====
    function setActiveTab(tab) {
        activeTab = tab;
        tabCurrent.classList.toggle('active', tab === 'CURRENT');
        tabPlanning.classList.toggle('active', tab === 'PLANNING');
        tabCompleted.classList.toggle('active', tab === 'COMPLETED');
        tabTorrents.classList.toggle('active', tab === 'TORRENTS');
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            filterBar.style.display = tab === 'TORRENTS' ? 'none' : 'flex';
        }
        renderAnimeGrid();
    }

    tabCurrent.addEventListener('click', () => setActiveTab('CURRENT'));
    tabPlanning.addEventListener('click', () => setActiveTab('PLANNING'));
    tabCompleted.addEventListener('click', () => setActiveTab('COMPLETED'));
    tabTorrents.addEventListener('click', () => setActiveTab('TORRENTS'));

    // ===== Filter Events =====
    filterName.addEventListener('input', renderAnimeGrid);
    filterSeason.addEventListener('change', renderAnimeGrid);
    filterYear.addEventListener('input', renderAnimeGrid);
    filterSort.addEventListener('change', (e) => {
        const newSort = e.target.value;
        if (sortBy === newSort) {
            sortDirection = -sortDirection;
        } else {
            sortBy = newSort;
            sortDirection = 1;
        }
        renderAnimeGrid();
    });

    // ===== Refresh Button =====
    btnRefreshList.addEventListener('click', () => {
        animeGrid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing...</p></div>`;
        fetchAnimeList();
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
    function updateViewToggleButton() {
        const icons = {
            grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
            list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>',
            details: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M9 4v16"/><path d="M15 4v16"/></svg>'
        };
        btnToggleView.innerHTML = icons[viewMode] || icons.grid;
        btnToggleView.title = `Switch to ${viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'details' : 'grid'} view`;
    }

    btnToggleView.addEventListener('click', () => {
        if (viewMode === 'grid') viewMode = 'list';
        else if (viewMode === 'list') viewMode = 'details';
        else viewMode = 'grid';
        localStorage.setItem('mpvViewMode', viewMode);
        updateViewToggleButton();
        renderAnimeGrid();
    });

    updateViewToggleButton();

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

    if (document.getElementById('btn-open-np-folder')) {
        document.getElementById('btn-open-np-folder').addEventListener('click', () => {
            if (activeMediaId) {
                fetch('/api/open_folder?mediaId=' + activeMediaId).catch(console.error);
            }
        });
    }

    // Poll now-playing every 2 seconds
    setInterval(checkStatus, 2000);

    // Refresh anime list every 60 seconds
    setInterval(fetchAnimeList, 60000);
});
