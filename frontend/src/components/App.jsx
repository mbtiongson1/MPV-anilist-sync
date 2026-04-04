import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { animeList, activeTab, viewMode, selectedAnime, sortBy, sortDirection, currentPage, userSettings, sidebarCollapsed, selectedSidebarSeasons, selectedGenres, showToast, setViewMode, setActiveTab, pendingApiRequests, apiErrorMessages, libraryData } from '../store';
import { fuzzyMatch, getAnimeSeasons, getDisplayTitle } from '../utils';
import * as api from '../api';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NowPlaying } from './NowPlaying';
import { RecentAnime } from './RecentAnime';
import { AnimeGrid } from './AnimeGrid';
import { StatsView } from './StatsView';
import { TorrentsView } from './TorrentsView';
import { LibraryView } from './LibraryView';
import { Toast } from './Toast';
import { SelectionBar } from './SelectionBar';
import { AnimeDetailsModal } from './modals/AnimeDetails';
import { SettingsModal } from './modals/Settings';
import { ChangelogModal } from './modals/Changelog';
import { CleanupModal } from './modals/Cleanup';
import { UpcomingOverlay } from './modals/Upcoming';

export function App() {
    // Local UI state
    const [filterName, setFilterName] = useState('');
    const [filterSeason, setFilterSeason] = useState('');
    const [filterSort, setFilterSort] = useState('progress');
    const [filterFormat, setFilterFormat] = useState('');
    const [filterYear, setFilterYear] = useState('');

    // Modal state
    const [detailsAnime, setDetailsAnime] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [showCleanup, setShowCleanup] = useState(false);
    const [showUpcoming, setShowUpcoming] = useState(false);

    // Fetch anime list + settings on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [list, settings] = await Promise.all([
                    api.fetchAnimeList(),
                    api.loadSettings()
                ]);
                animeList.value = list || [];
                userSettings.value = settings || {};
            } catch (e) {
                console.error('Failed to load initial data:', e);
            }
        };
        loadData();
    }, []);

    // Refresh handler
    const handleRefresh = useCallback(async () => {
        try {
            if (activeTab.value === 'LIBRARY') {
                const data = await api.fetchLibrary(true);
                libraryData.value = data || [];
                showToast('Library refreshed');
            } else {
                const list = await api.fetchAnimeList();
                animeList.value = list || [];
                localStorage.setItem('lastAnilistSync', Date.now().toString());
                showToast('List refreshed');
            }
        } catch (e) {
            showToast('Refresh failed', 'error');
        }
    }, [activeTab.value]);

    // Settings saved handler
    const handleSettingsSaved = useCallback(async () => {
        const settings = await api.loadSettings();
        userSettings.value = settings || {};
        showToast('Settings saved');
    }, []);

    // Sync completed handler
    const handleSynced = useCallback(async () => {
        localStorage.setItem('lastAnilistSync', Date.now().toString());
        await handleRefresh();
    }, [handleRefresh]);

    // Filter + Sort the anime list
    const filteredList = useMemo(() => {
        const tab = activeTab.value;
        const list = animeList.value;
        const settings = userSettings.value;
        const sort = sortBy.value;
        const dir = sortDirection.value;
        const activeSeasons = selectedSidebarSeasons.value;
        const activeGenres = selectedGenres.value;

        if (!['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'].includes(tab)) return [];

        let filtered = list.filter(a => a.listStatus === tab);

        // Name filter
        if (filterName) {
            const q = filterName.toLowerCase();
            filtered = filtered.filter(a => {
                const title = getDisplayTitle(a, settings);
                return fuzzyMatch(q, title) || fuzzyMatch(q, a.title?.english || '') || fuzzyMatch(q, a.title?.romaji || '');
            });
        }

        // Season dropdown filter
        if (filterSeason) {
            filtered = filtered.filter(a => {
                const seasons = getAnimeSeasons(a);
                return seasons.includes(filterSeason);
            });
        }

        // Format filter
        if (filterFormat) {
            filtered = filtered.filter(a => (a.format || '').toUpperCase() === filterFormat.toUpperCase());
        }

        // Year filter
        if (filterYear) {
            const yr = parseInt(filterYear);
            filtered = filtered.filter(a => a.seasonYear === yr);
        }

        // Season pills filter
        if (activeSeasons.size < 4) {
            filtered = filtered.filter(a => {
                const seasons = getAnimeSeasons(a);
                return seasons.length === 0 || seasons.some(s => activeSeasons.has(s));
            });
        }

        // Genre filter
        if (activeGenres.size > 0) {
            filtered = filtered.filter(a => {
                if (!a.genres) return false;
                return Array.from(activeGenres).every(g => a.genres.includes(g));
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let va, vb;
            const titleA = getDisplayTitle(a, settings);
            const titleB = getDisplayTitle(b, settings);
            switch (sort) {
                case 'title': va = titleA.toLowerCase(); vb = titleB.toLowerCase(); break;
                case 'score': va = a.averageScore || 0; vb = b.averageScore || 0; break;
                case 'popularity': va = a.popularity || 0; vb = b.popularity || 0; break;
                case 'season': va = (a.seasonYear || 0) * 10 + (['WINTER', 'SPRING', 'SUMMER', 'FALL'].indexOf(a.season || '') + 1); vb = (b.seasonYear || 0) * 10 + (['WINTER', 'SPRING', 'SUMMER', 'FALL'].indexOf(b.season || '') + 1); break;
                case 'studio': va = (a.studio || '').toLowerCase(); vb = (b.studio || '').toLowerCase(); break;
                case 'updatedAt': va = a.updatedAt || 0; vb = b.updatedAt || 0; break;
                case 'progress':
                default: va = a.progress || 0; vb = b.progress || 0; break;
            }
            return va > vb ? dir : va < vb ? -dir : 0;
        });

        return filtered;
    }, [animeList.value, activeTab.value, filterName, filterSeason, filterFormat, filterYear, sortBy.value, sortDirection.value, selectedSidebarSeasons.value, selectedGenres.value, userSettings.value]);

    // Fetch library when tab is selected
    useEffect(() => {
        if (activeTab.value === 'LIBRARY' && (!libraryData.value || libraryData.value.length === 0)) {
            api.fetchLibrary().then(data => {
                libraryData.value = data || [];
            }).catch(e => console.error('Failed to fetch library:', e));
        }
    }, [activeTab.value]);

    const tab = activeTab.value;
    const isListTab = ['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'].includes(tab);

    // Sidebar collapsed class on body
    useEffect(() => {
        document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed.value);
    }, [sidebarCollapsed.value]);

    // Update counts
    const counts = useMemo(() => {
        const list = animeList.value;
        return {
            CURRENT: list.filter(a => a.listStatus === 'CURRENT').length,
            PLANNING: list.filter(a => a.listStatus === 'PLANNING').length,
            COMPLETED: list.filter(a => a.listStatus === 'COMPLETED').length,
            DROPPED: list.filter(a => a.listStatus === 'DROPPED').length,
        };
    }, [animeList.value]);

    const showReview = () => {
        if (pendingApiRequests.value.length === 0) {
            showToast('No pending changes to review.');
            return;
        }
        setShowChangelog(true);
    };

    return (
        <div class="app-layout">
            <Sidebar
                filterYear={filterYear} onFilterYearChange={setFilterYear}
                filterFormat={filterFormat} onFilterFormatChange={setFilterFormat}
                onOpenSettings={() => setShowSettings(true)}
            />

            <div class="app-container">
                <Header
                    onOpenSettings={() => setShowSettings(true)}
                />

                <div class="top-dashboard-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '450px 1fr', marginBottom: '2rem', alignItems: 'stretch', height: '350px' }}>
                    <section id="recent-anime" class="now-playing-card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div class="section-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border)', margin: 0, flexShrink: 0, justifyContent: 'flex-start', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/></svg>
                            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Anime Activity</h2>
                        </div>
                        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
                            <RecentAnime onOpenDetails={(a) => setDetailsAnime(a)} />
                        </div>
                    </section>

                    <div class="now-playing-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <NowPlaying onOpenDetails={(a) => setDetailsAnime(a)} />
                    </div>
                </div>

                <section id="anime-list-section" class="anime-list-section">
                    <div class="section-header">
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <h2>My Anime List</h2>
                            <button id="btn-show-upcoming" class="upcoming-btn" title="Show Airing & Upcoming Anime" onClick={() => setShowUpcoming(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                <span>Show Upcoming</span>
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            {pendingApiRequests.value.length > 0 && (
                                <div id="pending-changes-info" class="pending-info">
                                    <a href="#" id="link-reset-changes" class="pending-link" onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm("Reset all pending changes?")) {
                                            pendingApiRequests.value = [];
                                            handleRefresh();
                                            showToast("Pending changes cleared");
                                        }
                                    }}>Reset</a>
                                    <span class="pending-separator">•</span>
                                    <a href="#" id="link-review-changes" class="pending-link" onClick={(e) => { e.preventDefault(); showReview(); }}>Review <span id="pending-count">{pendingApiRequests.value.length}</span> Changes</a>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {localStorage.getItem('lastAnilistSync') && <span id="last-synced-time" class="last-synced-time">{`Last synced: ${getRelativeTime(Math.floor(parseInt(localStorage.getItem('lastAnilistSync')) / 1000))}`}</span>}
                                <button id="btn-pull-anilist" class="refresh-btn sync-btn-with-text" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={async () => {
                                    if (!confirm("Download latest list from AniList? This will overwrite any unsynced local changes.")) return;
                                    try { pendingApiRequests.value = []; await handleRefresh(); showToast("Pulled latest list from AniList"); } catch (e) { showToast("Pull failed", "error"); }
                                }} aria-label="Pull from AniList" title="Download latest list from AniList (Overwrites local state)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </button>
                                <button id="btn-refresh-list" class={`refresh-btn sync-btn-with-text ${pendingApiRequests.value.length > 0 ? 'pulse-sync' : ''}`} onClick={async () => {
                                    if (!confirm("Upload all local changes to AniList?")) return;
                                    if (pendingApiRequests.value.length > 0) showReview();
                                    else await handleRefresh();
                                }} aria-label="Update to AniList" title="Upload local changes to AniList">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v-7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
                                    <span>Update to AniList</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="tabs">
                        <button id="tab-current" class={`tab ${tab === 'CURRENT' ? 'active' : ''}`} onClick={() => setActiveTab('CURRENT')}>
                            In Progress <span id="count-current" class="tab-count">{counts.CURRENT}</span>
                        </button>
                        <button id="tab-planning" class={`tab ${tab === 'PLANNING' ? 'active' : ''}`} onClick={() => setActiveTab('PLANNING')}>
                            Planning <span id="count-planning" class="tab-count">{counts.PLANNING}</span>
                        </button>
                        <button id="tab-completed" class={`tab ${tab === 'COMPLETED' ? 'active' : ''}`} onClick={() => setActiveTab('COMPLETED')}>
                            Completed <span id="count-completed" class="tab-count">{counts.COMPLETED}</span>
                        </button>
                        <button id="tab-dropped" class={`tab ${tab === 'DROPPED' ? 'active' : ''}`} onClick={() => setActiveTab('DROPPED')}>
                            Dropped <span id="count-dropped" class="tab-count">{counts.DROPPED}</span>
                        </button>
                        <div class="tab-separator"></div>
                        <button id="tab-stats" class={`tab ${tab === 'STATS' ? 'active' : ''}`} onClick={() => setActiveTab('STATS')}>
                            Stats
                        </button>
                        <button id="tab-torrents" class={`tab ${tab === 'TORRENTS' ? 'active' : ''}`} onClick={() => setActiveTab('TORRENTS')}>
                            Torrents
                        </button>
                        <div class="tab-separator"></div>
                        <button id="tab-library" class={`tab ${tab === 'LIBRARY' ? 'active' : ''}`} onClick={() => setActiveTab('LIBRARY')} style={{ marginLeft: 'auto' }}>
                            Library
                        </button>
                    </div>

                    {isListTab && (
                        <AnimeGrid
                            viewMode={viewMode.value}
                            onViewModeChange={(m) => setViewMode(m)}
                            filteredList={filteredList}
                            filterName={filterName}
                            filterSeason={filterSeason}
                            filterSort={filterSort}
                            onFilterNameChange={setFilterName}
                            onFilterSeasonChange={setFilterSeason}
                            onFilterSortChange={(v) => { setFilterSort(v); sortBy.value = v; }}
                            onOpenDetails={(a) => setDetailsAnime(a)}
                            onCleanup={() => setShowCleanup(true)}
                            tab={tab}
                        />
                    )}

                    {tab === 'STATS' && <StatsView />}
                    {tab === 'TORRENTS' && <TorrentsView />}
                    {tab === 'LIBRARY' && <LibraryView />}
                </section>
            </div>

            <SelectionBar onShowReview={showReview} />
            <Toast />

            {/* Modals */}
            <AnimeDetailsModal
                anime={detailsAnime}
                visible={!!detailsAnime}
                onClose={() => setDetailsAnime(null)}
            />
            <SettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                onSaved={handleSettingsSaved}
            />
            <ChangelogModal
                visible={showChangelog}
                onClose={() => setShowChangelog(false)}
                onSynced={handleSynced}
            />
            <CleanupModal
                visible={showCleanup}
                onClose={() => setShowCleanup(false)}
            />
            <UpcomingOverlay
                visible={showUpcoming}
                onClose={() => setShowUpcoming(false)}
            />

            {/* API Errors Global Floating Notification */}
            {apiErrorMessages.value.length > 0 && (
                <div class="api-errors-container">
                    {apiErrorMessages.value.map(err => (
                        <div key={err.id} class="api-error-toast">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            <div class="api-error-content">
                                <strong>API Warning</strong>
                                <span>{err.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
