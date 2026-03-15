document.addEventListener('DOMContentLoaded', () => {
    // ===== Element References =====
    const statusBubble = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const anilistBadge = document.getElementById('anilist-auth-badge');
    const anilistAuthTitle = document.getElementById('anilist-auth-title');
    const anilistAuthSubtitle = document.getElementById('anilist-auth-subtitle');
    const btnAuth = document.getElementById('btn-auth');
    const nowPlaying = document.getElementById('now-playing');
    const idleState = document.getElementById('idle-state');
    const npBanner = document.getElementById('np-banner');
    const npCover = document.getElementById('np-cover');
    const npTitle = document.getElementById('np-title');
    const npStudio = document.getElementById('np-studio');
    const npProgressLabel = document.getElementById('np-progress-label');
    const npProgressSegments = document.getElementById('np-progress-segments');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const btnSync = document.getElementById('btn-sync');
    const animeGrid = document.getElementById('anime-grid');
    const filterName = document.getElementById('filter-name');
    const filterSeason = document.getElementById('filter-season');
    const filterYear = document.getElementById('filter-year');
    const tabCurrent = document.getElementById('tab-current');
    const tabPlanning = document.getElementById('tab-planning');
    const countCurrent = document.getElementById('count-current');
    const countPlanning = document.getElementById('count-planning');
    const btnRefreshList = document.getElementById('btn-refresh-list');

    // ===== State =====
    let animeList = [];
    let activeTab = 'CURRENT';
    let lastNowPlayingTitle = null;
    let authState = {
        hasToken: false,
        authenticated: false,
        error: null,
        user: null,
        authInProgress: false,
        authLastError: null,
    };
    let authWaiting = false;

    // ===== Segment Renderer =====
    function renderSegments(container, progress, total, isCurrent) {
        container.innerHTML = '';
        if (!total || total <= 0) {
            // Unknown total - just show progress count
            const limit = Math.max(progress, 1);
            for (let i = 1; i <= limit; i++) {
                const el = document.createElement('div');
                el.classList.add('segment');
                if (isCurrent && i === progress) {
                    el.classList.add('segment-current');
                } else if (i <= progress) {
                    el.classList.add('segment-watched');
                } else {
                    el.classList.add('segment-unwatched');
                }
                container.appendChild(el);
            }
            return;
        }

        for (let i = 1; i <= total; i++) {
            const el = document.createElement('div');
            el.classList.add('segment');
            if (isCurrent && i === progress) {
                el.classList.add('segment-current');
            } else if (i <= progress) {
                el.classList.add('segment-watched');
            } else {
                el.classList.add('segment-unwatched');
            }
            container.appendChild(el);
        }
    }

    // ===== AniList Auth UI =====
    function updateAuthUI(data) {
        const hasToken = !!data.anilist_has_token;
        const authenticated = !!data.anilist_authenticated;
        const error = data.anilist_error || null;
        const user = data.anilist_user || null;
        const authInProgress = !!data.anilist_auth_in_progress;
        const authLastError = data.anilist_auth_last_error || null;

        authState = { hasToken, authenticated, error, user, authInProgress, authLastError };
        if (authWaiting && !authInProgress && !authenticated) authWaiting = false;

        if (anilistBadge) {
            anilistBadge.classList.remove('ok', 'bad');
            if (authenticated) {
                anilistBadge.classList.add('ok');
            } else if (hasToken || error || authLastError) {
                anilistBadge.classList.add('bad');
            }
        }

        if (!anilistAuthTitle || !anilistAuthSubtitle || !btnAuth) return;

        if (authenticated) {
            const name = user && user.name ? user.name : null;
            anilistAuthTitle.textContent = name ? `AniList connected as ${name}` : 'AniList connected';
            anilistAuthSubtitle.textContent = 'Your list and sync controls are enabled.';
            btnAuth.style.display = 'none';
            authWaiting = false;
            return;
        }

        const waiting = authWaiting || authInProgress;
        btnAuth.style.display = 'inline-flex';
        btnAuth.disabled = waiting;
        btnAuth.textContent = waiting ? 'Waiting...' : (hasToken ? 'Re-authenticate' : 'Authenticate');

        if (waiting) {
            anilistAuthTitle.textContent = 'Awaiting AniList authorization...';
            anilistAuthSubtitle.textContent = 'Complete the browser prompt to finish connecting.';
            return;
        }

        if (!hasToken) {
            anilistAuthTitle.textContent = 'AniList not connected';
            anilistAuthSubtitle.textContent = 'Authenticate to load your list and enable sync.';
            return;
        }

        anilistAuthTitle.textContent = 'AniList token invalid/expired';
        anilistAuthSubtitle.textContent = error || authLastError || 'Authenticate again to refresh your token.';
    }

    async function startAuth() {
        if (!btnAuth) return;
        btnAuth.disabled = true;
        btnAuth.textContent = 'Starting...';
        try {
            const response = await fetch('/api/auth/start', { method: 'POST' });
            const data = await response.json();
            if (
                data
                && data.started === false
                && data.error
                && data.error !== 'Authentication already in progress.'
            ) {
                alert(data.error);
            }
            if (data && data.auth_url) {
                window.open(data.auth_url, '_blank', 'noopener');
            }
            authWaiting = true;
            // Refresh status quickly so UI reflects "waiting" state.
            setTimeout(checkStatus, 400);
        } catch (error) {
            authWaiting = false;
            alert('Failed to start AniList authentication. Check tracker logs.');
        } finally {
            // UI text will be corrected by the next /api/status poll.
            setTimeout(checkStatus, 400);
        }
    }

    if (btnAuth) {
        btnAuth.addEventListener('click', startAuth);
    }

    // ===== Now Playing Status (2s poll) =====
    async function checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();

            const prevAuthed = authState.authenticated;
            updateAuthUI(data);
            if (!prevAuthed && authState.authenticated) {
                fetchAnimeList();
            }

            if (data.running && data.title) {
                statusBubble.className = 'status-bubble online';
                statusText.textContent = 'Running';
                nowPlaying.classList.remove('hidden');
                idleState.classList.add('hidden');

                npTitle.textContent = data.base_title || data.title;

                // Determine total: prefer AniList episode count, then local folder count
                const total = data.anilist_total_episodes || data.total_episodes || 0;
                const watched = data.watched_episodes || 0;
                const anilistProgress = data.anilist_progress || 0;

                const totalStr = total > 0 ? total : '?';
                npProgressLabel.textContent = `E${watched} / ${totalStr}`;
                renderSegments(npProgressSegments, watched, total, true);
                btnSync.disabled = !authState.authenticated;

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
                btnSync.disabled = true;
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
            if (anilistBadge) anilistBadge.classList.remove('ok', 'bad');
            if (anilistAuthTitle) anilistAuthTitle.textContent = 'Tracker disconnected';
            if (anilistAuthSubtitle) anilistAuthSubtitle.textContent = 'Could not reach /api/status.';
            if (btnAuth) btnAuth.disabled = true;
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
            const coverUrl = match.coverImage?.large || match.coverImage?.medium || '';
            const bannerUrl = match.bannerImage || coverUrl;
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
        if (!authState.authenticated) {
            alert('AniList is not authenticated. Click Authenticate first.');
            return;
        }
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

    // ===== Anime List Fetching =====
    async function fetchAnimeList() {
        try {
            const response = await fetch('/api/animelist');
            animeList = await response.json();
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
        countCurrent.textContent = currentCount;
        countPlanning.textContent = planningCount;
    }

    // ===== Filtering =====
    function getFilteredList() {
        const nameQuery = filterName.value.toLowerCase().trim();
        const seasonQuery = filterSeason.value;
        const yearQuery = filterYear.value ? parseInt(filterYear.value) : null;

        return animeList.filter(a => {
            // Status tab filter
            if (a.listStatus !== activeTab) return false;

            // Name filter
            if (nameQuery) {
                const t = a.title || {};
                const titleMatch = [t.romaji, t.english, t.native]
                    .filter(Boolean)
                    .some(name => name.toLowerCase().includes(nameQuery));
                if (!titleMatch) return false;
            }

            // Season filter
            if (seasonQuery && a.season !== seasonQuery) return false;

            // Year filter
            if (yearQuery && a.seasonYear !== yearQuery) return false;

            return true;
        });
    }

    // ===== Rendering =====
    function renderAnimeGrid() {
        if (animeList.length === 0 && !authState.authenticated) {
            animeGrid.innerHTML = `
                <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 18a4 4 0 0 1-8 0c0-2.2 4-2.5 4-4a2 2 0 1 0-4 0"/>
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.4-1 3.6-2 4.6S15 15 15 17"/>
                        <path d="M12 22h.01"/>
                    </svg>
                    <p>Authenticate to load your anime list.</p>
                    <button class="auth-btn" type="button" id="btn-auth-inline">Authenticate</button>
                </div>
            `;
            const inlineBtn = document.getElementById('btn-auth-inline');
            if (inlineBtn) inlineBtn.addEventListener('click', startAuth);
            return;
        }

        const filtered = getFilteredList();

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

        animeGrid.innerHTML = filtered.map(anime => {
            const title = anime.title || {};
            const displayTitle = title.romaji || title.english || title.native || 'Unknown';
            const subtitle = title.english && title.english !== title.romaji ? title.english : '';
            const coverUrl = anime.coverImage?.large || anime.coverImage?.medium || '';
            const progress = anime.progress || 0;
            const totalEps = anime.episodes;
            const progressText = totalEps ? `${progress} / ${totalEps}` : `${progress} / ?`;

            // Build meta tags
            let metaTags = '';
            if (anime.averageScore) {
                metaTags += `<span class="meta-tag score">★ ${anime.averageScore}%</span>`;
            }
            if (anime.popularity) {
                metaTags += `<span class="meta-tag popularity">♥ ${formatPopularity(anime.popularity)}</span>`;
            }
            if (anime.studio) {
                metaTags += `<span class="meta-tag studio">${escapeHtml(anime.studio)}</span>`;
            }
            if (anime.season && anime.seasonYear) {
                const seasonLabel = capitalize(anime.season);
                metaTags += `<span class="meta-tag season-tag">${seasonLabel} ${anime.seasonYear}</span>`;
            }

            // Generate unique ID for segments container
            const segId = `seg-${anime.mediaId}`;

            return `
                <div class="anime-card" title="${escapeHtml(anime.description || '')}">
                    <img class="anime-card-cover" src="${coverUrl}" alt="${escapeHtml(displayTitle)}" loading="lazy" />
                    <div class="anime-card-info">
                        <div class="anime-card-title">${escapeHtml(displayTitle)}</div>
                        ${subtitle ? `<div class="anime-card-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                        <div class="anime-card-meta">${metaTags}</div>
                        <div class="anime-card-progress">
                            <div class="anime-card-progress-text">${progressText}</div>
                            <div class="progress-segments" id="${segId}"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Render segments after DOM update
        filtered.forEach(anime => {
            const container = document.getElementById(`seg-${anime.mediaId}`);
            if (container) {
                renderSegments(container, anime.progress || 0, anime.episodes || 0, false);
            }
        });
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

    // ===== Tab Switching =====
    function setActiveTab(tab) {
        activeTab = tab;
        tabCurrent.classList.toggle('active', tab === 'CURRENT');
        tabPlanning.classList.toggle('active', tab === 'PLANNING');
        renderAnimeGrid();
    }

    tabCurrent.addEventListener('click', () => setActiveTab('CURRENT'));
    tabPlanning.addEventListener('click', () => setActiveTab('PLANNING'));

    // ===== Filter Events =====
    filterName.addEventListener('input', renderAnimeGrid);
    filterSeason.addEventListener('change', renderAnimeGrid);
    filterYear.addEventListener('input', renderAnimeGrid);

    // ===== Refresh Button =====
    btnRefreshList.addEventListener('click', () => {
        animeGrid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing...</p></div>`;
        fetchAnimeList();
    });

    // ===== Initial Load =====
    (async () => {
        await checkStatus();
        await fetchAnimeList();
    })();

    // Poll now-playing every 2 seconds
    setInterval(checkStatus, 2000);

    // Refresh anime list every 60 seconds
    setInterval(fetchAnimeList, 60000);
});
