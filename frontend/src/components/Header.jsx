import { useState, useEffect } from 'preact/hooks';
import { pendingApiRequests, animeList, showToast, activeTab } from '../store';
import { getRelativeTime } from '../utils';
import * as api from '../api';

export function Header({ viewMode, onViewModeChange, onOpenSettings, onShowUpcoming, onShowReview, onRefresh }) {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const pendCount = pendingApiRequests.value.length;
    const tab = activeTab.value;

    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const lastSync = localStorage.getItem('lastAnilistSync');
    const lastSyncStr = lastSync ? `Last synced: ${getRelativeTime(Math.floor(parseInt(lastSync) / 1000))}` : '';

    const handlePull = async () => {
        if (!confirm("Download latest list from AniList? This will overwrite any unsynced local changes.")) return;
        try {
            pendingApiRequests.value = [];
            await onRefresh();
            showToast("Pulled latest list from AniList");
        } catch (e) {
            showToast("Pull failed", "error");
        }
    };

    const handlePush = async () => {
        if (!confirm("Upload all local changes to AniList?")) return;
        if (pendingApiRequests.value.length > 0) {
            onShowReview();
        } else {
            await onRefresh();
        }
    };

    const handleReauthorize = async () => {
        if (confirm('This will open your browser to reauthorize with AniList. Continue?')) {
            try {
                await api.reauthorize();
                alert('Reauthorization initiated. Check your browser.');
            } catch (e) {
                alert('Failed to initiate reauthorization.');
            }
        }
    };

    const handleFullRefresh = async () => {
        if (confirm('This will clear your current session and re-fetch your anime list. Continue?')) {
            try {
                await api.fullRefresh();
                localStorage.clear();
                window.location.reload();
            } catch (e) {
                alert('Failed to perform full refresh.');
            }
        }
    };

    const handleClearCache = async () => {
        if (confirm('This will clear the library and image cache. Continue?')) {
            try {
                await api.clearCache();
                alert('Cache cleared successfully.');
                window.location.reload();
            } catch (e) {
                alert('Failed to clear cache.');
            }
        }
    };

    const handleProfile = async () => {
        try {
            const user = await api.fetchUser();
            if (user?.name) window.open(`https://anilist.co/user/${user.name}`, '_blank');
            else window.open('https://anilist.co/home', '_blank');
        } catch (e) {
            window.open('https://anilist.co/home', '_blank');
        }
    };

    const showFilterBar = !['TORRENTS', 'STATS', 'LIBRARY'].includes(tab);

    return (
        <header class="app-header">
            <div class="header-top">
                <div class="header-left">
                    <div id="status-indicator" class="status-indicator">
                        <span id="status-text">Loading...</span>
                    </div>
                </div>
                <div class="header-right">
                    <label class="theme-toggle-label" title="Toggle Theme">
                        <input type="checkbox" id="theme-toggle" checked={theme === 'light'} onChange={toggleTheme} />
                        <span class="theme-toggle-slider" />
                    </label>
                    <button id="btn-profile" class="icon-btn" onClick={handleProfile} title="AniList Profile">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </button>
                    <button id="btn-settings-header" class="icon-btn" onClick={onOpenSettings} title="Settings">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    </button>
                    <button id="btn-refresh-header" class="icon-btn" onClick={onRefresh} title="Refresh">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    </button>
                </div>
            </div>

            <div class="header-actions">
                <div class="action-group">
                    <button id="btn-show-upcoming" class="secondary-btn" onClick={onShowUpcoming}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span>Upcoming</span>
                    </button>
                    <button id="btn-pull-anilist" class="secondary-btn" onClick={handlePull}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" /></svg>
                        <span>Pull</span>
                    </button>
                    <button id="btn-refresh-list" class={`primary-btn ${pendCount > 0 ? 'pulse-sync' : ''}`} onClick={handlePush}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /><polyline points="16 16 12 12 8 16" /></svg>
                        <span>Update</span>
                    </button>
                </div>

                {pendCount > 0 && (
                    <div id="pending-changes-info" class="pending-changes-info">
                        <span id="pending-count">{pendCount}</span> pending changes
                        <a href="#" id="link-review-changes" onClick={(e) => { e.preventDefault(); onShowReview(); }}>Review</a>
                        <a href="#" id="link-reset-changes" onClick={(e) => {
                            e.preventDefault();
                            if (confirm("Reset all pending changes?")) {
                                pendingApiRequests.value = [];
                                onRefresh();
                                showToast("Pending changes cleared");
                            }
                        }}>Reset</a>
                    </div>
                )}

                {lastSyncStr && <span id="last-synced-time" class="last-synced-time">{lastSyncStr}</span>}
            </div>

            <div class="header-controls">
                <div class="header-controls-left">
                    <button id="btn-reauthorize" class="secondary-btn" onClick={handleReauthorize}>Reauthorize</button>
                    <button id="btn-full-refresh" class="secondary-btn" onClick={handleFullRefresh}>Full Refresh</button>
                    <button id="btn-clear-cache" class="secondary-btn" onClick={handleClearCache}>Clear Cache</button>
                </div>
            </div>

            {showFilterBar && (
                <div class="view-toggle-group">
                    <button id="btn-view-grid" class={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => onViewModeChange('grid')} title="Grid View">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                    </button>
                    <button id="btn-view-list" class={`view-toggle-btn ${viewMode === 'details' ? 'active' : ''}`} onClick={() => onViewModeChange('details')} title="Details View">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                    </button>
                </div>
            )}
        </header>
    );
}
