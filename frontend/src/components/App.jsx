import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { animeList, activeTab, viewMode, selectedAnime, sortBy, sortDirection, currentPage, userSettings, sidebarCollapsed, selectedSidebarSeasons, selectedGenres, showToast, setViewMode, setActiveTab, pendingApiRequests } from '../store';
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
            const list = await api.fetchAnimeList();
            animeList.value = list || [];
            localStorage.setItem('lastAnilistSync', Date.now().toString());
            showToast('List refreshed');
        } catch (e) {
            showToast('Refresh failed', 'error');
        }
    }, []);

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

            <main class="main-content">
                <Header
                    viewMode={viewMode.value}
                    onViewModeChange={(m) => setViewMode(m)}
                    onOpenSettings={() => setShowSettings(true)}
                    onShowUpcoming={() => setShowUpcoming(true)}
                    onShowReview={showReview}
                    onRefresh={handleRefresh}
                />

                <NowPlaying onOpenDetails={(a) => setDetailsAnime(a)} />
                <RecentAnime onOpenDetails={(a) => setDetailsAnime(a)} />

                {isListTab && (
                    <AnimeGrid
                        viewMode={viewMode.value}
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
            </main>

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
        </div>
    );
}
