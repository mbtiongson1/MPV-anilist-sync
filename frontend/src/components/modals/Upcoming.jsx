import { useState, useEffect } from 'preact/hooks';
import { upcomingCache, animeList, showToast } from '../../store';
import { escapeHtml, getCachedImageUrl } from '../../utils';
import * as api from '../../api';

export function UpcomingOverlay({ visible, onClose }) {
    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState({ season: 'AIRING', year: null, label: 'Discovery' });
    const [seasonCache, setSeasonCache] = useState({}); // Local in-memory cache for fast tab switching

    if (!visible) return null;

    // Generate season tabs
    const generateTabs = () => {
        const seasons = ["WINTER", "SPRING", "SUMMER", "FALL"];
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();
        const currIdx = Math.floor(m / 3);

        const tabs = [
            { season: 'AIRING', year: null, label: '★ Discovery' }
        ];

        // Add 5 quarters (current + next 4)
        for (let i = 0; i < 5; i++) {
            const idx = (currIdx + i) % 4;
            const yearOff = Math.floor((currIdx + i) / 4);
            const label = `${seasons[idx]} ${y + yearOff}`;
            tabs.push({ season: seasons[idx], year: y + yearOff, label });
        }
        return tabs;
    };

    const tabs = generateTabs();

    const fetchData = async (refresh = false, season = selectedTab.season, year = selectedTab.year) => {
        const cacheKey = `${season}_${year}`;
        if (!refresh && seasonCache[cacheKey]) {
            upcomingCache.value = seasonCache[cacheKey];
            return;
        }

        setLoading(true);
        try {
            const data = await api.fetchUpcoming(refresh, season === 'AIRING' ? null : season, year);
            upcomingCache.value = data;
            setSeasonCache(prev => ({ ...prev, [cacheKey]: data }));
        } catch (err) {
            showToast('Failed to fetch anime for this season', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) fetchData();
    }, [visible, selectedTab.season, selectedTab.year]);

    const handleTabClick = (tab) => {
        setSelectedTab(tab);
    };

    const data = upcomingCache.value || [];

    const handleAddToList = async (mediaId, status) => {
        try {
            const result = await api.changeStatus(mediaId, status);
            if (result.success) {
                showToast(`Successfully moved to your ${status.toLowerCase()} list!`);
            } else {
                showToast('Failed to update list entry', 'error');
            }
        } catch (err) {
            showToast('Error updating list', 'error');
        }
    };

    return (
        <div id="upcoming-overlay" class="upcoming-overlay">
            <div class="upcoming-window">
                <div class="upcoming-header">
                    <div class="header-left">
                        <h2>Explore Anime</h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        {loading && <div class="spinner-small" />}
                        <button class="refresh-btn" onClick={() => fetchData(true)} title="Refresh">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                            </svg>
                        </button>
                        <button id="btn-close-upcoming" class="icon-btn" onClick={onClose} title="Close">×</button>
                    </div>
                </div>

                <div class="season-selector">
                    {tabs.map(tab => (
                        <div 
                            key={tab.label} 
                            class={`season-tab ${selectedTab.label === tab.label ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab)}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>

                <div id="upcoming-grid" class="upcoming-grid">
                    {!loading && data.length === 0 && (
                        <div class="no-results">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style="opacity: 0.2; margin-bottom: 1rem;">
                                <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                            <p>No anime found for this season yet.</p>
                        </div>
                    )}
                    {data.map(anime => {
                        const mediaId = anime.mediaId;
                        const title = anime.title?.romaji || anime.title?.english || 'Unknown';
                        const cover = getCachedImageUrl(anime.coverImage?.large || anime.coverImage?.medium || '');
                        const description = anime.description || 'No description available.';
                        const studio = anime.studio || 'Unknown Studio';
                        const season = anime.season || '';
                        const year = anime.seasonYear || '';

                        const localEntry = animeList.value.find(a => a.mediaId === mediaId);
                        let statusText = 'Not in list';
                        let statusClass = 'status-not-in-list';
                        if (localEntry) {
                            const status = localEntry.listStatus;
                            statusText = status === 'CURRENT' ? 'In Progress' : status === 'PLANNING' ? 'Planning' : status === 'COMPLETED' ? 'Completed' : status === 'DROPPED' ? 'Dropped' : status;
                            statusClass = `status-${status.toLowerCase()}`;
                        }

                        const nextAiring = anime.nextAiringEpisode;
                        let airingInfo = '';
                        if (nextAiring) {
                            const now = Math.floor(Date.now() / 1000);
                            const diff = nextAiring.airingAt - now;
                            if (diff > 0) {
                                const days = Math.floor(diff / 86400);
                                const hours = Math.floor((diff % 86400) / 3600);
                                airingInfo = days > 0 ? `Ep ${nextAiring.episode} in ${days}d ${hours}h` : `Ep ${nextAiring.episode} in ${hours}h`;
                            } else {
                                airingInfo = `Ep ${nextAiring.episode} aired`;
                            }
                        }

                        return (
                            <div key={mediaId} class="upcoming-tile">
                                <div class={`upcoming-status-tag ${statusClass}`}>{statusText}</div>
                                <div class="upcoming-add-wrapper">
                                    <button class="btn-upcoming-add" onClick={(e) => {
                                        e.stopPropagation();
                                        const dd = e.currentTarget.nextElementSibling;
                                        document.querySelectorAll('.add-dropdown.show').forEach(d => { if (d !== dd) d.classList.remove('show'); });
                                        dd.classList.toggle('show');
                                    }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </button>
                                    <div class="add-dropdown">
                                        <div class="add-option" onClick={(e) => { e.stopPropagation(); handleAddToList(mediaId, 'PLANNING'); }}>Add to Planning</div>
                                        <div class="add-option" onClick={(e) => { e.stopPropagation(); handleAddToList(mediaId, 'CURRENT'); }}>Add to Watching</div>
                                    </div>
                                </div>
                                <div class="upcoming-tile-cover">
                                    <img src={cover} alt={escapeHtml(title)} loading="lazy" />
                                    {airingInfo && <div class="upcoming-airing-info">{airingInfo}</div>}
                                </div>
                                <div class="upcoming-tile-content">
                                    <div class="upcoming-tile-header">
                                        <div class="upcoming-tile-title" title={title}>{escapeHtml(title)}</div>
                                    </div>
                                    <div class="upcoming-tile-meta">
                                        <span class="upcoming-badge badge-season">{season} {year}</span>
                                        <span class="upcoming-badge badge-studio">{escapeHtml(studio)}</span>
                                        {anime.format && <span class="upcoming-badge badge-format">{anime.format}</span>}
                                    </div>
                                    <div class="upcoming-description" dangerouslySetInnerHTML={{ __html: description }}></div>
                                    <div class="upcoming-stats">
                                        <div class="upcoming-stat-item" title="Popularity">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                            <span>{(anime.popularity || 0).toLocaleString()}</span>
                                        </div>
                                        {anime.averageScore && (
                                            <div class="upcoming-stat-item" title="Score">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                <span>{anime.averageScore}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
