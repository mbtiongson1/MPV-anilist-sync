import { showApiError } from './store';

// Unified API client — replaces 25+ scattered fetch() calls

async function request(url, options = {}) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`API error (${url}):`, err);
        showApiError(`Failed to fetch ${url}: ${err.message}`);
        throw err;
    }
}

function post(url, body) {
    return request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

// ===== Status =====
export const fetchStatus = () => request('/api/status');

// ===== Anime List =====
export const fetchAnimeList = () => request('/api/animelist');

// ===== Upcoming =====
export const fetchUpcoming = (refresh = false, season = null, year = null) => {
    const params = new URLSearchParams();
    if (refresh) params.append('refresh', 'true');
    if (season) params.append('season', season);
    if (year) params.append('year', year);
    const qs = params.toString();
    return request('/api/upcoming' + (qs ? '?' + qs : ''));
};

// ===== Library =====
export const fetchLibrary = async (forceRefresh = false) => {
    const res = await request('/api/library' + (forceRefresh ? '?force_refresh=true' : ''));
    return res.success !== undefined ? res.data : res;
};

export const fetchLibraryExclusions = () => request('/api/library/exclusions');

export const excludePath = (path) => post('/api/library/exclude', { path });

export const includePath = (path) => post('/api/library/include', { path });
export const fetchCleanupCandidates = () => request('/api/library/cleanup_candidates');
export const moveToTrash = (paths) => post('/api/move_to_trash', { paths });
export const openTrash = () => request('/api/open_trash');

// ===== Progress & Status Updates =====
export const updateProgress = (mediaId, episode) =>
    post('/api/update_progress', { mediaId, episode });

export const changeStatus = (mediaId, status, episode) =>
    post('/api/change_status', { mediaId, status, ...(episode !== undefined ? { episode } : {}) });

export const syncToAnilist = () => request('/api/sync', { method: 'POST' });

// ===== Title Overrides =====
export const updateTitleOverride = (mediaId, customTitle) =>
    post('/api/update_title_override', { mediaId, customTitle });

export const resetTitleOverrides = () => request('/api/reset_title_overrides', { method: 'POST' });

// ===== Media Controls =====
export const playPause = () => request('/api/play_pause');
export const playNext = () => fetch('/api/play_next');
export const playPrev = () => fetch('/api/play_prev');
export const adjustEpisode = (change) =>
    post('/api/adjust_episode', { change });
export const selectSeason = (mediaId) =>
    post('/api/select_season', { mediaId });
export const resumePlay = () => request('/api/resume', { method: 'POST' });
export const playFile = (path) => fetch('/api/play_file?path=' + encodeURIComponent(path));

// ===== Folder =====
export const openFolder = (mediaId) =>
    fetch('/api/open_folder?mediaId=' + mediaId);
export const openFolderByPath = (path) =>
    fetch('/api/open_folder?path=' + encodeURIComponent(path));
export const openFolderPost = () => request('/api/open_folder', { method: 'POST' });

// ===== Organize =====
export const organizeFolders = () => request('/api/organize_folders', { method: 'POST' });

// ===== Nyaa Torrents =====
export const searchNyaa = (params) => request('/api/nyaa_search?' + params);
export const batchSearchNyaaCandidates = (params) => request('/api/nyaa_batch_search_candidates?' + params);
export const downloadTorrents = (items) => post('/api/nyaa_download', {
    items: (items || []).map(item => ({
        url: item?.url || item?.link || item?.magnet || '',
        mediaId: item?.mediaId ?? item?.media_id ?? null,
        animeTitle: item?.animeTitle ?? item?.anime_title ?? '',
    })).filter(item => item.url),
});

// ===== Settings =====
export const loadSettings = () => request('/api/settings');
export const saveSettings = (payload) => post('/api/settings', payload);

// ===== User =====
export const fetchUser = () => request('/api/user');

// ===== Search =====
export const searchAnime = (query) =>
    request('/api/search_anime?q=' + encodeURIComponent(query));

// ===== Auth =====
export const reauthorize = () => request('/api/reauthorize', { method: 'POST' });
export const fullRefresh = () => request('/api/full_refresh', { method: 'POST' });
export const clearCache = () => request('/api/clear_cache', { method: 'POST' });
