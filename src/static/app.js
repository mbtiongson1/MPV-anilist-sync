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
    const btnManualOverride = document.getElementById('btn-manual-override');
    const overrideModal = document.getElementById('override-modal');
    const overrideModalClose = document.getElementById('override-modal-close');
    const btnOverrideCancel = document.getElementById('override-cancel');
    const overrideCurrentTitle = document.getElementById('override-current-title');
    const overrideSearch = document.getElementById('override-search');
    const overrideResults = document.getElementById('override-results');
    const npProgressLabel = document.getElementById('np-progress-label');
    const npProgressSegments = document.getElementById('np-progress-segments');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const btnSync = document.getElementById('btn-sync');
    const btnShowInLibrary = document.getElementById('btn-show-in-library');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnPlayNext = document.getElementById('btn-play-next');
    const btnPlayPrev = document.getElementById('btn-play-prev');
    const svgPlay = document.getElementById('svg-play');
    const svgPause = document.getElementById('svg-pause');
    const animeGrid = document.getElementById('anime-grid');
    const filterName = document.getElementById('filter-name');
    const filterSeason = document.getElementById('filter-season');
    const filterYear = document.getElementById('filter-year');
    const filterSort = document.getElementById('filter-sort');
    const tabCurrent = document.getElementById('tab-current');
    const tabPlanning = document.getElementById('tab-planning');
    const tabCompleted = document.getElementById('tab-completed');
    const tabDropped = document.getElementById('tab-dropped');
    const countCurrent = document.getElementById('count-current');
    const countPlanning = document.getElementById('count-planning');
    const countCompleted = document.getElementById('count-completed');
    const countDropped = document.getElementById('count-dropped');

    const statusColors = {
        'CURRENT': '#10b981',   // Emerald Green
        'PLANNING': '#6366f1',  // Indigo Blue
        'COMPLETED': '#f59e0b', // Amber/Gold
        'DROPPED': '#ef4444',   // Rose Red
        'PAUSED': '#94a3b8'     // Slate Gray
    };

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
        'Horror': '#f43f5e',
        'Thriller': '#0f172a',
        'Sports': '#fb923c',
        'Mecha': '#64748b',
        'Mahou Shoujo': '#f472b6',
        'Others': '#fb923c'
    };
    const btnRefreshList = document.getElementById('btn-refresh-list');
    const btnPullAnilist = document.getElementById('btn-pull-anilist');
    const lastSyncedTimeDisp = document.getElementById('last-synced-time');
    const pendingChangesInfo = document.getElementById('pending-changes-info');
    const pendingCountDisp = document.getElementById('pending-count');
    const linkReviewChanges = document.getElementById('link-review-changes');
    const linkResetChanges = document.getElementById('link-reset-changes');

    const btnToggleView = document.getElementById('btn-toggle-view');
    const btnReauthorize = document.getElementById('btn-reauthorize');
    const btnFullRefresh = document.getElementById('btn-full-refresh');
    const btnClearCache = document.getElementById('btn-clear-cache');
    const btnRefreshHeader = document.getElementById('btn-refresh-header');
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
    const inputSettingEnableDragDrop = document.getElementById('setting-enable-drag-drop');
    const inputSettingReduceColors = document.getElementById('setting-reduce-colors');
    const btnResetOverrides = document.getElementById('btn-reset-overrides');
    const npPlayerBadge = document.getElementById('np-player-badge');
    const tabTorrents = document.getElementById('tab-torrents');
    const tabLibrary = document.getElementById('tab-library');
    const libraryContent = document.getElementById('library-tree-container');
    const libraryWrapper = document.getElementById('library-content');
    const inputSettingBaseAnimeFolder = document.getElementById('setting-base-anime-folder');
    const btnCleanupProgress = document.getElementById('btn-cleanup-progress');
    const cleanupModal = document.getElementById('cleanup-modal');
    const cleanupModalOverlay = document.getElementById('cleanup-modal-overlay');
    const cleanupModalClose = document.getElementById('cleanup-modal-close');
    const cleanupCancel = document.getElementById('cleanup-cancel');
    const cleanupNext = document.getElementById('cleanup-next');
    const cleanupConfirm = document.getElementById('cleanup-confirm');
    const cleanupContainer = document.getElementById('cleanup-container');
    const cleanupStep1 = document.getElementById('cleanup-step-1');
    const cleanupStep2 = document.getElementById('cleanup-step-2');
    const cleanupRetentionVal = document.getElementById('cleanup-retention-val');
    const cleanupRetentionUnit = document.getElementById('cleanup-retention-unit');
    const cleanupSelectAll = document.getElementById('cleanup-select-all');
    const cleanupTierFilters = document.getElementById('cleanup-tier-filters');
    const cleanupFormatFilters = document.getElementById('cleanup-format-filters');
    
    // View Buttons
    const btnViewGrid = document.getElementById('btn-view-grid');
    const btnViewList = document.getElementById('btn-view-list');
    const btnViewTree = document.getElementById('btn-view-tree');
    
    // Sidebar Elements
    const appSidebar = document.getElementById('app-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');

    // Selection Bar Elements
    const selectionBar = document.getElementById('selection-bar');
    const selectionCount = document.getElementById('selection-count');
    const btnSelectAll = document.getElementById('btn-select-all');
    const btnSelectNone = document.getElementById('btn-select-none');
    const btnMoveTo = document.getElementById('btn-move-to');
    const moveToDropdown = document.getElementById('move-to-dropdown');
    const btnBulkSync = document.getElementById('btn-bulk-sync');

    // Resume Elements
    const resumeContainer = document.getElementById('resume-container');
    const resumeFilename = document.getElementById('resume-filename');
    const btnResumeLast = document.getElementById('btn-resume-last');
    const btnOpenFolder = document.getElementById('btn-open-folder');

    // Change Log Modal Elements
    const changelogModal = document.getElementById('changelog-modal');
    const changelogModalOverlay = document.getElementById('changelog-modal-overlay');
    const changelogModalClose = document.getElementById('changelog-modal-close');
    const changelogContainer = document.getElementById('changelog-container');
    const btnChangelogCancel = document.getElementById('changelog-cancel');
    const btnChangelogConfirm = document.getElementById('changelog-confirm');

    // Upcoming Elements
    const btnShowUpcoming = document.getElementById('btn-show-upcoming');
    const upcomingOverlay = document.getElementById('upcoming-overlay');
    const btnCloseUpcoming = document.getElementById('btn-close-upcoming');
    const btnRefreshUpcoming = document.getElementById('btn-refresh-upcoming');
    const upcomingGrid = document.getElementById('upcoming-grid');
    const upcomingLoading = document.getElementById('upcoming-loading');

    let upcomingCache = null; // Memory cache for upcoming anime

    // Theme Toggle Initialization
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.checked = true;
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
    const sidebarSettings = document.getElementById('sidebar-settings');
    const btnSettingsHeader = document.getElementById('btn-settings-header');
    const genreFilterList = document.getElementById('genre-filter-list');
    const filterFormat = document.getElementById('filter-format');
    const filterYearSidebar = document.getElementById('filter-year-sidebar');
    const seasonPillsContainer = document.getElementById('season-filter-pills');
    const btnResetFilters = document.getElementById('btn-reset-filters');

    let libraryData = []; // Cached library scanner results
    let libraryExclusions = []; // List of excluded paths

    // ===== State =====
    let animeList = [];
    let currentPagedList = []; // Currently displayed items for range selection
    let selectedAnime = new Set(); // Set of mediaId
    let lastSelectedMediaId = null; // For shift-click range selection
    let pendingApiRequests = []; // Array of { type: string, mediaId: int, data: obj, label: string }
    let activeTab = 'CURRENT';
    let lastNowPlayingTitle = null;
    let currentNpAnime = null;
    let viewMode = 'details';
    let selectedGenres = new Set(); // For sidebar genre filter
    let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) appSidebar.classList.add('collapsed');
    let selectedSidebarSeasons = new Set(['WINTER', 'SPRING', 'SUMMER', 'FALL']);
    let cleanupCandidates = []; // Anime matching retention cutoff

    const getCurrentSeason = () => {
        const month = new Date().getMonth(); // 0-11
        if (month >= 0 && month <= 2) return "WINTER"; // Jan-Mar
        if (month >= 3 && month <= 5) return "SPRING"; // Apr-Jun
        if (month >= 6 && month <= 8) return "SUMMER"; // Jul-Sep
        return "FALL"; // Oct-Dec
    };

    const getSeasonIcon = (season) => {
        switch (season?.toUpperCase()) {
            case 'WINTER': return `<svg class="season-icon winter" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="20" y1="7" x2="4" y2="17"></line><line x1="20" y1="17" x2="4" y2="7"></line><polyline points="9 16 12 19 15 16"></polyline><polyline points="15 8 12 5 9 8"></polyline><polyline points="19 11 20 14 17 16"></polyline><polyline points="5 13 4 10 7 8"></polyline><polyline points="7 16 4 14 5 11"></polyline><polyline points="17 8 20 10 19 13"></polyline></svg>`;
            case 'SPRING': return `<svg class="season-icon spring" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-9-13-9-13S3 8.03 3 13c0 4.97 4.03 9 9 9z"/></svg>`;
            case 'SUMMER': return `<svg class="season-icon summer" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            case 'FALL':   return `<svg class="season-icon fall" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 4c.2 2 .6 3.5-1.1 9.2A7 7 0 0 1 11 20Z"/><path d="M19 4l-5 5"/></svg>`;
            default: return "";
        }
    };

    const getSeasonEndDate = (season, year) => {
        // WINTER: Jan-Mar (end March 31)
        // SPRING: Apr-Jun (end June 30)
        // SUMMER: Jul-Sep (end Sept 30)
        // FALL:   Oct-Dec (end Dec 31)
        if (season === "WINTER") return new Date(year, 2, 31, 23, 59, 59);
        if (season === "SPRING") return new Date(year, 5, 30, 23, 59, 59);
        if (season === "SUMMER") return new Date(year, 8, 30, 23, 59, 59);
        return new Date(year, 11, 31, 23, 59, 59);
    };

    const getTimeRemaining = (endDate) => {
        const now = new Date();
        const diff = endDate - now;
        if (diff <= 0) return null;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days < 1) return "ends today";
        if (days < 7) return `ends in ${days} day${days !== 1 ? 's' : ''}`;
        
        const weeks = Math.ceil(days / 7);
        return `ends in ${weeks} week${weeks !== 1 ? 's' : ''}`;
    };

    /**
     * Returns an array of seasons an anime spans based on its start season and episode count.
     */
    const getAnimeSeasons = (anime) => {
        const startSeason = (anime.season || "").toUpperCase();
        if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(startSeason)) return [];

        const seasonsOrder = ["WINTER", "SPRING", "SUMMER", "FALL"];
        const startIndex = seasonsOrder.indexOf(startSeason);
        
        // Basic heuristic: 1-13 episodes = 1 cour, 14-26 = 2 cours, etc.
        // If episodes is unknown but it's RELEASING, assume at least 2 cours if it's already past the first.
        let cours = 1;
        const totalEps = anime.episodes || 0;
        if (totalEps > 13) cours = 2;
        if (totalEps > 26) cours = 3;
        if (totalEps > 40) cours = 4;
        
        // Override for long running / releasing status if needed
        if (anime.mediaStatus === 'RELEASING' && totalEps === 0) cours = 2;

        const seasons = [];
        for (let i = 0; i < cours; i++) {
            seasons.push(seasonsOrder[(startIndex + i) % 4]);
        }
        return seasons;
    };

    function updateSeasonPillLabels() {
        if (!seasonPillsContainer) return;
        const yearValue = filterYearSidebar.value;
        const isAllYears = !yearValue;
        const selectedYear = parseInt(yearValue) || new Date().getFullYear();
        const now = new Date();
        const currentSeason = getCurrentSeason(); // Logic based on current DATE
        const isCurrentYear = selectedYear === now.getFullYear();
        
        const pills = seasonPillsContainer.querySelectorAll('.season-pill');
        pills.forEach(pill => {
            const season = pill.dataset.season;
            const icon = getSeasonIcon(season);
            
            // Text for the pill: "Season Year" or just "Season"
            const labelText = season.charAt(0) + season.slice(1).toLowerCase();
            const yearDisplay = isAllYears ? "" : ` ${selectedYear}`;
            pill.innerHTML = `${icon}<span>${labelText}${yearDisplay}</span>`;
            
            // Clean up any existing indicator/wrapper logic
            let container = pill.closest('.season-pill-wrapper');
            if (!container) {
                container = document.createElement('div');
                container.className = 'season-pill-wrapper';
                pill.parentNode.insertBefore(container, pill);
                container.appendChild(pill);
            }

            // Remove any existing countdown text
            const oldEndText = container.querySelector('.season-end-text');
            if (oldEndText) oldEndText.remove();
            
            // Only add live indicator and countdown if:
            // 1. It's the current season (WINTER if it's March)
            // 2. The selected year matches the current year
            if (season === currentSeason && isCurrentYear) {
                // Add dot INSIDE the pill
                const dot = document.createElement('div');
                dot.className = 'live-dot';
                dot.style.marginLeft = '0.4rem';
                pill.appendChild(dot);

                const endDate = getSeasonEndDate(season, now.getFullYear());
                const remaining = getTimeRemaining(endDate);
                if (remaining) {
                    const endSpan = document.createElement('span');
                    endSpan.className = 'season-end-text';
                    endSpan.textContent = remaining;
                    container.appendChild(endSpan);
                }
            }
        });
    }

    // Initial labels
    updateSeasonPillLabels();
    
    // persist view mode across reloads
    const savedViewMode = localStorage.getItem('mpvViewMode');
    if (savedViewMode && ['grid', 'list', 'details'].includes(savedViewMode)) {
        viewMode = savedViewMode;
    }
    let expandedCard = null; // mediaId of expanded card
    let sortBy = 'progress'; // 'popularity', 'score', 'title', 'progress', 'season', 'studio'
    let sortDirection = -1; // 1 = asc, -1 = desc
    let activeSearchTerm = ""; // to pass search terms to torrents tab
    let currentPage = 1;
    let itemsPerPage = parseInt(localStorage.getItem('mpvItemsPerPage')) || 20;

    // pagination elements
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const itemsPerPageSelect = document.getElementById('items-per-page');
    const paginationPages = document.getElementById('pagination-pages');

    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
    }

    // ===== Torrent Filter State (persists within session) =====
    let torrentFilters = {
        category: '1_2',
        nyaaFilter: '0',
        resolution: '',
        group: '',
        episode: '',
        airingOnly: false,
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

    // ===== Multi-Select & Review Logic =====
    function toggleSelection(mediaId, skipUiUpdate = false) {
        const idStr = mediaId.toString();
        if (selectedAnime.has(idStr)) {
            selectedAnime.delete(idStr);
        } else {
            selectedAnime.add(idStr);
        }
        
        if (!skipUiUpdate) {
            // Update UI without full re-render for performance
            const items = document.querySelectorAll(`[data-media-id="${idStr}"]`);
            items.forEach(item => {
                if (selectedAnime.has(idStr)) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });

            updateSelectionUI();
        }
        
        lastSelectedMediaId = idStr;
    }

    function updateSelectionUI() {
        const count = selectedAnime.size;
        if (count > 0) {
            selectionBar.classList.remove('hidden');
            selectionCount.textContent = count;
        } else {
            selectionBar.classList.add('hidden');
        }
    }

    function recordApiRequest(type, mediaId, data, label) {
        // Find existing request for same mediaId and type to merge/overwrite
        const existingIdx = pendingApiRequests.findIndex(r => r.mediaId === mediaId && r.type === type);
        const request = { type, mediaId, data, label, timestamp: Date.now() };
        
        if (existingIdx !== -1) {
            pendingApiRequests[existingIdx] = request;
        } else {
            pendingApiRequests.push(request);
        }
        
        updatePendingUI();
    }

    function recordProgressChange(anime, newProgress) {
        if (!anime) return;
        if ((anime.progress || 0) === newProgress) return; // Do not add if no change

        const idInt = parseInt(anime.mediaId, 10);
        const title = anime.title?.romaji || anime.title?.english || 'Anime';
        
        const oldStatus = anime.listStatus;
        let targetStatus = oldStatus;

        // Auto-move COMPLETED to CURRENT if progress decreased below total (or known to be lower)
        if (anime.episodes && newProgress < anime.episodes && oldStatus === 'COMPLETED') {
            targetStatus = 'CURRENT';
        }

        // Record status change if needed
        if (targetStatus !== oldStatus) {
            recordApiRequest('STATUS', idInt, { status: targetStatus }, `${title}: Move to ${targetStatus}`);
            anime.listStatus = targetStatus;
        }

        // Record progress update
        recordApiRequest('PROGRESS', idInt, { episode: newProgress }, `${title}: Set progress to ${newProgress}`);
        anime.progress = newProgress;

        updateCounts();
        renderAnimeGrid(); 
        showToast(`Recorded update for ${title} (Pending Update)`);
    }

    function updatePendingUI() {
        const count = pendingApiRequests.length;
        if (count > 0) {
            pendingChangesInfo.classList.remove('hidden');
            pendingCountDisp.textContent = count;
            btnRefreshList.classList.add('pulse-sync');
        } else {
            pendingChangesInfo.classList.add('hidden');
            btnRefreshList.classList.remove('pulse-sync');
        }
    }

    function moveSelectedTo(newStatus) {
        if (selectedAnime.size === 0) return;
        
        const selectedIds = Array.from(selectedAnime);
        selectedIds.forEach(mediaId => {
            const anime = animeList.find(a => a.mediaId == mediaId);
            if (anime && anime.listStatus !== newStatus) {
                const idInt = parseInt(mediaId);
                const title = anime.title?.romaji || anime.title?.english || 'Anime';
                
                // Record request
                recordApiRequest('STATUS', idInt, { status: newStatus }, `${title}: Move to ${newStatus}`);
                
                // Optimistic UI update
                anime.listStatus = newStatus;
            }
        });
        
        selectedAnime.clear();
        updateSelectionUI();
        updateCounts();
        renderAnimeGrid(); 
        showToast(`Recorded ${selectedIds.length} status changes (Pending Update)`);
    }

    function showReviewModal() {
        if (pendingApiRequests.length === 0) {
            showToast("No pending changes to review.");
            return;
        }

        changelogContainer.innerHTML = '';
        pendingApiRequests.forEach((req, idx) => {
            const item = document.createElement('div');
            item.className = 'changelog-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="changelog-title">${escapeHtml(req.label)}</div>
                    <button class="icon-btn remove-request-btn" data-index="${idx}" title="Remove change">✕</button>
                </div>
                <div class="changelog-detail">Type: ${req.type}</div>
            `;
            changelogContainer.appendChild(item);
        });

        // Add remove listeners
        changelogContainer.querySelectorAll('.remove-request-btn').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(btn.dataset.index);
                pendingApiRequests.splice(idx, 1);
                updatePendingUI();
                if (pendingApiRequests.length === 0) {
                    changelogModal.classList.add('hidden');
                } else {
                    showReviewModal(); // re-render
                }
            };
        });

        const titleEl = document.getElementById('details-modal-title');
        if (titleEl) titleEl.textContent = 'Review Pending Changes'; // Reuse details modal or changelog modal?
        // Actually we have a specific changelog modal
        changelogModal.classList.remove('hidden');
    }

    async function performBulkSync() {
        if (pendingApiRequests.length === 0) return;
        
        btnChangelogConfirm.disabled = true;
        btnChangelogConfirm.textContent = 'Syncing...';

        try {
            for (const req of pendingApiRequests) {
                let url = '';
                if (req.type === 'STATUS') url = '/api/change_status';
                else if (req.type === 'PROGRESS') url = '/api/update_progress';
                else if (req.type === 'TITLE_OVERRIDE') url = '/api/update_title_override';

                if (url) {
                    await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId: req.mediaId, ...req.data })
                    });
                }
            }
            
            showToast(`Successfully pushed ${pendingApiRequests.length} changes to AniList!`);
            pendingApiRequests = [];
            updatePendingUI();
            changelogModal.classList.add('hidden');
            fetchAnimeList(); // Full refresh
        } catch (err) {
            console.error('Push failed:', err);
            showToast('Failed to push some items. Check logs.', 'error');
        } finally {
            btnChangelogConfirm.disabled = false;
            btnChangelogConfirm.textContent = 'Confirm and Sync';
        }
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
        const diff = now - (typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
        if (diff < 60) return 'just now';
        
        const minutes = Math.floor(diff / 60);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        
        const hours = Math.floor(diff / 3600);
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        
        const days = Math.floor(diff / 86400);
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
        
        const weeks = Math.floor(diff / 604800);
        if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
        
        const months = Math.floor(diff / 2592000);
        if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
        
        const years = Math.floor(diff / 31536000);
        return `${years} year${years !== 1 ? 's' : ''} ago`;
    }

    function updateLastSyncedDisplay() {
        if (!lastSyncedTimeDisp) return;
        const lastSync = localStorage.getItem('lastAnilistSync');
        if (lastSync) {
            const relTime = getRelativeTime(Math.floor(parseInt(lastSync) / 1000));
            lastSyncedTimeDisp.textContent = `Last synced: ${relTime}`;
        } else {
            lastSyncedTimeDisp.textContent = '';
        }
    }

    // Call on load
    updateLastSyncedDisplay();
    // Refresh display ogni minuto if visible
    setInterval(() => {
        if (activeTab !== 'STATS' && activeTab !== 'TORRENTS') {
            updateLastSyncedDisplay();
        }
    }, 60000);

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
            let title = anime.title?.romaji || anime.title?.english || 'Unknown';
            if (userSettings && userSettings.title_overrides && userSettings.title_overrides[anime.mediaId]) {
                title = userSettings.title_overrides[anime.mediaId];
            }
            
            const cover = getCachedImageUrl(anime.coverImage?.medium || anime.coverImage?.large || '');
            const progress = anime.progress || 0;
            const total = anime.episodes || '?';
            const status = anime.listStatus || 'CURRENT';

            const el = document.createElement('div');
            el.className = 'recent-anime-item';
            
            const baseColor = statusColors[status] || '#94a3b8';
            const tintColor = baseColor.startsWith('#') ? `${baseColor}15` : 'rgba(255,255,255,0.05)';

            el.style.cssText = `display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem; background: ${tintColor}; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: all 0.2s ease; position: relative;`;
            
            el.onmouseover = () => {
                el.style.background = baseColor.startsWith('#') ? `${baseColor}25` : 'rgba(255,255,255,0.1)';
                el.style.transform = 'translateX(4px)';
            };
            el.onmouseout = () => {
                el.style.background = tintColor;
                el.style.transform = 'translateX(0)';
            };

            const content = document.createElement('div');
            content.style.cssText = 'display: flex; gap: 0.75rem; align-items: center; flex: 1; min-width: 0;';
            content.innerHTML = `
                <img src="${cover}" style="width: 32px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);">
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.1rem; line-height: 1.2;" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span>Ep ${progress} / ${total}</span>
                        <span style="opacity: 0.9; font-weight: 800; font-size: 0.6rem; letter-spacing: 0.02em; color: ${baseColor}; white-space: nowrap;">${status === 'CURRENT' ? 'IN PROGRESS' : status}</span>
                        ${anime.updatedAt ? `<span style="font-size: 0.65rem; opacity: 0.7; color: var(--text-muted);">• ${getRelativeTime(anime.updatedAt)}</span>` : ''}
                    </div>
                </div>
            `;
            
            el.appendChild(content);

            // Only show search if In Progress
            if (status === 'CURRENT') {
                const searchBtn = document.createElement('button');
                searchBtn.className = 'icon-btn btn-search-torrents';
                searchBtn.setAttribute('data-media-id', anime.mediaId);
                searchBtn.setAttribute('data-title', title);
                searchBtn.style.padding = '0.3rem';
                searchBtn.title = 'Search Torrents';
                searchBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
                searchBtn.onclick = (e) => {
                    e.stopPropagation();
                    activeSearchTerm = title;
                    setActiveTab('TORRENTS');
                };
                el.appendChild(searchBtn);
            }

            const openFolderBtn = document.createElement('button');
            openFolderBtn.className = 'icon-btn btn-open-folder';
            openFolderBtn.setAttribute('data-media-id', anime.mediaId);
            openFolderBtn.style.padding = '0.3rem';
            openFolderBtn.title = 'Open folder';
            openFolderBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>';
            openFolderBtn.onclick = (e) => {
                e.stopPropagation();
                fetch('/api/open_folder?mediaId=' + anime.mediaId).catch(console.error);
            };
            el.appendChild(openFolderBtn);

            el.onclick = () => {
                openAnimeDetailsModal(anime);
            };
            listContainer.appendChild(el);
        });

        // Note: folder onclick is already set inline when creating elements above
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
                let displayTitle = data.base_title || data.title;
                const selectedMediaId = data.selected_media_id;
                
                // Apply manual override if exists
                if (selectedMediaId && userSettings && userSettings.title_overrides && userSettings.title_overrides[selectedMediaId]) {
                    displayTitle = userSettings.title_overrides[selectedMediaId];
                }

                // Build link for title (AniList page)
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
                    const seasonContainer = npSeason.closest('.np-season-selector-modern') || npSeason.closest('.np-season-selector');
                    if (seasonContainer) seasonContainer.style.display = 'flex';
                } else {
                    const seasonContainer = npSeason.closest('.np-season-selector-modern') || npSeason.closest('.np-season-selector');
                    if (seasonContainer) seasonContainer.style.display = 'none';
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
                    const summary = (details.description || '').replace(/<[^>]+>/g, '');
                    if (summary) {
                        npSummary.textContent = summary;
                        npSummaryToggle.style.display = (summary.length > 150) ? 'block' : 'none';
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
                    
                    // Fixed background banner
                    if (bannerUrl) {
                        npBanner.style.backgroundImage = `url(${bannerUrl})`;
                    } else {
                        npBanner.style.backgroundImage = '';
                    }

                    // Attach click targets
                    npCover.style.cursor = rawCoverUrl ? 'pointer' : 'default';
                    npCover.onclick = () => { if (rawCoverUrl) window.open(rawCoverUrl, '_blank'); };
                }

                // Media Control States
                if (btnPlayPause) {
                    if (data.paused) {
                        svgPlay.classList.remove('hidden');
                        svgPause.classList.add('hidden');
                    } else {
                        svgPlay.classList.add('hidden');
                        svgPause.classList.remove('hidden');
                    }
                }
                if (btnPlayNext) btnPlayNext.disabled = !data.can_next;
                if (btnPlayPrev) btnPlayPrev.disabled = !data.can_prev;

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
                statusText.textContent = 'Nothing Playing';
                nowPlaying.classList.add('hidden');
                idleState.classList.remove('hidden');
                lastNowPlayingTitle = null;
                // Reset cover/banner
                npBanner.style.backgroundImage = '';
                npCover.src = '';
                npStudio.textContent = '';

                // Handle Resume Button
                if (data.last_played_file) {
                    resumeFilename.textContent = data.last_played_title || 'Last Video';
                    resumeContainer.classList.remove('hidden');
                } else {
                    resumeContainer.classList.add('hidden');
                }
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
        currentNpAnime = null;
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
            currentNpAnime = match;
            // Only update studio if present, do not override valid cover images from status API with empty ones
            npStudio.textContent = match.studio || '';
        } else {
            npStudio.textContent = '';
        }
    }

    // ===== Media Controls =====
    btnPlayPause.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/play_pause');
            const data = await res.json();
            if (data.success) {
                // UI will update on next poll
            }
        } catch (e) { console.error(e); }
    });

    btnPlayNext.addEventListener('click', async () => {
        try {
            await fetch('/api/play_next');
        } catch (e) { console.error(e); }
    });

    btnPlayPrev.addEventListener('click', async () => {
        try {
            await fetch('/api/play_prev');
        } catch (e) { console.error(e); }
    });

    // ===== Show in Library =====
    btnShowInLibrary.addEventListener('click', () => {
        if (!latestStatus || !latestStatus.selected_media_id) return;
        showInLibrary(latestStatus.selected_media_id);
    });

    btnResumeLast.addEventListener('click', async () => {
        try {
            btnResumeLast.disabled = true;
            const res = await fetch('/api/resume');
            const data = await res.json();
            if (data.success) {
                showToast("Opening last played file...", "info");
            } else {
                showToast("Failed to open file. Path may be invalid or not found.", "error");
            }
        } catch (e) {
            console.error('Failed to resume:', e);
            showToast("Error communicating with server", "error");
        } finally {
            btnResumeLast.disabled = false;
        }
    });

    if (btnOpenFolder) {
        btnOpenFolder.addEventListener('click', async () => {
            try {
                btnOpenFolder.disabled = true;
                const res = await fetch('/api/open_folder');
                const data = await res.json();
                if (data.success) {
                    showToast("Opening containing folder...", "info");
                } else {
                    showToast("Failed to open folder.", "error");
                }
            } catch (e) {
                console.error('Failed to open folder:', e);
                showToast("Error opening folder", "error");
            } finally {
                btnOpenFolder.disabled = false;
            }
        });
    }

    async function showInLibrary(mediaId) {
        // 1. Switch tab
        switchTab('LIBRARY');
        
        // 2. Wait for library to load if it's not loaded
        if (libraryData.length === 0) {
            await fetchLibrary();
        }

        // 3. Find the item in the tree
        try {
            const anime = animeList.find(a => a.mediaId == mediaId);
            const title = anime?.title?.romaji || anime?.title?.english;
            
            // Search libraryData for the path
            const treeItems = document.querySelectorAll('.library-item');
            let foundElt = null;
            for (const item of treeItems) {
                const text = item.textContent.toLowerCase();
                if (title && text.includes(title.toLowerCase())) {
                    foundElt = item;
                    break;
                }
            }

            if (foundElt) {
                // Expand parents
                let parent = foundElt.closest('.directory-content');
                while (parent) {
                    const row = parent.previousElementSibling;
                    const toggle = row?.querySelector('.directory-toggle');
                    if (toggle && !toggle.classList.contains('expanded')) {
                        toggle.click();
                    }
                    parent = parent.parentElement.closest('.directory-content');
                }

                // Scroll to and highlight
                foundElt.scrollIntoView({ behavior: 'smooth', block: 'center' });
                foundElt.classList.add('library-item-highlight');
                setTimeout(() => foundElt.classList.remove('library-item-highlight'), 3000);
            }
        } catch (e) { console.error('Show in library failed:', e); }
    }

    // ===== Episode Adjustment =====
    async function adjustEpisode(change) {
        if (currentNpAnime) {
            const newProgress = Math.max(0, (currentNpAnime.progress || 0) + change);
            recordProgressChange(currentNpAnime, newProgress);
        }

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

    // ===== Manual Override Modal =====
    function openOverrideModal() {
        if (!latestStatus || !latestStatus.base_title) {
            showToast('No active video found to map.', 'error');
            return;
        }
        
        overrideCurrentTitle.textContent = latestStatus.base_title;
        overrideSearch.value = '';
        renderOverrideResults(animeList);
        
        overrideModal.classList.remove('hidden');
        setTimeout(() => overrideSearch.focus(), 100);
    }

    function renderOverrideResults(list) {
        overrideResults.innerHTML = '';
        
        const sorted = [...list].sort((a, b) => {
            if (a.listStatus === 'CURRENT' && b.listStatus !== 'CURRENT') return -1;
            if (b.listStatus === 'CURRENT' && a.listStatus !== 'CURRENT') return 1;
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });

        const results = sorted.slice(0, 50);

        if (results.length === 0) {
            overrideResults.innerHTML = '<div style="padding: 10px; color: var(--text-muted); text-align: center;">No anime found.</div>';
            return;
        }

        results.forEach(anime => {
            const title = anime.title?.romaji || anime.title?.english || 'Unknown Title';
            const item = document.createElement('div');
            item.className = 'override-result-item';
            
            item.style.cssText = `
                display: flex; gap: 10px; align-items: center; padding: 8px; 
                background: rgba(255,255,255,0.03); border-radius: 4px; cursor: pointer;
                transition: background 0.2s; border: 1px solid transparent;
            `;
            item.onmouseover = () => { item.style.background = 'rgba(255,255,255,0.08)'; item.style.borderColor = 'var(--accent)'; };
            item.onmouseout = () => { item.style.background = 'rgba(255,255,255,0.03)'; item.style.borderColor = 'transparent'; };

            const statusColor = statusColors[anime.listStatus] || '#ccc';

            item.innerHTML = `
                <img src="${getCachedImageUrl(anime.coverImage?.medium || anime.coverImage?.large)}" style="width: 32px; height: 48px; object-fit: cover; border-radius: 4px;" onerror="this.src=''" />
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                    <span style="font-weight: 500; font-size: 0.9rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(title)}</span>
                    <div style="display: flex; gap: 6px; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                        <span style="font-weight: 700; color: ${statusColor};">${anime.listStatus}</span>
                        <span>• Ep ${anime.progress || 0}/${anime.episodes || '?'}</span>
                    </div>
                </div>
            `;

            item.onclick = async () => {
                if (!latestStatus || !latestStatus.base_title) return;
                
                try {
                    const res = await fetch('/api/update_title_override', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId: anime.mediaId, customTitle: latestStatus.base_title })
                    });
                    
                    if (res.ok) {
                        showToast('Title override saved! Matching...', 'success');
                        overrideModal.classList.add('hidden');
                        checkStatus(); // immediate sync
                        setTimeout(() => checkStatus(), 1500); // backup check
                    } else {
                        showToast('Failed to save override.', 'error');
                    }
                } catch (e) {
                    showToast('Error saving override.', 'error');
                }
            };

            overrideResults.appendChild(item);
        });
    }

    if (btnManualOverride) btnManualOverride.addEventListener('click', openOverrideModal);
    if (overrideModalClose) overrideModalClose.addEventListener('click', () => overrideModal.classList.add('hidden'));
    if (btnOverrideCancel) btnOverrideCancel.addEventListener('click', () => overrideModal.classList.add('hidden'));
    
    if (overrideSearch) {
        overrideSearch.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (!query) {
                renderOverrideResults(animeList);
            } else {
                const filtered = animeList.filter(a => {
                    const tl = (a.title?.romaji || '').toLowerCase();
                    const te = (a.title?.english || '').toLowerCase();
                    const ts = (a.title?.synonyms || []).join(' ').toLowerCase();
                    return fuzzyMatch(query, tl) || fuzzyMatch(query, te) || fuzzyMatch(query, ts) || tl.includes(query) || te.includes(query);
                });
                renderOverrideResults(filtered);
            }
        });
    }

    // ===== Anime List Fetching =====
    async function fetchAnimeList() {
        try {
            const response = await fetch('/api/animelist');
            const data = await response.json();

            // Store sync time
            localStorage.setItem('lastAnilistSync', Date.now());
            updateLastSyncedDisplay();
            
            if (data.error === 'auth_failed') {
                animeGrid.innerHTML = `
                    <div class="empty-state">
                        <p>AniList authentication failed or expired.</p>
                        <button class="primary-btn" onclick="document.getElementById('btn-reauthorize').click()">Reauthorize Now</button>
                    </div>`;
                return;
            }
            
            animeList = data;
            renderGenreFilters(); // Populate sidebar genres
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

    async function fetchUpcomingAnime(forceRefresh = false) {
        if (!upcomingOverlay) return;
        
        // Use memory cache if available and not forcing refresh
        if (!forceRefresh && upcomingCache) {
            renderUpcomingAnime(upcomingCache);
            return;
        }

        const loading = document.getElementById('upcoming-loading');
        if (loading) loading.classList.remove('hidden');

        try {
            const url = forceRefresh ? '/api/upcoming?refresh=true' : '/api/upcoming';
            const response = await fetch(url);
            const data = await response.json();
            upcomingCache = data;
            renderUpcomingAnime(data);
        } catch (err) {
            console.error('Failed to fetch upcoming anime:', err);
            showToast('Failed to fetch upcoming info', 'error');
        } finally {
            if (loading) loading.classList.add('hidden');
        }
    }

    function renderUpcomingAnime(upcomingList) {
        if (!upcomingGrid) return;
        upcomingGrid.innerHTML = '';

        if (!upcomingList || upcomingList.length === 0) {
            upcomingGrid.innerHTML = '<div class="no-results">No upcoming anime found.</div>';
            return;
        }

        upcomingList.forEach(anime => {
            const mediaId = anime.mediaId;
            const title = anime.title?.romaji || anime.title?.english || 'Unknown';
            const cover = getCachedImageUrl(anime.coverImage?.large || anime.coverImage?.medium || '');
            const description = anime.description || 'No description available.';
            const studio = anime.studio || 'Unknown Studio';
            const popularity = anime.popularity || 0;
            const score = anime.averageScore || 0;
            const season = anime.season || '';
            const year = anime.seasonYear || '';
            
            // Check if anime is in current list
            const localEntry = animeList.find(a => a.mediaId === mediaId);
            let statusClass = 'status-not-in-list';
            let statusText = 'Not in list';

            if (localEntry) {
                const status = localEntry.listStatus;
                statusText = status === 'CURRENT' ? 'In Progress' : 
                             status === 'PLANNING' ? 'Planning' : 
                             status === 'COMPLETED' ? 'Completed' : 
                             status === 'DROPPED' ? 'Dropped' : status;
                statusClass = `status-${status.toLowerCase()}`;
            }

            const nextAiring = anime.nextAiringEpisode;
            let airingInfo = '';
            if (nextAiring) {
                const now = Math.floor(Date.now() / 1000);
                const diff = nextAiring.airingAt - now;
                if (diff > 0) {
                    const days = Math.floor(diff / 86400);
                    const hours = Math.floor((diff % 8400) / 3600);
                    if (days > 0) {
                        airingInfo = `Ep ${nextAiring.episode} in ${days}d ${hours}h`;
                    } else {
                        airingInfo = `Ep ${nextAiring.episode} in ${hours}h`;
                    }
                }
            }

            const tile = document.createElement('div');
            tile.className = 'upcoming-tile';
            tile.innerHTML = `
                <div class="upcoming-status-tag ${statusClass}">${statusText}</div>
                <div class="upcoming-add-wrapper">
                    <button class="btn-upcoming-add" data-media-id="${mediaId}" title="Add/Change in list">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <div class="add-dropdown" id="add-dropdown-${mediaId}">
                        <div class="add-option" data-status="PLANNING" data-media-id="${mediaId}">Add to Planning</div>
                        <div class="add-option" data-status="CURRENT" data-media-id="${mediaId}">Add to Watching</div>
                    </div>
                </div>
                <div class="upcoming-tile-cover">
                    <img src="${cover}" alt="${escapeHtml(title)}">
                    ${airingInfo ? `<div class="upcoming-airing-info">${airingInfo}</div>` : ''}
                </div>
                <div class="upcoming-tile-content">
                    <div class="upcoming-tile-header">
                        <div class="upcoming-tile-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
                    </div>
                    <div class="upcoming-tile-meta">
                        <span class="upcoming-badge badge-season">${season} ${year}</span>
                        <span class="upcoming-badge badge-studio">${escapeHtml(studio)}</span>
                    </div>
                    <div class="upcoming-description" id="desc-${mediaId}">${description}</div>
                    <button class="btn-see-more" data-media-id="${mediaId}">See more</button>
                    <div class="upcoming-stats">
                        <div class="upcoming-stat-item" title="Popularity">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            <span>${popularity.toLocaleString()}</span>
                        </div>
                        <div class="upcoming-stat-item" title="Score">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <span>${score}%</span>
                        </div>
                    </div>
                </div>
            `;

            upcomingGrid.appendChild(tile);
        });

        // Add Listeners
        upcomingGrid.querySelectorAll('.btn-see-more').forEach(btn => {
            btn.addEventListener('click', () => {
                const mediaId = btn.dataset.mediaId;
                const desc = document.getElementById(`desc-${mediaId}`);
                if (desc) {
                    desc.classList.toggle('expanded');
                    btn.textContent = desc.classList.contains('expanded') ? 'See less' : 'See more';
                }
            });
        });

        upcomingGrid.querySelectorAll('.btn-upcoming-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mediaId = btn.dataset.mediaId;
                const dropdown = document.getElementById(`add-dropdown-${mediaId}`);
                
                // Close other open dropdowns
                document.querySelectorAll('.add-dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                
                dropdown.classList.toggle('show');
            });
        });

        upcomingGrid.querySelectorAll('.add-option').forEach(opt => {
            opt.addEventListener('click', async (e) => {
                e.stopPropagation();
                const mediaId = parseInt(opt.dataset.mediaId);
                const status = opt.dataset.status;
                const dropdown = opt.closest('.add-dropdown');
                dropdown.classList.remove('show');

                try {
                    const response = await fetch('/api/change_status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId, status })
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast(`Successfully moved to your ${status.toLowerCase()} list!`);
                        // Refresh user list and upcoming view
                        await fetchAnimeList(); 
                        fetchUpcomingAnime(); 
                    } else {
                        showToast('Failed to update list entry', 'error');
                    }
                } catch (err) {
                    console.error('Error updating list:', err);
                    showToast('Error updating list', 'error');
                }
            });
        });
    }

    function updateCounts() {
        const currentCount = animeList.filter(a => a.listStatus === 'CURRENT').length;
        const planningCount = animeList.filter(a => a.listStatus === 'PLANNING').length;
        const completedCount = animeList.filter(a => a.listStatus === 'COMPLETED').length;
        const droppedCount = animeList.filter(a => a.listStatus === 'DROPPED').length;
        if (countCurrent) countCurrent.textContent = currentCount;
        if (countPlanning) countPlanning.textContent = planningCount;
        if (countCompleted) countCompleted.textContent = completedCount;
        if (countDropped) countDropped.textContent = droppedCount;
    }

    // ===== Filtering =====
    function getFilteredList() {
        const nameQuery = filterName.value.toLowerCase().trim();
        const seasonQuery = filterSeason.value;
        const yearQuery = filterYear.value ? parseInt(filterYear.value) : (filterYearSidebar.value ? parseInt(filterYearSidebar.value) : null);
        const formatQuery = filterFormat.value;

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
            if (seasonQuery) {
                if (seasonQuery === 'CURRENT') {
                    if (a.status !== 'RELEASING') return false;
                } else if (a.season !== seasonQuery) {
                    return false;
                }
            } else if (selectedSidebarSeasons.size > 0 && selectedSidebarSeasons.size < 4) {
                // Only filter by sidebar seasons if not all are selected
                if (!a.season || !selectedSidebarSeasons.has(a.season)) {
                    return false;
                }
            }

            // Year filter
            if (yearQuery && a.seasonYear !== yearQuery) return false;
            
            // Format filter
            if (formatQuery && a.format !== formatQuery) return false;
            
            // Genre filter
            if (selectedGenres.size > 0) {
                if (!a.genres || !Array.from(selectedGenres).every(g => a.genres.includes(g))) {
                    return false;
                }
            }

            return true;
        });

        // Global Priority: Move currently playing anime to the front
        if (latestStatus && latestStatus.running && latestStatus.selected_media_id) {
            const playingId = latestStatus.selected_media_id;
            const playingIndex = filtered.findIndex(a => a.mediaId == playingId);
            if (playingIndex !== -1) {
                const playingAnime = filtered.splice(playingIndex, 1)[0];
                filtered.unshift(playingAnime);
            }
        }

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
        if (activeTab === 'LIBRARY') {
            paginationContainer?.classList.add('hidden');
            return;
        }
        
        const filtered = getFilteredList();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // adjust current page if out of bounds
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // stats and torrents view usually don't need pagination or handle it differently
        // but the requirement says "each tab", so let's apply it generally for anime lists
        const isListTab = ['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'].includes(activeTab);

        if (!isListTab) {
            paginationContainer?.classList.add('hidden');
        } else {
            if (totalItems > 0) {
                paginationContainer?.classList.remove('hidden');
                updatePaginationUI(totalItems, totalPages);
            } else {
                paginationContainer?.classList.add('hidden');
            }
        }

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pagedList = isListTab ? filtered.slice(startIdx, startIdx + itemsPerPage) : filtered;
        currentPagedList = pagedList; // Store for selection logic

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
                    
                    const color = genreColors[genre] || '#10B981';
                    bars += `
                        <rect x="${x + 8}" y="${y}" width="${barWidth - 16}" height="${barHeight}" fill="${color}" opacity="0.8" rx="4">
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
                                <rect width="5" height="14" fill="#84cc16" rx="1" />
                                <rect x="6" width="5" height="14" fill="#0ea5e9" rx="1" />
                                <rect x="12" width="5" height="14" fill="#a855f7" rx="1" />
                                <text x="25" y="11" font-size="12" fill="var(--text-primary)" font-weight="600">Genre Frequency</text>
                                <line x1="150" y1="7" x2="185" y2="7" stroke="#FBBF24" stroke-width="3" />
                                <text x="195" y="11" font-size="12" fill="var(--text-primary)" font-weight="600">Cumulative Coverage (%)</text>
                            </g>
                        </g>
                    </svg>
                `;
            }


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
                        Auto Scan
                        <span class="info-icon" title="Automatically scans your planned/watching anime that recently aired to find missing episodes on Nyaa.si" style="display:inline-flex;opacity:0.7;margin-left:2px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </span>
                    </button>
                    <a href="https://nyaa.si/?c=1_2" target="_blank" rel="noopener" class="refresh-btn nyaa-link-btn" title="Open Nyaa.si" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;margin-left:auto;">
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
                            <option value="24h">Past 24h</option>
                            <option value="48h">Past 48h</option>
                            <option value="7d">Past 7 days</option>
                            <option value="30d">Past 30 days</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                            <label class="filter-label">Subs / Group</label>
                            <a id="btn-edit-torrent-prefs" href="#" style="font-size: 0.65rem; color: var(--accent); text-decoration: none; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; transition: color var(--transition);">Edit Default</a>
                        </div>
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
                        <p>Search for an anime, or click <strong>Auto Scan</strong> to find missing episodes.</p>
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
                resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Auto-scanning planned/watching anime for missing episodes...</p></div>';
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
            document.getElementById('btn-edit-torrent-prefs')?.addEventListener('click', (e) => {
                e.preventDefault();
                openSettingsModal();
            });

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
                let title = anime.title?.romaji || anime.title?.english || anime.title?.native || 'Unknown';
                // Check for manual name override
                if (userSettings && userSettings.title_overrides && userSettings.title_overrides[anime.mediaId]) {
                    title = userSettings.title_overrides[anime.mediaId];
                }
                
                const progress = anime.progress || 0;
                const total = anime.episodes || '?';
                const rawCover = anime.coverImage?.large || anime.coverImage?.medium || '';
                const cover = getCachedImageUrl(rawCover);
                const formatPop = formatPopularity(anime.popularity || 0);
                const score = anime.averageScore ? anime.averageScore + '%' : '-';
                const selectedClass = selectedAnime.has(anime.mediaId.toString()) ? 'selected' : '';
                const playingClass = (latestStatus && latestStatus.running && latestStatus.selected_media_id == anime.mediaId) ? 'now-playing-highlight' : '';

                // Seasonal BG Logic
                const seasons = getAnimeSeasons(anime);
                let seasonalClass = "";
                let seasonIconsHtml = "";
                if (seasons.length > 0) {
                    const bgSeasons = seasons.slice(0, 2);
                    seasonalClass = `season-bg-${bgSeasons.join('-').toLowerCase()}`;
                    seasonIconsHtml = seasons.map(s => getSeasonIcon(s)).join('');
                }

                // Live Indicator Logic
                let liveLabel = "";
                if (anime.mediaStatus === 'RELEASING') {
                    let availableBadge = "";
                    if (anime.nextAiringEpisode && anime.nextAiringEpisode.episode) {
                        const currentAired = anime.nextAiringEpisode.episode - 1;
                        const available = currentAired - progress;
                        if (available > 0) {
                            availableBadge = `<span class="available-episodes-badge">+${available}</span>`;
                        }
                    }
                    liveLabel = `
                        <div class="card-live-indicator">
                            <div class="card-live-dot"></div>
                            ${availableBadge}
                        </div>
                    `;
                }

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

                const seasonTag = seasonIconsHtml ? `<div class="card-season-tag">${seasonIconsHtml}</div>` : "";

                if (viewMode === 'grid') {
                    return `
                        <div class="anime-card ${seasonalClass} ${selectedClass} ${playingClass}" data-media-id="${anime.mediaId}" style="cursor: pointer;">
                            ${liveLabel}
                            ${seasonTag}
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
                        <div class="anime-list-item ${seasonalClass} ${selectedClass} ${playingClass}" data-media-id="${anime.mediaId}" style="cursor: pointer;">
                            <img src="${cover}" class="anime-list-cover" alt="cover">
                            ${liveLabel ? liveLabel.replace('card-live-indicator', 'card-live-indicator list-live-indicator') : ''}
                            <div class="list-info">
                                <div class="list-title">
                                    ${escapeHtml(title)}
                                    ${seasonTag.replace('card-season-tag', 'card-season-tag list-season-tag')}
                                </div>
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
                        <tr class="details-row ${seasonalClass} ${selectedClass} ${playingClass}" data-media-id="${anime.mediaId}" style="cursor: pointer;">
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    ${liveLabel ? `<div class="card-live-dot" style="position: static; transform: scale(0.8);"></div>` : ''}
                                    ${escapeHtml(title)}
                                </div>
                            </td>
                            <td>${progress} / ${total} ${anime.mediaStatus === 'RELEASING' && anime.nextAiringEpisode ? (() => {
                                const diff = Math.max(0, (anime.nextAiringEpisode.episode - 1) - progress);
                                const color = diff > 0 ? 'var(--accent)' : 'var(--text-muted)';
                                return `<span style="color:${color}; font-size: 0.7rem; font-weight: 700;">(+${diff})</span>`;
                            })() : ''}</td>
                            <td>${score}</td>
                            <td>${formatPop}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.4rem;">
                                    ${seasonTag.replace('card-season-tag', 'card-season-tag inline-season-tag')}
                                    ${anime.season || '-'} ${anime.seasonYear || ''}
                                </div>
                            </td>
                            <td>${escapeHtml(anime.studio || '-')}</td>
                            <td style="text-align: right; display: flex; justify-content: flex-end; gap: 0.25rem;">
                                ${actionButtons}
                            </td>
                        </tr>
                    `;
                }
            });
        }

        const rowHtml = renderRows(pagedList).join('');

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
        pagedList.forEach(anime => {
            const container = document.getElementById(`seg-${anime.mediaId}`);
            if (container) {
                renderSegments(container, anime.progress || 0, anime.episodes || 0, false, anime.nextAiringEpisode, anime.mediaId);
            }
        });

        // Attach new action event listeners
        const tableBody = animeGrid.querySelector('tbody') || animeGrid; // If not details view, use animeGrid directly

        tableBody.querySelectorAll('.btn-minus-prog, .btn-plus-prog').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const mediaId = btn.getAttribute('data-media-id');
                const anime = animeList.find(a => a.mediaId == mediaId);
                if (!anime) return;
                
                let newProgress = (anime.progress || 0) + (btn.classList.contains('btn-plus-prog') ? 1 : -1);
                if (newProgress < 0) newProgress = 0;
                
                recordProgressChange(anime, newProgress);
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
            // Click to Select
            item.addEventListener('click', (e) => {
                // Ignore if clicking a button inside
                if (e.target.closest('button') || e.target.closest('a')) return;
                
                const mediaId = item.getAttribute('data-media-id');
                if (!mediaId) return;

                if (e.shiftKey && lastSelectedMediaId) {
                    e.preventDefault();
                    // Range selection
                    const allIds = currentPagedList.map(a => a.mediaId.toString());
                    let startIdx = allIds.indexOf(lastSelectedMediaId);
                    const endIdx = allIds.indexOf(mediaId);
                    
                    // If last selection is not on current page, start from index 0
                    if (startIdx === -1) startIdx = 0;

                    if (endIdx !== -1) {
                        const min = Math.min(startIdx, endIdx);
                        const max = Math.max(startIdx, endIdx);
                        
                        // Usually shift-click means "select this range"
                        // We use the state of the target item to decide
                        const isSelecting = !selectedAnime.has(mediaId);
                        
                        for (let i = min; i <= max; i++) {
                            const id = allIds[i];
                            if (isSelecting) selectedAnime.add(id);
                            else selectedAnime.delete(id);
                        }
                        
                        // Update UI for all changed items
                        updateSelectionUI();
                        currentPagedList.forEach(a => {
                            const id = a.mediaId.toString();
                            const items = document.querySelectorAll(`[data-media-id="${id}"]`);
                            items.forEach(el => {
                                if (selectedAnime.has(id)) el.classList.add('selected');
                                else el.classList.remove('selected');
                            });
                        });
                        
                        lastSelectedMediaId = mediaId;
                        return;
                    }
                }
                
                toggleSelection(mediaId);
            });

            item.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const mediaId = item.getAttribute('data-media-id');
                if (mediaId) {
                    fetch('/api/open_folder?mediaId=' + mediaId).catch(console.error);
                }
            });

            // Drag and Drop
            const dragEnabled = userSettings ? userSettings.enable_drag_drop !== false : true;
            if (dragEnabled) {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', (e) => {
                    const mediaId = item.getAttribute('data-media-id');
                    e.dataTransfer.setData('text/plain', mediaId);
                    e.dataTransfer.effectAllowed = 'move';
                    item.classList.add('dragging');
                });
                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                });
            }
        });

        // Initialize Tab Drop Targets (once)
        if (!window.tabDropInitialized) {
            const tabs = document.querySelectorAll('.tab[data-status]');
            tabs.forEach(tab => {
                const targetStatus = tab.getAttribute('data-status');
                if (!['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'].includes(targetStatus)) return;

                tab.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    tab.classList.add('drag-over');
                });

                tab.addEventListener('dragleave', () => {
                    tab.classList.remove('drag-over');
                });

                tab.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    tab.classList.remove('drag-over');
                    const mediaId = e.dataTransfer.getData('text/plain');
                    if (!mediaId) return;

                    const anime = animeList.find(a => a.mediaId == mediaId);
                    if (anime && anime.listStatus !== targetStatus) {
                        const idInt = parseInt(mediaId);
                        const title = anime.title?.romaji || anime.title?.english || 'Anime';
                        
                        // Record request
                        recordApiRequest('STATUS', idInt, { status: targetStatus }, `${title}: Move to ${targetStatus}`);

                        // Optimistic UI update
                        anime.listStatus = targetStatus;
                        updateCounts();
                        renderAnimeGrid(); 
                        showToast(`Recorded move to ${targetStatus} (Pending Update)`);
                    }
                });
            });
            window.tabDropInitialized = true;
        }


        tableBody.querySelectorAll('.btn-resume').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const mediaId = btn.getAttribute('data-media-id');
                const anime = animeList.find(a => a.mediaId == mediaId);
                
                if (anime) {
                    const newProgress = Math.max(0, (anime.progress || 0) - 1);
                    const idInt = parseInt(mediaId);
                    const title = anime.title?.romaji || anime.title?.english || 'Anime';
                    
                    // Record requests
                    recordApiRequest('STATUS', idInt, { status: 'CURRENT' }, `${title}: Move to CURRENT`);
                    recordApiRequest('PROGRESS', idInt, { episode: newProgress }, `${title}: Set progress to ${newProgress}`);

                    // Optimistic update
                    anime.listStatus = 'CURRENT';
                    anime.progress = newProgress;
                    updateCounts();
                    renderAnimeGrid();
                    showToast("Resume recorded (Pending Update)");
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
    }

    function openAnimeDetailsModal(anime) {
        const title = anime.title?.romaji || anime.title?.english || anime.title?.native || 'Unknown';
        const description = anime.description || 'No description available.';
        const cover = getCachedImageUrl(anime.coverImage?.large || anime.coverImage?.medium || '');
        const stats = [];
        if (anime.status) stats.push(`<strong>Status:</strong> ${escapeHtml(anime.status)}`);
        if (anime.season && anime.seasonYear) stats.push(`<strong>Season:</strong> ${escapeHtml(anime.season)} ${anime.seasonYear}`);
        if (anime.episodes) stats.push(`<strong>Episodes:</strong> ${anime.episodes}`);
        if (anime.averageScore) stats.push(`<strong>Score:</strong> ${anime.averageScore}%`);
        if (anime.popularity) stats.push(`<strong>Popularity:</strong> ${formatPopularity(anime.popularity)}`);

        const currentOverride = (userSettings && userSettings.title_overrides) ? userSettings.title_overrides[anime.mediaId] || '' : '';

        modalBody.innerHTML = `
            <div class="details-modal-grid">
                <div class="details-modal-left">
                    <img src="${cover}" alt="cover" class="details-modal-cover" />
                </div>
                <div class="details-modal-right">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="modal-meta">${stats.map(s => `<p>${s}</p>`).join('')}</div>
                    <p><strong>Description</strong></p>
                    <div class="modal-description">${description}</div>
                </div>
            </div>
            <div class="modal-actions" style="flex-direction: column; align-items: flex-start; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 1rem;">
                <div style="width: 100%;">
                    <label style="display: block; font-weight: 600; margin-bottom: 4px;">Local Name Override (folder name):</label>
                    <input type="text" id="modal-name-override" value="${escapeHtml(currentOverride)}" class="filter-input" style="width: 100%; padding: 8px;" placeholder="e.g. My Folder Name" />
                </div>
                <div style="width: 100%;">
                    <label style="display: block; font-weight: 600; margin-bottom: 6px;">Move To:</label>
                    <div id="modal-status-selector" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="status-btn ${anime.listStatus === 'CURRENT' ? 'active' : ''}" data-status="CURRENT" style="--btn-color: var(--status-current)">In Progress</button>
                        <button class="status-btn ${anime.listStatus === 'PLANNING' ? 'active' : ''}" data-status="PLANNING" style="--btn-color: var(--status-planning)">Planning</button>
                        <button class="status-btn ${anime.listStatus === 'COMPLETED' ? 'active' : ''}" data-status="COMPLETED" style="--btn-color: var(--status-completed)">Completed</button>
                        <button class="status-btn ${anime.listStatus === 'DROPPED' ? 'active' : ''}" data-status="DROPPED" style="--btn-color: var(--status-dropped)">Dropped</button>
                        <button class="status-btn ${anime.listStatus === 'PAUSED' ? 'active' : ''}" data-status="PAUSED" style="--btn-color: var(--status-paused)">Paused</button>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center; width: 100%; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label style="font-weight: 600;">Set progress:</label>
                        <div style="display: flex; align-items: center; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; padding: 2px;">
                            <button id="btn-modal-minus" class="icon-btn" style="width: 28px; height: 28px; padding: 0;">-</button>
                            <input type="number" id="modal-progress" value="${anime.progress || 0}" min="0" style="width: 50px; padding: 4px; border: none; background: transparent; text-align: center; color: var(--text-primary); font-family: inherit; font-weight: 600;" />
                            <button id="btn-modal-plus" class="icon-btn" style="width: 28px; height: 28px; padding: 0;">+</button>
                        </div>
                    </div>
                    <button id="modal-save" class="primary-btn">Save Changes</button>
                </div>
            </div>
        `;

        let selectedModalStatus = anime.listStatus;
        document.querySelectorAll('#modal-status-selector .status-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#modal-status-selector .status-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedModalStatus = btn.dataset.status;
            };
        });

        document.getElementById('btn-modal-minus').onclick = () => {
            const input = document.getElementById('modal-progress');
            input.value = Math.max(0, parseInt(input.value || 0) - 1);
        };
        document.getElementById('btn-modal-plus').onclick = () => {
            const input = document.getElementById('modal-progress');
            input.value = parseInt(input.value || 0) + 1;
        };

        document.getElementById('modal-save').addEventListener('click', async () => {
            const newProgress = parseInt(document.getElementById('modal-progress').value, 10);
            const newOverride = document.getElementById('modal-name-override').value.trim();

            if (!Number.isFinite(newProgress) || newProgress < 0) return;

            // Update local cache immediately for speed
            const localAnime = animeList.find(a => a.mediaId === anime.mediaId);
            const animeTitle = anime.title?.romaji || anime.title?.english || 'Anime';
            
            if (localAnime) {
                const oldStatus = localAnime.listStatus;
                const oldProgress = localAnime.progress || 0;
                let targetStatus = selectedModalStatus;

                localAnime.progress = newProgress;
                
                // If progress < total and it was COMPLETED, move to CURRENT
                if (localAnime.episodes && newProgress < localAnime.episodes && oldStatus === 'COMPLETED') {
                    targetStatus = 'CURRENT';
                    localAnime.listStatus = 'CURRENT';
                }

                // Record Title Override if changed - Purely Local Update
                const oldOverride = (userSettings && userSettings.title_overrides) ? userSettings.title_overrides[anime.mediaId] || '' : '';
                if (newOverride !== oldOverride) {
                    // Title override is local-only, save immediately to backend config
                    fetch('/api/update_title_override', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId: anime.mediaId, customTitle: newOverride })
                    }).catch(err => console.error('Failed to save title override:', err));

                    // Update userSettings locally
                    if (!userSettings) userSettings = {};
                    if (!userSettings.title_overrides) userSettings.title_overrides = {};
                    userSettings.title_overrides[anime.mediaId] = newOverride;
                }

                // Record Status change if needed
                if (targetStatus !== oldStatus) {
                    recordApiRequest('STATUS', anime.mediaId, { status: targetStatus }, `${animeTitle}: Move to ${targetStatus}`);
                }

                // Record Progress if changed
                if (newProgress !== oldProgress) {
                    recordApiRequest('PROGRESS', anime.mediaId, { episode: newProgress }, `${animeTitle}: Set progress to ${newProgress}`);
                }

                // Update visuals
                updateCounts();
                renderAnimeGrid();
                detailsModal.classList.add('hidden');
                
                // Only show toast if something was actually added to pending
                if (targetStatus !== oldStatus || newProgress !== oldProgress) {
                    showToast("Changes recorded (Pending Update)");
                } else {
                    showToast("Local changes saved");
                }
            }
        });

        detailsModal.classList.remove('hidden');
    }
    function updatePaginationUI(totalItems, totalPages) {
        if (!paginationContainer) return;

        paginationInfo.textContent = `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`;
        
        btnPrevPage.disabled = currentPage === 1;
        btnNextPage.disabled = currentPage === totalPages || totalPages === 0;

        // Generate page numbers
        if (paginationPages) {
            paginationPages.innerHTML = '';
            
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
            if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
            }

            for (let i = startPage; i <= endPage; i++) {
                const btn = document.createElement('button');
                btn.className = `pagination-page-btn ${i === currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => {
                    currentPage = i;
                    renderAnimeGrid();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                paginationPages.appendChild(btn);
            }
        }
    }

    // Pagination Listeners
    btnPrevPage?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderAnimeGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    btnNextPage?.addEventListener('click', () => {
        const filtered = getFilteredList();
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderAnimeGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    itemsPerPageSelect?.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        localStorage.setItem('mpvItemsPerPage', itemsPerPage);
        currentPage = 1;
        renderAnimeGrid();
    });
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
        currentPage = 1; // Reset to first page when changing tabs
        
        // Sync Top Tabs
        const allTabs = [tabCurrent, tabPlanning, tabCompleted, tabDropped];
        allTabs.forEach(t => {
            if (!t) return;
            const status = t.getAttribute('data-status');
            t.classList.toggle('active', status === tab);
            t.classList.add(`tab-${status}`);
        });

        tabTorrents.classList.toggle('active', tab === 'TORRENTS');
        if (tabLibrary) tabLibrary.classList.toggle('active', tab === 'LIBRARY');
        const tabStats = document.getElementById('tab-stats');
        if (tabStats) tabStats.classList.toggle('active', tab === 'STATS');
        
        // Sync Sidebar Items
        const sidebarItems = document.querySelectorAll('.sidebar-item[data-tab]');
        sidebarItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tab);
        });
        
        const filterBar = document.querySelector('.filter-bar');
        const viewToggles = document.querySelector('.view-toggle-group'); 
        const listHeader = document.querySelector('.anime-list-section .section-header');
        
        if (tab === 'LIBRARY') {
            animeGrid.classList.add('hidden');
            if (libraryWrapper) libraryWrapper.classList.remove('hidden');
            if (filterBar) filterBar.classList.add('hidden');
            
            // Hide all view toggles for Library (as only Tree is allowed now)
            if (viewToggles) viewToggles.classList.add('hidden');
            
            const hasData = libraryData && Object.keys(libraryData).length > 0;
            if (hasData) renderLibraryView();
            fetchLibrary(false, hasData);
        } else {
            animeGrid.classList.remove('hidden');
            if (libraryWrapper) libraryWrapper.classList.add('hidden');
            
            if (filterBar) {
                filterBar.classList.toggle('hidden', (tab === 'TORRENTS' || tab === 'STATS'));
            }
            
            // Show view toggles for main tabs
            if (viewToggles) viewToggles.classList.remove('hidden');

            if (btnCleanupProgress) {
                if (tab === 'CURRENT') {
                    btnCleanupProgress.style.display = 'inline-flex';
                } else {
                    btnCleanupProgress.style.display = 'none';
                }
            }
            
            renderAnimeGrid();
        }
    }

    tabCurrent.addEventListener('click', () => setActiveTab('CURRENT'));
    tabPlanning.addEventListener('click', () => setActiveTab('PLANNING'));
    tabCompleted.addEventListener('click', () => setActiveTab('COMPLETED'));
    tabTorrents.addEventListener('click', () => setActiveTab('TORRENTS'));
    if (tabDropped) tabDropped.addEventListener('click', () => setActiveTab('DROPPED'));
    if (tabLibrary) tabLibrary.addEventListener('click', () => setActiveTab('LIBRARY'));
    const tabStats = document.getElementById('tab-stats');
    if (tabStats) tabStats.addEventListener('click', () => setActiveTab('STATS'));
    
    // Sidebar Nav Handlers
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            if (tab) setActiveTab(tab);
        });
    });

    if (sidebarToggle && appSidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebarCollapsed = !sidebarCollapsed;
            appSidebar.classList.toggle('collapsed', sidebarCollapsed);
            const toggleIcon = document.getElementById('sidebar-toggle-icon');
            if (toggleIcon) {
                if (sidebarCollapsed) {
                    toggleIcon.innerHTML = '<polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline>';
                } else {
                    toggleIcon.innerHTML = '<polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline>';
                }
            }
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
        });
    }

    if (sidebarSettings) {
        sidebarSettings.addEventListener('click', openSettingsModal);
    }
    
    if (btnSettingsHeader) {
        btnSettingsHeader.addEventListener('click', openSettingsModal);
    }

    const btnProfile = document.getElementById('btn-profile');
    if (btnProfile) {
        btnProfile.addEventListener('click', async () => {
            try {
                // We can use get_authenticated_user to find the ID, but the client already handles the token.
                // For simplicity, we can fetch the user details from AniList or just redirect to anilist.co/home.
                // However, users usually want their specific profile.
                const resp = await fetch('/api/user');
                const user = await resp.json();
                if (user && user.name) {
                    window.open(`https://anilist.co/user/${user.name}`, '_blank');
                } else {
                    window.open('https://anilist.co/home', '_blank');
                }
            } catch (err) {
                window.open('https://anilist.co/home', '_blank');
            }
        });
    }

    // Upcoming Event Listeners
    if (btnShowUpcoming) {
        btnShowUpcoming.onclick = () => {
            upcomingOverlay.classList.remove('hidden');
            fetchUpcomingAnime();
        };
    }

    if (btnCloseUpcoming) {
        btnCloseUpcoming.onclick = () => {
            upcomingOverlay.classList.add('hidden');
        };
    }

    if (btnRefreshUpcoming) {
        btnRefreshUpcoming.onclick = () => {
            fetchUpcomingAnime(true);
        };
    }

    // Sidebar Filter Handlers
    if (filterFormat) {
        filterFormat.addEventListener('change', () => renderAnimeGrid());
    }

    if (filterYearSidebar && filterYear) {
        filterYearSidebar.addEventListener('change', () => {
            filterYear.value = filterYearSidebar.value;
            updateSeasonPillLabels(); // Update labels when year changes
            renderAnimeGrid();
        });
        // Initial sync if default is set
        if (filterYearSidebar.value) {
            filterYear.value = filterYearSidebar.value;
            updateSeasonPillLabels();
        }
    }

    if (seasonPillsContainer) {
        const pills = seasonPillsContainer.querySelectorAll('.season-pill');
        
        // Initialize active state
        pills.forEach(pill => {
            const season = pill.dataset.season;
            if (selectedSidebarSeasons.has(season)) {
                pill.classList.add('active');
            }
        });

        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                const season = pill.dataset.season;
                if (selectedSidebarSeasons.has(season)) {
                    // Only remove if it's not the last one? 
                    // Actually, allow empty selection, which getFilteredList handles as "All" if 0 or 4.
                    selectedSidebarSeasons.delete(season);
                    pill.classList.remove('active');
                } else {
                    selectedSidebarSeasons.add(season);
                    pill.classList.add('active');
                }
                renderAnimeGrid();
            });
        });
    }

    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            // Reset all sidebar filters
            if (filterFormat) filterFormat.value = "";
            if (filterYearSidebar) filterYearSidebar.value = "";
            if (filterYear) filterYear.value = "";
            
            selectedGenres.clear();
            const genreCheckboxes = genreFilterList.querySelectorAll('input[type="checkbox"]');
            genreCheckboxes.forEach(cb => cb.checked = false);

            selectedSidebarSeasons = new Set(['WINTER', 'SPRING', 'SUMMER', 'FALL']);
            const pills = seasonPillsContainer.querySelectorAll('.season-pill');
            pills.forEach(pill => pill.classList.add('active'));

            renderAnimeGrid();
            showToast("Filters reset to default");
        });
    }

    // Clear Search Logic
    const btnClearSearch = document.getElementById('btn-clear-search');
    const updateClearSearchVisibility = () => {
        if (btnClearSearch) {
            if (filterName.value) btnClearSearch.classList.remove('hidden');
            else btnClearSearch.classList.add('hidden');
        }
    };

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            filterName.value = '';
            updateClearSearchVisibility();
            if (activeTab === 'LIBRARY') renderLibraryView();
            else renderAnimeGrid();
            filterName.focus();
        });
        updateClearSearchVisibility();
    }

    const btnClearLibrarySearch = document.getElementById('btn-clear-library-search');
    const librarySearchInput = document.getElementById('library-search-input');
    const updateClearLibrarySearchVisibility = () => {
        if (btnClearLibrarySearch && librarySearchInput) {
            if (librarySearchInput.value) btnClearLibrarySearch.classList.remove('hidden');
            else btnClearLibrarySearch.classList.add('hidden');
        }
    };

    if (btnClearLibrarySearch && librarySearchInput) {
        btnClearLibrarySearch.addEventListener('click', () => {
            librarySearchInput.value = '';
            librarySearchTerm = '';
            updateClearLibrarySearchVisibility();
            renderLibraryView();
            librarySearchInput.focus();
        });
        updateClearLibrarySearchVisibility();
    }

    function renderGenreFilters() {
        if (!genreFilterList) return;
        
        // Get all unique genres from the current anime list
        const genres = new Set();
        animeList.forEach(a => {
            if (a.genres) a.genres.forEach(g => genres.add(g));
        });

        // Filter out adult genres for the sidebar filter too
        const ignored = ['Ecchi', 'Hentai', 'Adult'];
        const sortedGenres = Array.from(genres)
            .filter(g => !ignored.includes(g))
            .sort();

        genreFilterList.innerHTML = '';
        sortedGenres.forEach(genre => {
            const chip = document.createElement('div');
            const color = genreColors[genre] || '#94a3b8';
            chip.className = 'genre-chip-sidebar';
            chip.style.borderColor = color;
            chip.style.color = color;
            chip.style.background = color + '10'; // very faint background
            if (selectedGenres.has(genre)) {
                chip.classList.add('active');
                chip.style.background = color;
                chip.style.color = 'white';
            }
            chip.textContent = genre;
            chip.onclick = () => {
                if (selectedGenres.has(genre)) {
                    selectedGenres.delete(genre);
                    chip.classList.remove('active');
                    chip.style.background = color + '10';
                    chip.style.color = color;
                } else {
                    selectedGenres.add(genre);
                    chip.classList.add('active');
                    chip.style.background = color;
                    chip.style.color = 'white';
                }
                renderAnimeGrid();
            };
            genreFilterList.appendChild(chip);
        });
    }
    
    // ===== Library Header Actions =====
    let librarySearchTerm = '';
    const btnRefreshLibrary = document.getElementById('btn-refresh-library');
    if (btnRefreshLibrary) {
        btnRefreshLibrary.addEventListener('click', () => {
            libraryContent.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Refreshing library...</p></div>';
            fetchLibrary(true);
        });
    }

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', (e) => {
            librarySearchTerm = e.target.value.toLowerCase();
            updateClearLibrarySearchVisibility();
            renderLibraryView();
        });
    }

    const linkEditPath = document.getElementById('link-edit-path');
    if (linkEditPath) {
        linkEditPath.addEventListener('click', (e) => {
            e.preventDefault();
            openSettingsModal();
            if (inputSettingBaseAnimeFolder) {
                inputSettingBaseAnimeFolder.focus();
                inputSettingBaseAnimeFolder.style.boxShadow = '0 0 0 2px var(--accent)';
                setTimeout(() => {
                    inputSettingBaseAnimeFolder.style.boxShadow = '';
                }, 2000);
            }
        });
    }
    
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
                        fetchLibrary(true);
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
        updateClearSearchVisibility();
        if (activeTab === 'LIBRARY') renderLibraryView();
        else renderAnimeGrid();
    });
    filterSeason.addEventListener('change', () => {
        if (filterSeasonSidebar) filterSeasonSidebar.value = filterSeason.value;
        renderAnimeGrid();
    });
    filterYear.addEventListener('input', () => {
        if (filterYearSidebar) filterYearSidebar.value = filterYear.value;
        renderAnimeGrid();
    });
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

    // ===== Pull from AniList Button =====
    if (btnPullAnilist) {
        btnPullAnilist.addEventListener('click', async () => {
            if (confirm("Download latest list from AniList? This will overwrite any unsynced local changes (dragged items, progress edits).")) {
                const originalHtml = btnPullAnilist.innerHTML;
                btnPullAnilist.disabled = true;
                btnPullAnilist.classList.add('syncing');
                if (btnPullAnilist.querySelector('span')) btnPullAnilist.querySelector('span').textContent = 'Pulling...';

                try {
                    animeGrid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Pulling latest from AniList...</p></div>`;
                    // Clear pending changes as we are overwriting
                    pendingApiRequests = [];
                    updatePendingUI();
                    btnBulkSync.classList.remove('pulse-sync');
                    await fetchAnimeList();
                    showToast("Pulled latest list from AniList");
                } finally {
                    btnPullAnilist.disabled = false;
                    btnPullAnilist.classList.remove('syncing');
                    btnPullAnilist.innerHTML = originalHtml;
                }
            }
        });
    }

    // ===== Update to AniList Button =====
    btnRefreshList.addEventListener('click', async () => {
        if (!confirm("Upload all local changes to AniList? This will sync your progress and status updates.")) return;

        const originalHtml = btnRefreshList.innerHTML;
        btnRefreshList.disabled = true;
        btnRefreshList.classList.add('syncing');

        if (btnRefreshList.querySelector('span')) {
            btnRefreshList.querySelector('span').textContent = 'Updating...';
        }

        const restoreButton = () => {
            btnRefreshList.disabled = false;
            btnRefreshList.classList.remove('syncing');
            btnRefreshList.innerHTML = originalHtml;
        };

        if (activeTab === 'LIBRARY') {
            libraryContent.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing library...</p></div>`;
            fetchLibrary(true).finally(restoreButton);
        } else {
            // First perform any pending bulk changes
            if (pendingApiRequests.length > 0) {
                try {
                    await performBulkSync();
                } catch (e) {
                    console.error("Bulk sync failed during global update:", e);
                }
            }
            
            animeGrid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Syncing changes...</p></div>`;
            fetchAnimeList().finally(restoreButton);
        }
    });

    if (btnRefreshHeader) {
        btnRefreshHeader.addEventListener('click', () => {
            if (activeTab === 'LIBRARY') {
                libraryContent.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing library...</p></div>`;
                fetchLibrary(true);
            } else {
                animeGrid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Refreshing...</p></div>`;
                fetchAnimeList();
            }
            checkStatus(); // Also check status when refreshing from header
        });
    }

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
        if (confirm('This will clear your current session and re-fetch your anime list. Continue?')) {
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

    if (btnClearCache) {
        btnClearCache.addEventListener('click', async () => {
            if (confirm('This will clear the library and image cache. The next load will be slower as it re-scans your files. Continue?')) {
                try {
                    const response = await fetch('/api/clear_cache', { method: 'POST' });
                    if (response.ok) {
                        alert('Cache cleared successfully.');
                        window.location.reload();
                    } else {
                        alert('Failed to clear cache.');
                    }
                } catch (error) {
                    console.error('Clear cache error:', error);
                    alert('Network error during cache clear.');
                }
            }
        });
    }

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
            applySettingsToUI();
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }

    function applySettingsToUI() {
        if (userSettings && userSettings.reduce_colors) {
            document.body.classList.add('reduce-colors');
        } else {
            document.body.classList.remove('reduce-colors');
        }
        
        if (btnCleanupProgress) {
            if (activeTab === 'CURRENT') {
                btnCleanupProgress.style.display = 'inline-flex';
            } else {
                btnCleanupProgress.style.display = 'none';
            }
        }
    }

    function openSettingsModal() {
        if (userSettings) {
            inputSettingGroups.value = userSettings.preferred_groups || '';
            inputSettingResolution.value = userSettings.preferred_resolution || '1080p';
            inputSettingDownloadDir.value = userSettings.default_download_dir || '';
            if (inputSettingBaseAnimeFolder) inputSettingBaseAnimeFolder.value = userSettings.base_anime_folder || '';
            if (inputSettingEnableDragDrop) inputSettingEnableDragDrop.checked = userSettings.enable_drag_drop !== false;
            if (inputSettingReduceColors) inputSettingReduceColors.checked = userSettings.reduce_colors === true;
        }
        settingsModal.classList.remove('hidden');
    }

    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
    }

    if (btnSettings) btnSettings.addEventListener('click', openSettingsModal);
    settingsModalOverlay.addEventListener('click', closeSettingsModal);
    settingsModalClose.addEventListener('click', closeSettingsModal);

    settingsSaveBtn.addEventListener('click', async () => {
        const payload = {
            preferred_groups: inputSettingGroups.value,
            preferred_resolution: inputSettingResolution.value,
            default_download_dir: inputSettingDownloadDir.value,
            enable_drag_drop: inputSettingEnableDragDrop ? inputSettingEnableDragDrop.checked : true,
            reduce_colors: inputSettingReduceColors ? inputSettingReduceColors.checked : false
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
                const oldPath = userSettings ? userSettings.base_anime_folder : '';
                await loadSettings();
                closeSettingsModal();
                if (activeTab === 'LIBRARY' || (userSettings && userSettings.base_anime_folder !== oldPath)) {
                    fetchLibrary(true);
                }
            } else {
                alert('Failed to save settings.');
            }
        } catch (e) {
            console.error('Settings save error:', e);
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

        // Fetch exclusions too
        try {
            const exclResp = await fetch('/api/library/exclusions');
            libraryExclusions = await exclResp.json();
        } catch (e) { console.error('Error fetching exclusions:', e); }
        
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
            console.error('Error rendering/fetching library:', e);
            if (!silent) {
                libraryContent.innerHTML = '<div class="empty-state"><p>Network error scanning library.</p></div>';
            }
        }
    }

    async function openSearchPopup(suggestedName) {
        modalBody.innerHTML = `
            <div class="search-popup">
                <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">Search AniList to match this folder:</p>
                <div style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <label style="font-size: 0.7rem; color: var(--text-muted);">Local Name Override (folder name)</label>
                    <input type="text" id="popup-name-override" value="${escapeHtml(suggestedName)}" class="filter-input" style="width: 100%; padding: 8px;">
                </div>
                <div class="filter-search" style="margin-bottom: 1rem;">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="popup-search-input" placeholder="Anime title..." value="${escapeHtml(suggestedName)}" style="width: 100%;">
                    <button id="btn-popup-search-go" class="search-go-btn" style="right: 10px;">Go</button>
                </div>
                <div id="popup-search-results" class="search-popup-results">
                    <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Click Go to search...</p>
                </div>
            </div>
        `;
        document.getElementById('details-modal-title').textContent = 'Match Anime';
        detailsModal.classList.remove('hidden');

        const input = document.getElementById('popup-search-input');
        const nameOverrideInput = document.getElementById('popup-name-override');
        const resultsContainer = document.getElementById('popup-search-results');
        const btnGo = document.getElementById('btn-popup-search-go');

        const doSearch = async () => {
            const query = input.value.trim();
            if (!query) return;
            resultsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
            try {
                const resp = await fetch('/api/search_anime?q=' + encodeURIComponent(query));
                const results = await resp.json();
                resultsContainer.innerHTML = '';
                if (!results || results.length === 0) {
                    resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No results found.</p>';
                    return;
                }
                results.forEach(anime => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.style.flexDirection = 'column';
                    item.style.alignItems = 'stretch';
                    item.style.gap = '0.5rem';
                    
                    item.innerHTML = `
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <img src="${anime.coverImage.medium}" class="search-result-cover">
                            <div class="search-result-info">
                                <div class="search-result-title">${anime.title.romaji || anime.title.english}</div>
                                <div class="search-result-meta">${anime.season || ''} ${anime.seasonYear || ''} • ${anime.format || ''}</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                            <div style="display: flex; flex-direction: column; flex: 1;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 2px;">Status</label>
                                <select class="filter-select popup-status-select" style="padding: 4px; font-size: 0.75rem;">
                                    <option value="CURRENT">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="PLANNING" selected>Planning</option>
                                    <option value="PAUSED">Paused</option>
                                    <option value="DROPPED">Dropped</option>
                                </select>
                            </div>
                            <div style="display: flex; flex-direction: column; width: 60px;">
                                <label style="font-size: 0.65rem; color: var(--text-muted); margin-bottom: 2px;">Episode</label>
                                <input type="number" class="filter-input popup-episode-input" value="0" min="0" style="padding: 4px; font-size: 0.75rem;">
                            </div>
                            <button class="primary-btn add-to-lib-btn" style="padding: 6px 12px; font-size: 0.75rem; align-self: flex-end;">Add</button>
                        </div>
                    `;
                    
                    const addBtn = item.querySelector('.add-to-lib-btn');
                    const statusSelect = item.querySelector('.popup-status-select');
                    const epInput = item.querySelector('.popup-episode-input');
                    
                    addBtn.onclick = async () => {
                        addBtn.disabled = true;
                        addBtn.textContent = 'Adding...';
                        try {
                            // 1. Set title override if provided
                            const customTitle = nameOverrideInput.value.trim();
                            if (customTitle) {
                                await fetch('/api/update_title_override', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ mediaId: anime.id, customTitle: customTitle })
                                });
                            }

                            // 2. Add to library (Optimistic UI update)
                            const targetStatus = statusSelect.value;
                            const newEp = parseInt(epInput.value, 10) || 0;
                            
                            // Locally update or add to list for immediate feedback
                            const localIdx = animeList.findIndex(a => a.mediaId === anime.id);
                            if (localIdx >= 0) {
                                animeList[localIdx].listStatus = targetStatus;
                                animeList[localIdx].progress = newEp;
                            }
                            
                            const addResp = await fetch('/api/change_status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    mediaId: anime.id, 
                                    status: targetStatus,
                                    episode: newEp
                                })
                            });
                            if (addResp.ok) {
                                alert(`Added to ${statusSelect.options[statusSelect.selectedIndex].text}!`);
                                detailsModal.classList.add('hidden');
                                fetchLibrary(true);
                                fetchAnimeList(); // Full sync
                            } else {
                                alert('Failed to add.');
                                addBtn.disabled = false;
                                addBtn.textContent = 'Add';
                            }
                        } catch (err) {
                            alert('Network error.');
                            addBtn.disabled = false;
                            addBtn.textContent = 'Add';
                        }
                    };
                    resultsContainer.appendChild(item);
                });
            } catch (err) {
                resultsContainer.innerHTML = '<p style="text-align: center; color: var(--error); padding: 2rem;">Search failed.</p>';
            }
        };

        btnGo.onclick = doSearch;
        input.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };
        
        // Auto-trigger search if we have a suggested name
        if (suggestedName) doSearch();
    }

    function renderLibraryView() {
        if (!libraryData || !libraryContent) return;
        
        libraryContent.innerHTML = '';
        libraryContent.className = 'library-tree-container';
        
        const root = document.createElement('div');
        root.className = 'tree-root';

        function highlightText(text, term) {
            if (!term) return escapeHtml(text);
            const safeText = escapeHtml(text);
            const regex = new RegExp(`(${term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
            return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
        }

        function nodeMatches(node, term) {
            if (!term) return true;
            if (node.name.toLowerCase().includes(term)) return true;
            if (node.children) {
                return node.children.some(child => nodeMatches(child, term));
            }
            return false;
        }
        
        function renderNode(node, level = 0) {
            if (librarySearchTerm && !nodeMatches(node, librarySearchTerm)) return null;

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
            
            const labelContainer = document.createElement('div');
            labelContainer.className = 'tree-label-container';
            
            const label = document.createElement('div');
            label.className = 'tree-label';
            label.innerHTML = highlightText(node.name, librarySearchTerm);
            if (node.mediaId) {
                 label.style.fontWeight = '700';
                 label.style.color = 'var(--accent)';
                 label.title = 'AniList Matched: ' + node.name;
            }
            
            labelContainer.appendChild(label);
            
            if (node.mediaId && node.listStatus) {
                const sublabel = document.createElement('div');
                sublabel.className = 'tree-sublabel';
                const statusMap = {
                    'CURRENT': 'In Progress',
                    'PLANNING': 'Planning',
                    'COMPLETED': 'Completed',
                    'DROPPED': 'Dropped',
                    'PAUSED': 'Paused'
                };
                
                // GREEN/GREY logic for In Progress anime
                let statusLabel = statusMap[node.listStatus] || node.listStatus;
                if (node.listStatus === 'CURRENT') {
                    const localEps = node.localEpisodeCount || 0;
                    const progress = node.progress || 0;
                    const hasUnwatched = localEps > 0 && progress < localEps;
                    if (hasUnwatched) {
                        sublabel.style.color = '#10b981'; // Green - unwatched available
                        statusLabel = `In Progress (${localEps - progress} unwatched)`;
                    } else {
                        sublabel.style.color = '#94a3b8'; // Grey - all caught up
                        statusLabel = 'In Progress (caught up)';
                    }
                }
                sublabel.textContent = statusLabel;
                
                const blockLink = document.createElement('span');
                blockLink.className = 'tree-block-link';
                blockLink.textContent = '(Not an anime)';
                blockLink.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Exclude folder "${node.name}" from library?`)) {
                        excludePath(node.path);
                    }
                };
                sublabel.appendChild(blockLink);
                labelContainer.appendChild(sublabel);
            } else if (node.type === 'directory' && node.name !== 'Downloads') {
                const sublabel = document.createElement('div');
                sublabel.className = 'tree-sublabel not-matched';
                sublabel.textContent = 'Not in library';
                
                const addLink = document.createElement('span');
                addLink.className = 'tree-link';
                addLink.textContent = '(Add to library)';
                addLink.onclick = (e) => {
                    e.stopPropagation();
                    openSearchPopup(node.name);
                };
                sublabel.appendChild(addLink);

                const blockLink = document.createElement('span');
                blockLink.className = 'tree-block-link';
                blockLink.textContent = '(Not an anime)';
                blockLink.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Exclude folder "${node.name}" from library?`)) {
                        excludePath(node.path);
                    }
                };
                sublabel.appendChild(blockLink);
                labelContainer.appendChild(sublabel);
            } else if (node.type === 'file') {
                const sublabel = document.createElement('div');
                sublabel.className = 'tree-sublabel';
                
                const blockLink = document.createElement('span');
                blockLink.className = 'tree-block-link';
                blockLink.style.marginLeft = '0';
                blockLink.textContent = '(Not an anime)';
                blockLink.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Exclude file "${node.name}" from library?`)) {
                        excludePath(node.path);
                    }
                };
                sublabel.appendChild(blockLink);
                labelContainer.appendChild(sublabel);
            }
            
            const meta = document.createElement('div');
            meta.className = 'tree-meta';
            if (node.type === 'file') {
                meta.textContent = formatBytes(node.size);
            } else {
                meta.textContent = `${formatBytes(node.size)} (${node.children.length} items)`;
            }
            
            const actions = document.createElement('div');
            actions.className = 'tree-actions';
            
            const openFolder = document.createElement('button');
            openFolder.className = 'tree-action-btn';
            openFolder.title = 'Open Folder';
            openFolder.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
            openFolder.onclick = (e) => {
                e.stopPropagation();
                fetch('/api/open_folder?path=' + encodeURIComponent(node.path)).catch(console.error);
            };
            
            const titleRow = document.createElement('div');
            titleRow.style.display = 'flex';
            titleRow.style.alignItems = 'center';
            titleRow.style.gap = '0.5rem';
            
            if (node.type === 'directory') {
                // For directories, put open folder next to title if it's an anime folder
                // Re-parent label to titleRow
                labelContainer.removeChild(label);
                titleRow.appendChild(label);
                titleRow.appendChild(openFolder);

                // Edit button for matched anime folders
                if (node.mediaId) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'tree-action-btn';
                    editBtn.title = 'Edit Anime Details';
                    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>';
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        const anime = animeList.find(a => a.mediaId == node.mediaId);
                        if (anime) {
                            openAnimeDetailsModal(anime);
                        } else {
                            showToast('Anime not found in list. Try refreshing.', 'error');
                        }
                    };
                    titleRow.appendChild(editBtn);
                }

                labelContainer.prepend(titleRow);
                
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
                
                actions.appendChild(searchTorrents);
            } else {
                // For files, move label to titleRow and add play button if .mkv
                labelContainer.removeChild(label);
                titleRow.appendChild(label);
                
                if (node.name.toLowerCase().endsWith('.mkv')) {
                    const playBtn = document.createElement('button');
                    playBtn.className = 'tree-action-btn play-btn';
                    playBtn.title = 'Play File';
                    playBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>';
                    playBtn.onclick = (e) => {
                        e.stopPropagation();
                        fetch('/api/play_file?path=' + encodeURIComponent(node.path)).catch(console.error);
                    };
                    titleRow.appendChild(playBtn);
                }
                
                titleRow.appendChild(openFolder);
                
                labelContainer.prepend(titleRow);
            }
            
            itemEl.appendChild(chevron);
            itemEl.appendChild(icon);
            itemEl.appendChild(labelContainer);
            itemEl.appendChild(meta);
            itemEl.appendChild(actions);
            
            nodeEl.appendChild(itemEl);
            
            if (node.type === 'directory' && node.children) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                
                // Force expand if it's the root or if we are searching and there are matches inside
                let isExpanded = level === 0 || (librarySearchTerm && node.children.some(c => nodeMatches(c, librarySearchTerm)));
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
                
                node.children.forEach(child => {
                    const childNode = renderNode(child, level + 1);
                    if (childNode) childrenContainer.appendChild(childNode);
                });
                nodeEl.appendChild(childrenContainer);
            }
            
            return nodeEl;
        }
        
        if (Array.isArray(libraryData)) {
            libraryData.forEach(node => {
                const el = renderNode(node, 0);
                if (el) root.appendChild(el);
            });
            libraryContent.appendChild(root);
        } else {
            const rootNode = renderNode(libraryData, 0);
            if (rootNode) libraryContent.appendChild(rootNode);
        }

        // Add footer for managing exclusions if any exist
        if (libraryExclusions && libraryExclusions.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'library-footer';
            
            const link = document.createElement('span');
            link.className = 'manage-exclusions-link';
            link.textContent = `Show Exclusion List (${libraryExclusions.length} items)`;
            link.onclick = openExclusionModal;
            
            footer.appendChild(link);
            libraryContent.appendChild(footer);
        }
    }

    async function excludePath(path) {
        try {
            const resp = await fetch('/api/library/exclude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            const result = await resp.json();
            if (result.success) {
                showToast('Path excluded from library');
                fetchLibrary(true);
            } else {
                showToast('Failed to exclude path', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    async function restorePath(path) {
        try {
            const resp = await fetch('/api/library/include', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path })
            });
            const result = await resp.json();
            if (result.success) {
                showToast('Path restored to library');
                // We keep the modal open but refresh its content
                libraryExclusions = libraryExclusions.filter(p => p !== path);
                if (libraryExclusions.length === 0) {
                    detailsModal.classList.add('hidden');
                } else {
                    renderExclusionListInModal();
                }
                fetchLibrary(true);
            } else {
                showToast('Failed to restore path', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    }

    function openExclusionModal() {
        modalBody.innerHTML = `<h3>Managed Exclusions</h3><div id="exclusion-list-container"></div>`;
        renderExclusionListInModal();
        detailsModal.classList.remove('hidden');
    }

    function renderExclusionListInModal() {
        const container = document.getElementById('exclusion-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        if (libraryExclusions.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem 0;">No exclusions found.</p>';
            return;
        }
        
        const list = document.createElement('div');
        list.className = 'exclusion-list';
        
        libraryExclusions.forEach(path => {
            const item = document.createElement('div');
            item.className = 'exclusion-item';
            
            const name = path.split('/').pop();
            item.innerHTML = `
                <div class="exclusion-path" title="${escapeHtml(path)}">${escapeHtml(name)} <span style="opacity: 0.5; font-size: 0.7rem;">(${escapeHtml(path)})</span></div>
                <button class="primary-btn restore-btn">Restore</button>
            `;
            
            item.querySelector('.restore-btn').onclick = () => restorePath(path);
            list.appendChild(item);
        });
        
        container.appendChild(list);
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

    // ===== Back to Top Button Logic =====
    const backToTopBtn = document.getElementById('btn-back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Refresh anime list every 60 seconds
    setInterval(fetchAnimeList, 60000);

    // ===== Global Multi-Select Listeners =====
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', () => {
            const list = getFilteredList();
            list.forEach(a => selectedAnime.add(a.mediaId.toString()));
            updateSelectionUI();
            renderAnimeGrid();
        });
    }

    if (btnSelectNone) {
        btnSelectNone.addEventListener('click', () => {
            selectedAnime.clear();
            updateSelectionUI();
            renderAnimeGrid();
        });
    }

    if (btnMoveTo) {
        btnMoveTo.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShowing = moveToDropdown.classList.toggle('show');
            btnMoveTo.classList.toggle('active', isShowing);
        });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (moveToDropdown && !moveToDropdown.contains(e.target) && !btnMoveTo.contains(e.target)) {
            moveToDropdown.classList.remove('show');
            btnMoveTo.classList.remove('active');
        }
    });

    document.querySelectorAll('.move-to-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const status = opt.getAttribute('data-status');
            moveSelectedTo(status);
            moveToDropdown.classList.remove('show');
            btnMoveTo.classList.remove('active');
        });
    });

    if (btnBulkSync) {
        btnBulkSync.addEventListener('click', (e) => {
            e.stopPropagation();
            showReviewModal();
        });
    }

    if (linkReviewChanges) {
        linkReviewChanges.addEventListener('click', (e) => {
            e.preventDefault();
            showReviewModal();
        });
    }

    if (linkResetChanges) {
        linkResetChanges.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Reset all pending changes? This will clear your local edits and revert the UI to the last synced state.")) {
                pendingApiRequests = [];
                updatePendingUI();
                fetchAnimeList(); // Full refresh to restore UI state
                showToast("Pending changes cleared");
            }
        });
    }

    // Change Log Modal Listeners
    if (changelogModalClose) changelogModalClose.addEventListener('click', () => changelogModal.classList.add('hidden'));
    if (changelogModalOverlay) changelogModalOverlay.addEventListener('click', () => changelogModal.classList.add('hidden'));
    if (btnChangelogCancel) btnChangelogCancel.addEventListener('click', () => changelogModal.classList.add('hidden'));
    if (btnChangelogConfirm) btnChangelogConfirm.addEventListener('click', performBulkSync);
    
    if (btnResetOverrides) {
        btnResetOverrides.addEventListener('click', async () => {
            if (confirm("Are you sure you want to reset all custom title overrides? This will revert to default AniList title matching for all items.")) {
                try {
                    const res = await fetch('/api/reset_title_overrides', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                        showToast("Title overrides reset successfully");
                        settingsModal.classList.add('hidden');
                        fetchAnimeList(); // Refresh to ensure sync with updated settings
                    } else {
                        showToast("Failed to reset overrides", "error");
                    }
                } catch (e) {
                    console.error('Reset overrides failed:', e);
                    showToast("Error resetting overrides", "error");
                }
            }
        });
    }

    // Cleanup Unwatched Anime Wizard Listeners
    if (btnCleanupProgress) {
        btnCleanupProgress.addEventListener('click', () => {
            // Load saved preferences
            loadCleanupPrefs();
            // Reset to Step 1
            cleanupStep1.classList.remove('hidden');
            cleanupStep2.classList.add('hidden');
            cleanupNext.classList.remove('hidden');
            cleanupConfirm.classList.add('hidden');
            cleanupModal.classList.remove('hidden');
        });
    }

    if (cleanupTierFilters) {
        cleanupTierFilters.addEventListener('click', (e) => {
            const pill = e.target.closest('.tier-pill');
            if (pill) {
                pill.classList.toggle('active');
                saveCleanupPrefs();
                updateCleanupResults();
            }
        });
    }

    if (cleanupFormatFilters) {
        cleanupFormatFilters.addEventListener('click', (e) => {
            const pill = e.target.closest('.tier-pill');
            if (pill) {
                pill.classList.toggle('active');
                saveCleanupPrefs();
                updateCleanupResults();
            }
        });
    }

    if (cleanupRetentionVal) cleanupRetentionVal.addEventListener('change', saveCleanupPrefs);
    if (cleanupRetentionUnit) cleanupRetentionUnit.addEventListener('change', saveCleanupPrefs);

    function saveCleanupPrefs() {
        const activeTiers = Array.from(document.querySelectorAll('#cleanup-tier-filters .tier-pill.active')).map(p => p.dataset.tier);
        const activeFormats = Array.from(document.querySelectorAll('#cleanup-format-filters .tier-pill.active')).map(p => p.dataset.format);
        const prefs = {
            val: cleanupRetentionVal.value,
            unit: cleanupRetentionUnit.value,
            tiers: activeTiers,
            formats: activeFormats
        };
        localStorage.setItem('cleanupPrefs', JSON.stringify(prefs));
    }

    function loadCleanupPrefs() {
        const saved = localStorage.getItem('cleanupPrefs');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                if (prefs.val) cleanupRetentionVal.value = prefs.val;
                if (prefs.unit) cleanupRetentionUnit.value = prefs.unit;
                
                if (prefs.tiers) {
                    const pills = document.querySelectorAll('#cleanup-tier-filters .tier-pill');
                    pills.forEach(p => {
                        if (prefs.tiers.includes(p.dataset.tier)) p.classList.add('active');
                        else p.classList.remove('active');
                    });
                }
                if (prefs.formats) {
                    const pills = document.querySelectorAll('#cleanup-format-filters .tier-pill');
                    pills.forEach(p => {
                        if (prefs.formats.includes(p.dataset.format)) p.classList.add('active');
                        else p.classList.remove('active');
                    });
                }
            } catch (e) {
                console.error("Failed to load cleanup prefs", e);
            }
        }
    }

    if (cleanupSelectAll) {
        cleanupSelectAll.addEventListener('change', () => {
            const checkboxes = cleanupContainer.querySelectorAll('input[type="checkbox"]:not(#cleanup-select-all)');
            checkboxes.forEach(cb => cb.checked = cleanupSelectAll.checked);
        });
    }

    function updateCleanupResults() {
        const activeTiers = Array.from(document.querySelectorAll('#cleanup-tier-filters .tier-pill.active')).map(p => p.dataset.tier);
        const activeFormats = Array.from(document.querySelectorAll('#cleanup-format-filters .tier-pill.active')).map(p => p.dataset.format);

        const filtered = cleanupCandidates.filter(a => {
            const prog = a.progress || 0;
            const format = (a.format || 'TV').toUpperCase();
            
            // Tier Filter
            let matchesTier = (activeTiers.length === 0);
            if (!matchesTier) {
                if (activeTiers.includes('0') && prog === 0) matchesTier = true;
                if (activeTiers.includes('1') && prog === 1) matchesTier = true;
                if (activeTiers.includes('3') && (prog >= 2 && prog <= 3)) matchesTier = true;
                if (activeTiers.includes('6') && (prog >= 4 && prog <= 6)) matchesTier = true;
                if (activeTiers.includes('6+') && prog > 6) matchesTier = true;
            }
            if (!matchesTier) return false;

            // Format Filter
            let matchesFormat = (activeFormats.length === 0 || activeFormats.includes(format));
            return matchesFormat;
        });

        renderCleanupChecklist(filtered);
    }

    function renderCleanupChecklist(toDrop) {
        cleanupContainer.innerHTML = '';
        
        if (toDrop.length === 0) {
            cleanupContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No anime match your active filters.</div>';
            return;
        }

        // Stats summary (Years Count)
        const yearsSet = new Set();
        toDrop.forEach(a => { if (a.seasonYear) yearsSet.add(a.seasonYear); });
        const yearArray = Array.from(yearsSet).sort((a, b) => a - b);
        const yearRangeStr = yearArray.length > 0 ? `${yearArray[0]}${yearArray.length > 1 ? ' - ' + yearArray[yearArray.length-1] : ''}` : '';
        
        const statsHeader = document.createElement('div');
        statsHeader.style.cssText = 'margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.85rem; border: 1px solid var(--border);';
        statsHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-muted);">Matches Visibility:</span>
                <strong style="color: var(--accent);">${toDrop.length} anime</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                <span style="color: var(--text-muted);">Years represented:</span>
                <strong style="color: var(--text-primary);">${yearArray.length} year(s) <span style="font-weight: 400; opacity: 0.7; font-size: 0.75rem;">(${yearRangeStr})</span></strong>
            </div>
        `;
        cleanupContainer.appendChild(statsHeader);

        toDrop.forEach(a => {
            const title = a.title?.romaji || a.title?.english || 'Unknown';
            const year = a.seasonYear ? ` (${a.seasonYear})` : '';
            const relTime = getRelativeTime(a.updatedAt);
            const item = document.createElement('div');
            item.className = 'changelog-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '10px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.mediaId = a.mediaId;
            checkbox.dataset.title = title;
            checkbox.style.cursor = 'pointer';
            
            checkbox.addEventListener('change', () => {
                const allCurrent = cleanupContainer.querySelectorAll('input[type="checkbox"]:not(#cleanup-select-all)');
                const checkedCount = Array.from(allCurrent).filter(c => c.checked).length;
                if (cleanupSelectAll) {
                    cleanupSelectAll.checked = (checkedCount === allCurrent.length);
                    cleanupSelectAll.indeterminate = (checkedCount > 0 && checkedCount < allCurrent.length);
                }
            });

            const label = document.createElement('div');
            label.style.flex = '1';
            label.innerHTML = `<strong>${title}${year}</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">Inactive for ${relTime} • Watched: ${a.progress || 0} eps • ${a.format || 'TV'}</span>`;

            item.appendChild(checkbox);
            item.appendChild(label);
            cleanupContainer.appendChild(item);
        });

        // Reset Select All state
        if (cleanupSelectAll) {
            cleanupSelectAll.checked = true;
            cleanupSelectAll.indeterminate = false;
        }
    }

    if (cleanupNext) {
        cleanupNext.addEventListener('click', () => {
            const val = parseInt(cleanupRetentionVal.value, 10) || 1;
            const unit = cleanupRetentionUnit.value;
            let retentionDays = val;
            if (unit === 'months') retentionDays = val * 30;
            if (unit === 'years') retentionDays = val * 365;

            const now = Math.floor(Date.now() / 1000);
            const cutoff = now - (retentionDays * 86400);

            cleanupCandidates = animeList.filter(a => 
                a.listStatus === 'CURRENT' && 
                a.updatedAt && 
                a.updatedAt < cutoff
            );

            if (cleanupCandidates.length === 0) {
                showToast(`No anime found matching retention criteria.`);
                return;
            }

            // Save current prefs
            saveCleanupPrefs();
            
            // Populate and Switch to Step 2
            updateCleanupResults();

            cleanupStep1.classList.add('hidden');
            cleanupStep2.classList.remove('hidden');
            cleanupNext.classList.add('hidden');
            cleanupConfirm.classList.remove('hidden');
        });
    }

    if (cleanupModalClose) cleanupModalClose.addEventListener('click', () => cleanupModal.classList.add('hidden'));
    if (cleanupModalOverlay) cleanupModalOverlay.addEventListener('click', () => cleanupModal.classList.add('hidden'));
    if (cleanupCancel) cleanupCancel.addEventListener('click', () => cleanupModal.classList.add('hidden'));

    if (cleanupConfirm) {
        cleanupConfirm.addEventListener('click', () => {
            const checkboxes = cleanupContainer.querySelectorAll('input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                showToast("No anime selected.");
                cleanupModal.classList.add('hidden');
                return;
            }

            let count = 0;
            checkboxes.forEach(cb => {
                const mediaId = parseInt(cb.dataset.mediaId, 10);
                const title = cb.dataset.title;
                const anime = animeList.find(a => a.mediaId == mediaId);
                
                if (anime) {
                    recordApiRequest('STATUS', mediaId, { status: 'DROPPED' }, `${title}: Auto-Drop (Inactive)`);
                    anime.listStatus = 'DROPPED'; // Optimistic update
                    count++;
                }
            });

            if (count > 0) {
                updateCounts();
                if (activeTab === 'CURRENT') {
                    renderAnimeGrid();
                }
                showToast(`Marked ${count} anime as Dropped (Pending)`);
            }
            
            cleanupModal.classList.add('hidden');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.add-dropdown.show').forEach(d => d.classList.remove('show'));
    });

    // ===== Library File Cleanup Feature =====
    const fileCleanupModal = document.getElementById('file-cleanup-modal');
    const fileCleanupOverlay = document.getElementById('file-cleanup-modal-overlay');
    const fileCleanupClose = document.getElementById('file-cleanup-modal-close');
    const fileCleanupCancel = document.getElementById('file-cleanup-cancel');
    const fileCleanupConfirm = document.getElementById('file-cleanup-confirm');
    const fileCleanupContainer = document.getElementById('file-cleanup-container');
    const fileCleanupSelectAll = document.getElementById('file-cleanup-select-all');
    const fileCleanupSummary = document.getElementById('file-cleanup-summary');
    const btnCleanupFiles = document.getElementById('btn-cleanup-files');

    function closeFileCleanupModal() {
        if (fileCleanupModal) fileCleanupModal.classList.add('hidden');
    }

    if (fileCleanupClose) fileCleanupClose.addEventListener('click', closeFileCleanupModal);
    if (fileCleanupOverlay) fileCleanupOverlay.addEventListener('click', closeFileCleanupModal);
    if (fileCleanupCancel) fileCleanupCancel.addEventListener('click', closeFileCleanupModal);

    if (btnCleanupFiles) {
        btnCleanupFiles.addEventListener('click', async () => {
            if (!fileCleanupModal || !fileCleanupContainer) return;
            
            fileCleanupContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Scanning for cleanup candidates...</p></div>';
            fileCleanupModal.classList.remove('hidden');
            
            try {
                const resp = await fetch('/api/library/cleanup_candidates');
                const candidates = await resp.json();
                
                if (!candidates || candidates.length === 0) {
                    fileCleanupContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No watched or completed files found for cleanup.</p>';
                    if (fileCleanupConfirm) fileCleanupConfirm.classList.add('hidden');
                    if (fileCleanupSummary) fileCleanupSummary.textContent = '';
                    return;
                }
                
                if (fileCleanupConfirm) fileCleanupConfirm.classList.remove('hidden');
                
                // Group by anime title
                const grouped = {};
                let totalSize = 0;
                candidates.forEach(c => {
                    if (!grouped[c.animeTitle]) grouped[c.animeTitle] = [];
                    grouped[c.animeTitle].push(c);
                    totalSize += c.size || 0;
                });
                
                fileCleanupContainer.innerHTML = '';
                
                Object.entries(grouped).forEach(([title, files]) => {
                    const group = document.createElement('div');
                    group.style.marginBottom = '1rem';
                    
                    const header = document.createElement('div');
                    header.style.cssText = 'font-weight: 700; font-size: 0.9rem; color: var(--accent); margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(99, 102, 241, 0.1); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
                    const statusBadge = files[0].listStatus === 'COMPLETED' 
                        ? '<span style="font-size: 0.7rem; background: #f59e0b; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 600;">COMPLETED</span>'
                        : '<span style="font-size: 0.7rem; background: #10b981; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: 600;">EP ' + files[0].progress + '</span>';
                    header.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" class="group-cleanup-checkbox custom-checkbox" checked style="cursor: pointer;" title="Select all for ${escapeHtml(title)}">
                            <span>${escapeHtml(title)}</span>
                        </div>
                        ${statusBadge}
                    `;
                    group.appendChild(header);
                    
                    const groupCheckbox = header.querySelector('.group-cleanup-checkbox');
                    groupCheckbox.addEventListener('change', (e) => {
                        const fileCheckboxes = group.querySelectorAll('.file-cleanup-checkbox');
                        fileCheckboxes.forEach(cb => { cb.checked = e.target.checked; });
                        updateFileCleanupSummary();
                    });
                    
                    files.forEach(file => {
                        const item = document.createElement('div');
                        item.className = 'changelog-item';
                        item.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 0.5rem 0.75rem;';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.checked = true;
                        checkbox.dataset.path = file.path;
                        checkbox.dataset.size = file.size || 0;
                        checkbox.className = 'file-cleanup-checkbox';
                        checkbox.style.cursor = 'pointer';
                        checkbox.addEventListener('change', () => {
                            const fileCheckboxes = group.querySelectorAll('.file-cleanup-checkbox');
                            const checkedCount = Array.from(fileCheckboxes).filter(cb => cb.checked).length;
                            if (groupCheckbox) {
                                groupCheckbox.checked = checkedCount === fileCheckboxes.length;
                                groupCheckbox.indeterminate = checkedCount > 0 && checkedCount < fileCheckboxes.length;
                            }
                            updateFileCleanupSummary();
                        });
                        
                        const label = document.createElement('div');
                        label.style.cssText = 'flex: 1; min-width: 0;';
                        const epLabel = file.episode !== null ? `<span style="color: ${file.isWatched ? '#10b981' : '#f59e0b'}; font-weight: 600; font-size: 0.75rem;">E${file.episode}</span> ` : '';
                        const sizeLabel = file.size ? `<span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 0.5rem;">${formatBytes(file.size)}</span>` : '';
                        label.innerHTML = `${epLabel}<span style="font-size: 0.85rem; color: var(--text-primary);">${escapeHtml(file.filename)}</span>${sizeLabel}`;
                        
                        item.appendChild(checkbox);
                        item.appendChild(label);
                        group.appendChild(item);
                    });
                    
                    fileCleanupContainer.appendChild(group);
                });
                
                updateFileCleanupSummary();
                
            } catch (err) {
                console.error('Failed to fetch cleanup candidates:', err);
                fileCleanupContainer.innerHTML = '<p style="text-align: center; color: var(--error); padding: 2rem;">Failed to scan files.</p>';
            }
        });
    }

    function updateFileCleanupSummary() {
        const checkboxes = fileCleanupContainer.querySelectorAll('.file-cleanup-checkbox');
        const checked = fileCleanupContainer.querySelectorAll('.file-cleanup-checkbox:checked');
        let totalCheckedSize = 0;
        checked.forEach(cb => { totalCheckedSize += parseInt(cb.dataset.size || '0'); });
        
        if (fileCleanupSummary) {
            fileCleanupSummary.textContent = `${checked.length} of ${checkboxes.length} files selected (${formatBytes(totalCheckedSize)})`;
        }
        
        if (fileCleanupSelectAll) {
            fileCleanupSelectAll.checked = checked.length === checkboxes.length;
            fileCleanupSelectAll.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
        }
    }

    if (fileCleanupSelectAll) {
        fileCleanupSelectAll.addEventListener('change', () => {
            const checkboxes = fileCleanupContainer.querySelectorAll('.file-cleanup-checkbox');
            checkboxes.forEach(cb => { cb.checked = fileCleanupSelectAll.checked; });
            
            const groupCheckboxes = fileCleanupContainer.querySelectorAll('.group-cleanup-checkbox');
            groupCheckboxes.forEach(gcb => {
                gcb.checked = fileCleanupSelectAll.checked;
                gcb.indeterminate = false;
            });
            updateFileCleanupSummary();
        });
    }

    if (fileCleanupConfirm) {
        fileCleanupConfirm.addEventListener('click', async () => {
            const checked = fileCleanupContainer.querySelectorAll('.file-cleanup-checkbox:checked');
            if (checked.length === 0) {
                showToast('No files selected.', 'error');
                return;
            }
            
            const paths = Array.from(checked).map(cb => cb.dataset.path);
            
            if (!confirm(`Move ${paths.length} file(s) to trash? This cannot be easily undone.`)) {
                return;
            }
            
            fileCleanupConfirm.disabled = true;
            fileCleanupConfirm.textContent = 'Moving...';
            
            try {
                const resp = await fetch('/api/move_to_trash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paths })
                });
                const result = await resp.json();
                
                if (result.success) {
                    showToast(`Moved ${result.count || paths.length} file(s) to trash.`, 'info');
                    closeFileCleanupModal();
                    fetchLibrary(true); // Refresh library
                } else {
                    showToast(result.error || 'Failed to move files to trash.', 'error');
                }
            } catch (err) {
                console.error('Failed to move files to trash:', err);
                showToast('Error communicating with server.', 'error');
            } finally {
                fileCleanupConfirm.disabled = false;
                fileCleanupConfirm.textContent = 'Move to Trash';
            }
        });
    }
});
