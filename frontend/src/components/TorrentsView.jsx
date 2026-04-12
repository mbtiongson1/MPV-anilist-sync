import { useState, useEffect, useRef } from 'preact/hooks';
import { animeList, userSettings, torrentFilters, torrentCache, showToast, activeSearchTerm } from '../store';
import { escapeHtml, parseSize, formatBytes, getRelativeTime } from '../utils';
import { DownloadIcon, ExternalLinkIcon, SearchIcon, InfoIcon } from '../icons';
import * as api from '../api';

export function TorrentsView() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(torrentCache.value.items || []);
    const [selectedTorrents, setSelectedTorrents] = useState(new Set());
    const [sortCol, setSortCol] = useState(torrentCache.value.sortBy || 'date');
    const [sortDir, setSortDir] = useState(torrentCache.value.sortDir || -1);

    const searchRef = useRef(null);
    const filters = torrentFilters.value;

    // Pre-fill from activeSearchTerm
    const initialQuery = activeSearchTerm.value || torrentCache.value.query || '';
    useEffect(() => {
        if (activeSearchTerm.value) {
            const term = activeSearchTerm.value;
            activeSearchTerm.value = '';
            if (searchRef.current) searchRef.current.value = term;
            performSearch(term);
        }
    }, []);

    // Pre-fill group from settings
    useEffect(() => {
        if (!filters.group && userSettings.value?.preferred_groups) {
            const groups = userSettings.value.preferred_groups;
            const g = Array.isArray(groups) ? (groups[0] || '').replace(/[\[\]]/g, '') : String(groups).split(',')[0].replace(/[\[\]]/g, '').trim();
            torrentFilters.value = { ...filters, group: g };
        }
    }, []);

    const [category, setCategory] = useState(filters.category);
    const [nyaaFilter, setNyaaFilter] = useState(filters.nyaaFilter);
    const [resolution, setResolution] = useState(filters.resolution);
    const [dateFilter, setDateFilter] = useState(filters.dateFilter);
    const [group, setGroup] = useState(filters.group);
    const [episode, setEpisode] = useState(filters.episode);
    const [airingOnly, setAiringOnly] = useState(filters.airingOnly);

    const saveFilters = () => {
        torrentFilters.value = { category, nyaaFilter, resolution, dateFilter, group, episode, airingOnly };
    };

    const parseEpisodeExpr = (expr) => {
        if (!expr) return [];
        const eps = [];
        expr.split(',').forEach(part => {
            part = part.trim();
            if (!part) return;
            const rng = part.split('-').map(s => parseInt(s.trim(), 10));
            if (rng.length === 2 && !isNaN(rng[0]) && !isNaN(rng[1])) {
                for (let e = rng[0]; e <= rng[1]; e++) eps.push(e);
            } else if (rng.length === 1 && !isNaN(rng[0])) eps.push(rng[0]);
        });
        return eps;
    };

    const performSearch = async (query) => {
        saveFilters();
        setLoading(true);
        setSelectedTorrents(new Set());
        const eps = parseEpisodeExpr(episode);
        try {
            let allItems = [];
            const q = group ? `${query} ${group}` : query;
            if (eps.length > 1) {
                const searches = eps.map(ep => {
                    const p = new URLSearchParams({ q, category, filter: nyaaFilter, episode: ep });
                    if (resolution) p.set('resolution', resolution);
                    return api.searchNyaa(p.toString()).then(r => r.map(t => ({ torrent: t, animeTitle: query, episode: ep, _fromSearch: true }))).catch(() => []);
                });
                allItems = (await Promise.all(searches)).flat();
            } else {
                const p = new URLSearchParams({ q, category, filter: nyaaFilter });
                if (resolution) p.set('resolution', resolution);
                if (eps.length === 1) p.set('episode', eps[0]);
                const r = await api.searchNyaa(p.toString());
                allItems = r.map(t => ({ torrent: t, animeTitle: query, _fromSearch: true }));
            }
            torrentCache.value = { items: allItems, query, isBatch: false, sortBy: sortCol, sortDir };
            setResults(allItems);
        } catch (e) {
            setResults([]);
            showToast('Search failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadBatchMissing = async () => {
        saveFilters();
        setLoading(true);
        setSelectedTorrents(new Set());
        try {
            const p = new URLSearchParams({ airing_only: airingOnly ? 'true' : 'false', category, filter: nyaaFilter });
            if (resolution) p.set('resolution', resolution);
            const data = await api.batchSearchNyaa(p.toString());
            const items = data.map(r => ({
                torrent: r.torrent || r,
                animeTitle: r.anime_title || r.title || '',
                episode: r.episode,
                _fromSearch: false,
                media_id: r.media_id
            }));
            torrentCache.value = { items, query: null, isBatch: true, sortBy: sortCol, sortDir };
            setResults(items);
            if (items.length === 0) showToast('No missing episodes found. You\'re all caught up!');
        } catch (e) {
            showToast('Batch scan failed', 'error');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (items) => {
        try {
            const payload = items.map(i => ({
                link: i.torrent?.link || i.torrent?.magnet,
                title: i.torrent?.title || 'Unknown',
                anime_title: i.animeTitle,
                media_id: i.media_id
            }));
            await api.downloadTorrents(payload);
            showToast(`Downloading ${payload.length} torrent${payload.length > 1 ? 's' : ''}!`);
        } catch (e) {
            showToast('Download failed', 'error');
        }
    };

    const toggleSort = (col) => {
        if (sortCol === col) setSortDir(-sortDir);
        else { setSortCol(col); setSortDir(-1); }
    };

    // Filter & sort results
    let displayItems = [...results];
    if (dateFilter !== 'all') {
        const now = Date.now();
        const cutoff = { '24h': 86400000, '48h': 172800000, '7d': 604800000, '30d': 2592000000 }[dateFilter] || 0;
        if (cutoff) displayItems = displayItems.filter(i => {
            const ts = i.torrent?.timestamp ? i.torrent.timestamp * 1000 : 0;
            return ts > 0 && (now - ts) < cutoff;
        });
    }

    displayItems.sort((a, b) => {
        const ta = a.torrent || {}, tb = b.torrent || {};
        let va, vb;
        switch (sortCol) {
            case 'size': va = parseSize(ta.size); vb = parseSize(tb.size); break;
            case 'date': va = ta.timestamp || 0; vb = tb.timestamp || 0; break;
            case 'seeders': va = ta.seeders || 0; vb = tb.seeders || 0; break;
            case 'leechers': va = ta.leechers || 0; vb = tb.leechers || 0; break;
            default: va = (ta.title || '').toLowerCase(); vb = (tb.title || '').toLowerCase();
        }
        return va > vb ? sortDir : va < vb ? -sortDir : 0;
    });

    const toggleSelect = (idx) => {
        const newSet = new Set(selectedTorrents);
        newSet.has(idx) ? newSet.delete(idx) : newSet.add(idx);
        setSelectedTorrents(newSet);
    };

    const selectRemaining = () => {
        const newSet = new Set();
        displayItems.forEach((_, i) => newSet.add(i));
        setSelectedTorrents(newSet);
    };

    const getSortIndicator = (col) => sortCol === col ? (sortDir === 1 ? ' ▲' : ' ▼') : '';

    return (
        <div id="torrents-results-view" class="torrents-view">
            {/* Toolbar */}
            <div class="torrents-toolbar">
                <div class="torrents-search">
                    <SearchIcon size={16} class="search-icon" />
                    <input type="text" id="torrents-search-input" ref={searchRef} placeholder="Search Nyaa.si..." defaultValue={initialQuery}
                        onKeyDown={(e) => { if (e.key === 'Enter') performSearch(e.target.value); }} />
                    <button class="clear-input-btn" onClick={() => { if (searchRef.current) searchRef.current.value = ''; }} title="Clear">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                    <button id="btn-search-go" class="search-go-btn" onClick={() => performSearch(searchRef.current?.value || '')} title="Search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </button>
                </div>
                <button id="btn-scan-airing" class="refresh-btn" onClick={loadBatchMissing} style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:12px;font-weight:600;">
                    <SearchIcon size={14} /> Auto Scan
                    <span class="info-icon" title="Scans your watching anime for missing episodes" style="display:inline-flex;opacity:0.7;margin-left:2px;"><InfoIcon size={12} /></span>
                </button>
                <a href="https://nyaa.si/?c=1_2" target="_blank" rel="noopener" class="refresh-btn nyaa-link-btn" style="display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;margin-left:auto;">
                    <ExternalLinkIcon size={14} /> Nyaa.si
                </a>
            </div>

            {/* Filter Bar */}
            <div class="torrents-filter-bar" id="torrents-filter-bar">
                <div class="filter-group">
                    <label class="filter-label">Category</label>
                    <select id="tf-category" class="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="1_2">English Subs</option><option value="1_3">Non-English</option><option value="1_4">Raw</option><option value="1_0">All Anime</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Trust</label>
                    <select id="tf-filter" class="filter-select" value={nyaaFilter} onChange={e => setNyaaFilter(e.target.value)}>
                        <option value="0">All</option><option value="1">No Remakes</option><option value="2">Trusted Only</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Resolution</label>
                    <select id="tf-resolution" class="filter-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                        <option value="">Default</option><option value="1080p">1080p</option><option value="720p">720p</option><option value="480p">480p</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Date</label>
                    <select id="tf-date" class="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                        <option value="all">All Time</option><option value="24h">Past 24h</option><option value="48h">Past 48h</option><option value="7d">Past 7 days</option><option value="30d">Past 30 days</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Subs / Group</label>
                    <div class="input-with-clear">
                        <input type="text" id="tf-group" class="filter-input" placeholder="e.g. SubsPlease" maxLength="40" value={group} onInput={e => setGroup(e.target.value)} />
                        <button class="clear-input-btn" onClick={() => setGroup('')} title="Clear">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Episodes</label>
                    <div class="input-with-clear">
                        <input type="text" id="tf-episode" class="filter-input" placeholder="e.g. 5-10, 12" style="width:90px;" value={episode} onInput={e => setEpisode(e.target.value)} />
                        <button class="clear-input-btn" onClick={() => setEpisode('')} title="Clear">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>
                <div class="filter-group filter-toggle-group">
                    <label class="filter-label">Airing Only</label>
                    <label class="toggle-switch" title="Scan only currently airing anime">
                        <input type="checkbox" id="tf-airing-only" checked={airingOnly} onChange={e => setAiringOnly(e.target.checked)} />
                        <span class="toggle-slider" />
                    </label>
                </div>
            </div>

            {/* Results */}
            <div id="torrents-results">
                {loading && <div class="loading-state"><div class="spinner" /><p>Searching Nyaa...</p></div>}
                {!loading && displayItems.length === 0 && (
                    <div class="empty-state torrents-placeholder">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <p>Search for an anime, or click <strong>Auto Scan</strong> to find missing episodes.</p>
                    </div>
                )}
                {!loading && displayItems.length > 0 && (
                    <table class="torrent-table">
                        <thead>
                            <tr>
                                <th style="width: 30px;"><input type="checkbox" onChange={(e) => e.target.checked ? selectRemaining() : setSelectedTorrents(new Set())} checked={selectedTorrents.size === displayItems.length && displayItems.length > 0} /></th>
                                <th style="cursor:pointer;" onClick={() => toggleSort('title')}>Title{getSortIndicator('title')}</th>
                                <th style="cursor:pointer;width:80px;" onClick={() => toggleSort('size')}>Size{getSortIndicator('size')}</th>
                                <th style="cursor:pointer;width:60px;" onClick={() => toggleSort('date')}>Date{getSortIndicator('date')}</th>
                                <th style="cursor:pointer;width:30px;" onClick={() => toggleSort('seeders')}>S{getSortIndicator('seeders')}</th>
                                <th style="cursor:pointer;width:30px;" onClick={() => toggleSort('leechers')}>L{getSortIndicator('leechers')}</th>
                                <th style="width:70px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, idx) => {
                                const t = item.torrent || {};
                                const isTrusted = t.category === 'trusted';
                                return (
                                    <tr key={idx} class={`${selectedTorrents.has(idx) ? 'selected' : ''} ${isTrusted ? 'trusted-row' : ''}`}>
                                        <td><input type="checkbox" checked={selectedTorrents.has(idx)} onChange={() => toggleSelect(idx)} /></td>
                                        <td class="torrent-title-cell">
                                            <div class="torrent-title">
                                                {item.animeTitle && <span class="torrent-anime-tag">{escapeHtml(item.animeTitle)}</span>}
                                                <span title={t.title}>{escapeHtml(t.title || '')}</span>
                                            </div>
                                        </td>
                                        <td>{t.size || '-'}</td>
                                        <td class="torrent-date-cell">{t.timestamp ? getRelativeTime(t.timestamp) : '-'}</td>
                                        <td class="seeders">{t.seeders ?? '-'}</td>
                                        <td class="leechers">{t.leechers ?? '-'}</td>
                                        <td>
                                            <div style="display:flex;gap:4px;">
                                                {t.link && <a href={t.link} target="_blank" rel="noopener" class="icon-btn" title="Open on Nyaa"><ExternalLinkIcon size={12} /></a>}
                                                <button class="icon-btn" title="Download" onClick={() => handleDownload([item])}><DownloadIcon size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Batch Download Bar */}
            {selectedTorrents.size > 0 && (
                <div id="batch-download-bar" class="batch-download-bar">
                    <div class="info"><span id="batch-count">{selectedTorrents.size} torrent{selectedTorrents.size > 1 ? 's' : ''} selected</span></div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="btn-select-remaining" class="btn-download-selected btn-secondary" style="background: rgba(255,255,255,0.1); color: white;" onClick={selectRemaining}>Select Remaining</button>
                        <button id="btn-download-selected" class="btn-download-selected" onClick={() => {
                            const items = Array.from(selectedTorrents).map(i => displayItems[i]).filter(Boolean);
                            handleDownload(items);
                            setSelectedTorrents(new Set());
                        }}>Download Selected</button>
                    </div>
                </div>
            )}
        </div>
    );
}
