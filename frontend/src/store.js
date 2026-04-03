import { signal, computed } from '@preact/signals';

// ===== Core State =====
export const animeList = signal([]);
export const activeTab = signal('CURRENT');
export const viewMode = signal(localStorage.getItem('mpvViewMode') || 'details');
export const selectedAnime = signal(new Set());
export const lastSelectedMediaId = signal(null);
export const pendingApiRequests = signal([]);
export const currentPage = signal(1);
export const itemsPerPage = signal(parseInt(localStorage.getItem('mpvItemsPerPage')) || 20);
export const sortBy = signal('progress');
export const sortDirection = signal(-1);
export const activeSearchTerm = signal('');
export const expandedCard = signal(null);

// ===== Now Playing State =====
export const latestStatus = signal(null);
export const lastNowPlayingTitle = signal(null);
export const currentNpAnime = signal(null);

// ===== User Settings =====
export const userSettings = signal(null);

// ===== Library State =====
export const libraryData = signal([]);
export const libraryExclusions = signal([]);
export const librarySearchTerm = signal('');

// ===== Upcoming =====
export const upcomingCache = signal(null);

// ===== Torrent State =====
export const torrentFilters = signal({
    category: '1_2',
    nyaaFilter: '0',
    resolution: '',
    group: '',
    episode: '',
    airingOnly: false,
    dateFilter: 'all',
});

export const torrentCache = signal({
    items: [],
    query: null,
    mediaId: null,
    isBatch: false,
    sortBy: 'date',
    sortDir: -1
});

// ===== Sidebar =====
export const sidebarCollapsed = signal(localStorage.getItem('sidebarCollapsed') === 'true');
export const selectedSidebarSeasons = signal(new Set(['WINTER', 'SPRING', 'SUMMER', 'FALL']));
export const selectedGenres = signal(new Set());

// ===== Cleanup =====
export const cleanupCandidates = signal([]);

// ===== Toast =====
export const toasts = signal([]);
let toastId = 0;

export function showToast(message, type = 'success') {
    const id = ++toastId;
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }, 3500);
}

// ===== API Errors =====
export const apiErrorMessages = signal([]);

export function showApiError(message) {
    const id = Date.now() + Math.random();
    apiErrorMessages.value = [...apiErrorMessages.value, { id, message }];
    setTimeout(() => {
        apiErrorMessages.value = apiErrorMessages.value.filter(e => e.id !== id);
    }, 5000);
}

// ===== Pending Changes =====
export function recordApiRequest(type, mediaId, data, label) {
    const existing = pendingApiRequests.value;
    const idx = existing.findIndex(r => r.mediaId === mediaId && r.type === type);
    const request = { type, mediaId, data, label, timestamp: Date.now() };
    if (idx !== -1) {
        const updated = [...existing];
        updated[idx] = request;
        pendingApiRequests.value = updated;
    } else {
        pendingApiRequests.value = [...existing, request];
    }
}

export function removeApiRequest(idx) {
    pendingApiRequests.value = pendingApiRequests.value.filter((_, i) => i !== idx);
}

export function clearApiRequests() {
    pendingApiRequests.value = [];
}

// ===== Selection Helpers =====
export function toggleSelection(mediaId) {
    const idStr = mediaId.toString();
    const newSet = new Set(selectedAnime.value);
    if (newSet.has(idStr)) {
        newSet.delete(idStr);
    } else {
        newSet.add(idStr);
    }
    selectedAnime.value = newSet;
    lastSelectedMediaId.value = idStr;
}

export function clearSelection() {
    selectedAnime.value = new Set();
}

// ===== View Mode =====
export function setViewMode(mode) {
    viewMode.value = mode;
    localStorage.setItem('mpvViewMode', mode);
}

// ===== Tab =====
export function setActiveTab(tab) {
    activeTab.value = tab;
    currentPage.value = 1;
}

// ===== Sort =====
export function setSort(column) {
    if (!column) return;
    if (sortBy.value === column) {
        sortDirection.value = -sortDirection.value;
    } else {
        sortBy.value = column;
        sortDirection.value = -1;
    }
}

// ===== Items Per Page =====
export function setItemsPerPage(val) {
    itemsPerPage.value = val;
    localStorage.setItem('mpvItemsPerPage', val);
    currentPage.value = 1;
}
