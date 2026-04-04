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
        <header id="app-header">
            <div class="header-left">
                <button id="btn-profile" class="header-btn" title="View Profile" onClick={handleProfile}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>anilist.co</span>
                </button>
            </div>
            <div class="header-right">
                <div class="theme-switch-wrapper" title="Dark/Light Mode" style={{ marginRight: '1.5rem' }}>
                    <span class="theme-label">Theme</span>
                    <label class="theme-switch" for="theme-toggle">
                        <input type="checkbox" id="theme-toggle" checked={theme === 'light'} onChange={toggleTheme} />
                        <div class="slider">
                            <div class="moon-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                            </div>
                            <div class="sun-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                            </div>
                        </div>
                    </label>
                </div>
                <button id="btn-reauthorize" class="header-btn" title="Reauthorize with AniList" onClick={handleReauthorize}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>Reauthorize</span>
                </button>
                <button id="btn-clear-cache" class="header-btn" title="Clear library and image cache" onClick={handleClearCache}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    <span>Clear Cache</span>
                </button>
                <button id="btn-full-refresh" class="header-btn" title="Full refresh (clears session and reloads list)" onClick={handleFullRefresh}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span>Full Refresh</span>
                </button>
                <button id="btn-settings-header" class="header-btn" title="Settings" onClick={onOpenSettings}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    <span>Settings</span>
                </button>
                <div id="status-indicator" class="status-bubble offline">
                    <div class="pulse"></div>
                    <span id="status-text">Nothing Playing</span>
                </div>
            </div>
        </header>
    );
}
