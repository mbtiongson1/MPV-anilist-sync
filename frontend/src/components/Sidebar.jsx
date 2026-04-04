import { activeTab, sidebarCollapsed, selectedSidebarSeasons, selectedGenres, animeList, userSettings, setActiveTab } from '../store';
import { genreColors, getCurrentSeason, getSeasonEndDate, getTimeRemaining } from '../utils';
import { SeasonIcon } from '../icons';

export function Sidebar({ filterYear, onFilterYearChange, filterFormat, onFilterFormatChange, onOpenSettings }) {
    const collapsed = sidebarCollapsed.value;
    const tab = activeTab.value;

    const navItems = [
        { tab: 'CURRENT', label: 'In Progress', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
        { tab: 'PLANNING', label: 'Planning', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
        { tab: 'COMPLETED', label: 'Completed', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
        { tab: 'DROPPED', label: 'Dropped', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
    ];

    const extraNavItems = [
        { tab: 'STATS', label: 'Stats', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
        { tab: 'TORRENTS', label: 'Torrents', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> },
        { tab: 'LIBRARY', label: 'Library', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg> },
    ];

    const toggleSidebar = () => {
        const newVal = !sidebarCollapsed.value;
        sidebarCollapsed.value = newVal;
        localStorage.setItem('sidebarCollapsed', newVal);
    };

    const currentSeason = getCurrentSeason();
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(filterYear) || currentYear;
    const isCurrentYear = selectedYear === currentYear;
    const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

    const toggleSeason = (season) => {
        const newSet = new Set(selectedSidebarSeasons.value);
        if (newSet.has(season)) newSet.delete(season); else newSet.add(season);
        selectedSidebarSeasons.value = newSet;
    };

    const resetFilters = () => {
        onFilterFormatChange('');
        onFilterYearChange('');
        selectedGenres.value = new Set();
        selectedSidebarSeasons.value = new Set(['WINTER', 'SPRING', 'SUMMER', 'FALL']);
    };

    // Gather unique genres
    const genres = new Set();
    animeList.value.forEach(a => { if (a.genres) a.genres.forEach(g => genres.add(g)); });
    const ignored = ['Ecchi', 'Hentai', 'Adult'];
    const sortedGenres = Array.from(genres).filter(g => !ignored.includes(g)).sort();

    const toggleGenre = (genre) => {
        const newSet = new Set(selectedGenres.value);
        if (newSet.has(genre)) newSet.delete(genre); else newSet.add(genre);
        selectedGenres.value = newSet;
    };

    const yearOptions = [];
    for (let y = currentYear + 1; y >= currentYear - 7; y--) yearOptions.push(y);

    return (
        <nav id="app-sidebar" class={collapsed ? 'collapsed' : ''}>
            <div class="sidebar-header">
                <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle Sidebar" onClick={toggleSidebar}>
                    <svg id="sidebar-toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed
                            ? <><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></>
                            : <><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></>
                        }
                    </svg>
                </button>
                <div class="logo" style="margin-left: 0.75rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 8L16 12L10 16V8Z" fill="currentColor" />
                    </svg>
                    <span>Tracker</span>
                </div>
            </div>

            <div class="sidebar-content">
                <div class="sidebar-section">
                    <div class="sidebar-section-title">Lists</div>
                    <div class="sidebar-nav">
                        {navItems.map(n => (
                            <a key={n.tab} class={`sidebar-item ${tab === n.tab ? 'active' : ''}`} data-tab={n.tab} title={n.label} onClick={() => setActiveTab(n.tab)}>
                                {n.icon}<span>{n.label}</span>
                            </a>
                        ))}
                        <div class="sidebar-separator" />
                        {extraNavItems.map(n => (
                            <a key={n.tab} class={`sidebar-item ${tab === n.tab ? 'active' : ''}`} data-tab={n.tab} title={n.label} onClick={() => setActiveTab(n.tab)}>
                                {n.icon}<span>{n.label}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Filters</span>
                        <button id="btn-reset-filters" class="icon-btn reset-filters-btn" title="Reset Filters to Default" onClick={resetFilters}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        </button>
                    </div>
                    <div class="sidebar-filters">
                        <div class="filter-group-sidebar">
                            <label for="filter-format">Format</label>
                            <select id="filter-format" value={filterFormat} onChange={(e) => onFilterFormatChange(e.target.value)}>
                                <option value="">All Formats</option>
                                <option value="TV">TV</option>
                                <option value="MOVIE">Movie</option>
                                <option value="OVA">OVA</option>
                                <option value="ONA">ONA</option>
                                <option value="SPECIAL">Special</option>
                            </select>
                        </div>
                        <div class="filter-group-sidebar">
                            <label for="filter-year-sidebar">Year</label>
                            <select id="filter-year-sidebar" value={filterYear} onChange={(e) => onFilterYearChange(e.target.value)}>
                                <option value="">All Years</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div class="filter-group-sidebar">
                            <label>Season</label>
                            <div id="season-filter-pills" class="season-pills">
                                {seasons.map(season => {
                                    const isActive = selectedSidebarSeasons.value.has(season);
                                    const isCurrent = season === currentSeason && (isCurrentYear || !filterYear);
                                    const label = season.charAt(0) + season.slice(1).toLowerCase();
                                    const endDate = getSeasonEndDate(season, selectedYear);
                                    const remaining = isCurrent ? getTimeRemaining(endDate) : null;

                                    return (
                                        <div key={season} class="season-pill-wrapper">
                                            <button class={`season-pill ${season.toLowerCase()} ${isActive ? 'active' : ''}`} data-season={season} onClick={() => toggleSeason(season)}>
                                                <SeasonIcon season={season} size={14} />
                                                <span>{label}{filterYear ? ` ${filterYear}` : ''}</span>
                                                {isCurrent && <div class="live-dot" style="margin-left: 0.4rem;" />}
                                            </button>
                                            {remaining && <span class="season-end-text">{remaining}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div class="filter-group-sidebar">
                            <label>Genres</label>
                            <div id="genre-filter-list" class="genre-filter-list">
                                {sortedGenres.map(genre => {
                                    const color = genreColors[genre] || '#94a3b8';
                                    const isActive = selectedGenres.value.has(genre);
                                    return (
                                        <div key={genre} class={`genre-chip-sidebar ${isActive ? 'active' : ''}`}
                                            style={{
                                                borderColor: color,
                                                color: isActive ? 'white' : color,
                                                background: isActive ? color : color + '10'
                                            }}
                                            onClick={() => toggleGenre(genre)}>
                                            {genre}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-footer">
                    <a class="sidebar-item" id="sidebar-settings" onClick={onOpenSettings}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        <span>Settings</span>
                    </a>
                </div>
            </div>
        </nav>
    );
}
