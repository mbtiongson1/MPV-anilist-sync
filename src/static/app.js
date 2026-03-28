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
    let activeSearchTerm = ""; // to pass search terms to torrents tab

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
                    <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); margin-bottom: 0.25rem;">${escapeHtml(title)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Ep ${progress} / ${total}</div>
                </div>
                <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <button class="icon-btn btn-search-torrents" data-title="${escapeHtml(title)}" style="padding: 0.3rem;" title="Search Torrents">
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
                } else if (a.averageScore && a.averageScore > 0) {
                    // Anilist averageScore: usually 0-100
                    s = a.averageScore;
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
            
            const meanScore = scoreCount > 0 ? (scoreSum / scoreCount / 10).toFixed(1) : 0;
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
            activeSearchTerm = ""; // reset after use
            
            animeGrid.className = 'anime-grid torrents-view';
            animeGrid.innerHTML = `
                <div class="torrents-toolbar">
                    <div class="torrents-search">
                        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" id="torrents-search-input" placeholder="Search Nyaa.si..." value="${escapeHtml(searchTerm)}">
                    </div>
                    <button id="btn-refresh-torrents" class="refresh-btn" title="Refresh/Batch Search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                    </button>
                </div>
                <div id="torrents-results">
                    <div class="loading-state"><div class="spinner"></div><p>Scanning missing episodes...</p></div>
                </div>
                <div id="batch-download-bar" class="batch-download-bar hidden">
                    <div class="info">
                        <span id="batch-count">0 torrents selected</span>
                    </div>
                    <button id="btn-download-selected" class="btn-download-selected">Download Selected</button>
                </div>
            `;

            const resultsContainer = document.getElementById('torrents-results');
            const searchInput = document.getElementById('torrents-search-input');
            const batchBar = document.getElementById('batch-download-bar');
            const batchCountText = document.getElementById('batch-count');
            
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

            const performSearch = async (query) => {
                resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Searching Nyaa...</p></div>';
                selectedTorrents.clear();
                updateBatchBar();
                try {
                    const resp = await fetch(`/api/nyaa_search?q=${encodeURIComponent(query)}`);
                    const results = await resp.json();
                    renderTorrentTable(results.map(r => ({ torrent: r, animeTitle: query })));
                } catch (e) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>Search failed.</p></div>';
                }
            };

            const loadBatchMissing = async () => {
                resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Scanning missing episodes from AniList...</p></div>';
                selectedTorrents.clear();
                updateBatchBar();
                try {
                    const resp = await fetch('/api/nyaa_batch_search');
                    const results = await resp.json();
                    renderTorrentTable(results);
                } catch (e) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>Batch search failed.</p></div>';
                }
            };

            const renderTorrentTable = (items) => {
                if (items.length === 0) {
                    resultsContainer.innerHTML = '<div class="empty-state"><p>No results found.</p></div>';
                    return;
                }

                let html = `
                    <div class="torrents-table-container">
                        <table class="torrents-table">
                            <thead>
                                <tr>
                                    <th class="checkbox-cell"><input type="checkbox" id="select-all-torrents" class="custom-checkbox"></th>
                                    <th>Anime</th>
                                    <th>Ep</th>
                                    <th>Group</th>
                                    <th>Torrent Title</th>
                                    <th>Size</th>
                                    <th>Seeders</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                items.forEach((item, idx) => {
                    const t = item.torrent;
                    const isDisabled = item.is_downloaded || item.is_watched;
                    const statusText = item.is_watched ? 'Watched' : (item.is_downloaded ? 'Downloaded' : '');
                    const statusClass = item.is_watched ? 'watched' : 'downloaded';
                    const rowId = `torrent-row-${idx}`;
                    
                    html += `
                        <tr class="${isDisabled ? 'row-disabled' : ''}" id="${rowId}">
                            <td class="checkbox-cell">
                                <input type="checkbox" class="torrent-checkbox custom-checkbox" 
                                    data-idx="${idx}" 
                                    ${isDisabled ? 'disabled' : 'checked'}
                                    data-url="${escapeHtml(t.link)}"
                                    data-mediaid="${item.mediaId || ''}"
                                    data-title="${escapeHtml(item.animeTitle || '')}">
                            </td>
                            <td><strong>${escapeHtml(item.animeTitle || 'Search Result')}</strong></td>
                            <td style="font-weight:700;">${item.episode || '-'}</td>
                            <td><span class="torrent-group">${escapeHtml(t.group)}</span></td>
                            <td class="torrent-title-cell" title="${escapeHtml(t.title)}">
                                <div class="torrent-title-wrap">${escapeHtml(t.title)}</div>
                            </td>
                            <td>${escapeHtml(t.size)}</td>
                            <td class="torrent-seeders">${t.seeders}</td>
                            <td>
                                ${statusText ? `<span class="status-badge ${statusClass}">${statusText}</span>` : ''}
                                <button class="icon-btn btn-direct-download" data-idx="${idx}" title="Download immediately" style="margin-left: 5px; padding: 4px;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                </button>
                            </td>
                        </tr>
                    `;
                    if (!isDisabled) selectedTorrents.add(idx.toString());
                });

                html += `</tbody></table></div>`;
                resultsContainer.innerHTML = html;
                updateBatchBar();

                document.getElementById('select-all-torrents').addEventListener('change', (e) => {
                    document.querySelectorAll('.torrent-checkbox').forEach(cb => {
                        if (!cb.disabled) {
                            cb.checked = e.target.checked;
                            if (cb.checked) selectedTorrents.add(cb.dataset.idx);
                            else selectedTorrents.delete(cb.dataset.idx);
                        }
                    });
                    updateBatchBar();
                });

                document.querySelectorAll('.torrent-checkbox').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        if (e.target.checked) selectedTorrents.add(e.target.dataset.idx);
                        else selectedTorrents.delete(e.target.dataset.idx);
                        updateBatchBar();
                    });
                });

                document.querySelectorAll('.btn-direct-download').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const idx = e.currentTarget.dataset.idx;
                        const cb = document.querySelector(`.torrent-checkbox[data-idx="${idx}"]`);
                        downloadTorrents([{
                            url: cb.dataset.url,
                            mediaId: cb.dataset.mediaid,
                            animeTitle: cb.dataset.title
                        }], [idx]);
                    });
                });
            };

            const downloadTorrents = async (items, indices) => {
                const btn = document.getElementById('btn-download-selected');
                const originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Downloading...';

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
                            const cb = row.querySelector('.torrent-checkbox');
                            cb.disabled = true;
                            cb.checked = false;
                            row.classList.add('row-disabled');
                            const statusCell = row.cells[7];
 statusCell.innerHTML = '<span class="status-badge downloaded">Downloaded ✓</span>';
                            selectedTorrents.delete(idx.toString());
                        });
                        updateBatchBar();
                        showToast(`Successfully queued ${items.length} torrents`);
                    } else {
                        showToast('Failed to queue some torrents', 'error');
                    }
                } catch (e) {
                    showToast('Network error during download', 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            };

            document.getElementById('btn-download-selected').addEventListener('click', () => {
                const items = [];
                const indices = [];
                selectedTorrents.forEach(idx => {
                    const cb = document.querySelector(`.torrent-checkbox[data-idx="${idx}"]`);
                    items.push({
                        url: cb.dataset.url,
                        mediaId: cb.dataset.mediaid,
                        animeTitle: cb.dataset.title
                    });
                    indices.push(idx);
                });
                downloadTorrents(items, indices);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) performSearch(e.target.value.trim());
            });

            document.getElementById('btn-refresh-torrents').addEventListener('click', loadBatchMissing);

            if (searchTerm) performSearch(searchTerm);
            else loadBatchMissing();
            
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
        const tabStats = document.getElementById('tab-stats');
        if (tabStats) tabStats.classList.toggle('active', tab === 'STATS');
        
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            filterBar.style.display = (tab === 'TORRENTS' || tab === 'STATS') ? 'none' : 'flex';
        }
        renderAnimeGrid();
    }

    tabCurrent.addEventListener('click', () => setActiveTab('CURRENT'));
    tabPlanning.addEventListener('click', () => setActiveTab('PLANNING'));
    tabCompleted.addEventListener('click', () => setActiveTab('COMPLETED'));
    tabTorrents.addEventListener('click', () => setActiveTab('TORRENTS'));
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

    // Global Event Delegation for dynamic torrent search buttons
    document.addEventListener('click', (e) => {
        const torrentBtn = e.target.closest('.btn-search-torrents');
        if (torrentBtn) {
            e.stopPropagation();
            const title = torrentBtn.getAttribute('data-title');
            if (title) {
                activeSearchTerm = title;
                setActiveTab('TORRENTS');
            }
        }
    });

    const btnSearchNpTorrents = document.getElementById('btn-search-np-torrents');
    if (btnSearchNpTorrents) {
        btnSearchNpTorrents.addEventListener('click', () => {
            if (latestStatus && latestStatus.title) {
                activeSearchTerm = latestStatus.base_title || latestStatus.title;
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

    // Poll now-playing every 2 seconds
    setInterval(checkStatus, 2000);

    // Refresh anime list every 60 seconds
    setInterval(fetchAnimeList, 60000);
});
