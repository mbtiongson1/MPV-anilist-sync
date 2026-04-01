// ===== Status Colors =====
export const statusColors = {
    'CURRENT': '#10b981',
    'PLANNING': '#6366f1',
    'COMPLETED': '#f59e0b',
    'DROPPED': '#ef4444',
    'PAUSED': '#94a3b8'
};

// ===== Genre Colors =====
export const genreColors = {
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

// ===== Escape HTML =====
const escDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
export function escapeHtml(str) {
    if (!str) return '';
    escDiv.textContent = str;
    return escDiv.innerHTML;
}

// ===== Number Formatting =====
export function formatPopularity(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ===== Time Utilities =====
export function getRelativeTime(timestamp) {
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

// ===== Season Utilities =====
export function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return "WINTER";
    if (month >= 3 && month <= 5) return "SPRING";
    if (month >= 6 && month <= 8) return "SUMMER";
    return "FALL";
}

export function getSeasonEndDate(season, year) {
    if (season === "WINTER") return new Date(year, 2, 31, 23, 59, 59);
    if (season === "SPRING") return new Date(year, 5, 30, 23, 59, 59);
    if (season === "SUMMER") return new Date(year, 8, 30, 23, 59, 59);
    return new Date(year, 11, 31, 23, 59, 59);
}

export function getTimeRemaining(endDate) {
    const now = new Date();
    const diff = endDate - now;
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return "ends today";
    if (days < 7) return `ends in ${days} day${days !== 1 ? 's' : ''}`;

    const weeks = Math.ceil(days / 7);
    return `ends in ${weeks} week${weeks !== 1 ? 's' : ''}`;
}

export function getAnimeSeasons(anime) {
    const startSeason = (anime.season || "").toUpperCase();
    if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(startSeason)) return [];

    const seasonsOrder = ["WINTER", "SPRING", "SUMMER", "FALL"];
    const startIndex = seasonsOrder.indexOf(startSeason);

    let cours = 1;
    const totalEps = anime.episodes || 0;
    if (totalEps > 13) cours = 2;
    if (totalEps > 26) cours = 3;
    if (totalEps > 40) cours = 4;
    if (anime.mediaStatus === 'RELEASING' && totalEps === 0) cours = 2;

    const seasons = [];
    for (let i = 0; i < cours; i++) {
        seasons.push(seasonsOrder[(startIndex + i) % 4]);
    }
    return seasons;
}

// ===== Search =====
export function fuzzyMatch(query, text) {
    if (!query || !text) return false;
    query = query.toLowerCase();
    text = text.toLowerCase();
    let queryIndex = 0;
    for (let char of text) {
        if (char === query[queryIndex]) {
            queryIndex++;
            if (queryIndex === query.length) return true;
        }
    }
    return false;
}

// ===== Image Proxy =====
export function getCachedImageUrl(url) {
    if (!url) return '';
    return `/api/image?url=${encodeURIComponent(url)}`;
}

// ===== Torrent Size Parsing =====
export function parseSize(sizeStr) {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/^(\d+(\.\d+)?)\s*([KMGT]i?B)$/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[3].toUpperCase();
    const units = {
        'B': 1,
        'KB': 1024, 'KIB': 1024,
        'MB': 1024 ** 2, 'MIB': 1024 ** 2,
        'GB': 1024 ** 3, 'GIB': 1024 ** 3,
        'TB': 1024 ** 4, 'TIB': 1024 ** 4
    };
    return val * (units[unit] || 1);
}

// ===== Capitalize =====
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ===== Title Resolver =====
export function getDisplayTitle(anime, userSettings) {
    if (userSettings?.title_overrides?.[anime.mediaId]) {
        return userSettings.title_overrides[anime.mediaId];
    }
    return anime.title?.romaji || anime.title?.english || anime.title?.native || 'Unknown';
}
