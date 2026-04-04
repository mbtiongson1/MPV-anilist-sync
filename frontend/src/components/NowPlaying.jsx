import { useEffect } from 'preact/hooks';
import { latestStatus, userSettings, animeList, showToast, activeSearchTerm, recordApiRequest, setActiveTab } from '../store';
import { escapeHtml, formatPopularity, getCachedImageUrl, getDisplayTitle } from '../utils';
import { ProgressBar } from './ProgressBar';
import { SearchIcon, FolderIcon } from '../icons';
import * as api from '../api';

export function NowPlaying({ onOpenDetails }) {
    const status = latestStatus.value;

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const data = await api.fetchStatus();
                latestStatus.value = data;
            } catch (e) {
                latestStatus.value = null;
            }
        }, 2000);
        // Initial fetch
        api.fetchStatus().then(data => latestStatus.value = data).catch(() => {});
        return () => clearInterval(poll);
    }, []);

    if (!status) {
        return <IdleState status={null} />;
    }

    if (!status.running || !status.title) {
        return <IdleState status={status} />;
    }

    const data = status;
    const selectedMediaId = data.selected_media_id;
    let displayTitle = data.base_title || data.title;

    if (displayTitle && (displayTitle.includes('/') || displayTitle.includes('\\'))) {
        displayTitle = displayTitle.split(/[\\/]/).pop();
    }

    if (selectedMediaId && userSettings.value?.title_overrides?.[selectedMediaId]) {
        displayTitle = userSettings.value.title_overrides[selectedMediaId];
    }

    const details = data.media_details || {};
    const rawCoverUrl = details.coverImage?.large || details.coverImage?.medium || '';
    const rawBannerUrl = details.bannerImage || rawCoverUrl;
    const coverUrl = getCachedImageUrl(rawCoverUrl);
    const bannerUrl = getCachedImageUrl(rawBannerUrl);

    const total = data.anilist_total_episodes || data.total_episodes || 0;
    const watched = data.watched_episodes || 0;
    const totalStr = total > 0 ? total : '?';
    const nextAiring = details.nextAiringEpisode || null;

    const stats = [];
    if (details.status) stats.push(details.status);
    if (details.season && details.seasonYear) stats.push(`${details.season} ${details.seasonYear}`);
    if (details.episodes) stats.push(`${details.episodes} eps`);
    if (details.averageScore) stats.push(`★ ${details.averageScore}%`);
    if (details.popularity) stats.push(`♥ ${formatPopularity(details.popularity)}`);

    const summary = (details.description || '').replace(/<[^>]+>/g, '');
    const seasonOptions = Array.isArray(data.season_options) ? data.season_options : [];

    const handleSeasonChange = async (e) => {
        const mediaId = parseInt(e.target.value);
        try {
            await api.selectSeason(mediaId);
        } catch (err) {
            console.error('Season select error:', err);
        }
    };

    const handleSync = async () => {
        if (watched < 1) return;
        const anime = animeList.value.find(a => a.mediaId == selectedMediaId);
        if (anime) {
            recordApiRequest('PROGRESS', selectedMediaId, { episode: watched }, `${displayTitle}: Set progress to ${watched}`);
            anime.progress = watched;
            animeList.value = [...animeList.value];
            showToast("Progress recorded (Pending Update)");
        }
    };

    const handleOpenFolder = () => {
        if (selectedMediaId) api.openFolder(selectedMediaId);
    };

    const handleSearchTorrents = () => {
        if (data.base_title || data.title) {
            activeSearchTerm.value = data.base_title || data.title;
            setActiveTab('TORRENTS');
        }
    };

    return (
        <section id="now-playing" class="now-playing-card modern-overhaul" style={{ flex: 1, minHeight: '350px' }}>
            <div class="np-background-banner" id="np-banner" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}></div>
            <div class="np-overlay"></div>
            
            <div class="details-modal-grid" style={{ padding: '1.5rem', position: 'relative', zIndex: 2, height: '100%', display: 'flex', gap: '1.5rem' }}>
                <div class="details-modal-left" style={{ width: '200px', flexShrink: 0 }}>
                    <img id="np-cover" class="details-modal-cover shadow-lg" src={coverUrl} alt="Cover" style={{ width: '100%', borderRadius: '8px', cursor: rawCoverUrl ? 'pointer' : 'default' }} onClick={() => rawCoverUrl && window.open(rawCoverUrl, '_blank')} />
                </div>
                
                <div class="details-modal-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div class="np-badge" id="np-player-badge" style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>
                                {data.watcher_name ? `NOW PLAYING (${data.watcher_name})` : 'NOW PLAYING'}
                            </div>
                            <h1 id="np-title" class="np-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>
                                {selectedMediaId ? (
                                    <a href={`https://anilist.co/anime/${selectedMediaId}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {escapeHtml(displayTitle)}
                                    </a>
                                ) : displayTitle}
                            </h1>
                            <p id="np-studio" class="np-studio" style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {details.studio || ''}
                            </p>
                        </div>
                        <div class="np-top-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button id="btn-open-np-folder" class="icon-btn" style={{ padding: '0.5rem' }} onClick={handleOpenFolder} title="Open Folder">
                                <FolderIcon size={16} />
                            </button>
                            <button id="btn-search-np-torrents" class="icon-btn" style={{ padding: '0.5rem' }} onClick={handleSearchTorrents} title="Search Torrents">
                                <SearchIcon size={16} />
                            </button>
                            <button id="btn-edit-nowplaying" class="icon-btn" style={{ padding: '0.5rem' }} onClick={() => {
                                if (selectedMediaId) {
                                    const anime = animeList.value.find(a => a.mediaId == selectedMediaId);
                                    if (anime) onOpenDetails?.(anime);
                                }
                            }} title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
                            </button>
                        </div>
                    </div>

                    <div id="np-stats" class="np-stats-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '0.25rem 0' }}>
                        {stats.map((s, i) => <span key={i} class="np-stat-tag" style={{ background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
                    </div>
                    
                    <div class="np-summary-container" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                        <div id="np-summary" class="np-summary-text" style={{ fontSize: '0.95rem', lineHeight: 1.6, opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {summary}
                        </div>
                    </div>

                    <div class="np-controls-zone" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div class="media-controls-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button id="btn-play-prev" class="media-btn" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: data.can_prev ? 1 : 0.5 }} onClick={() => api.playPrev()} disabled={!data.can_prev} title="Previous Episode">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                                </button>
                                <button id="btn-play-pause" class="media-btn main-play-btn" style={{ background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => api.playPause()} title="Play/Pause">
                                    {data.paused ? (
                                        <svg id="svg-play" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z"/></svg>
                                    ) : (
                                        <svg id="svg-pause" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                    )}
                                </button>
                                <button id="btn-play-next" class="media-btn" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: data.can_next ? 1 : 0.5 }} onClick={() => api.playNext()} disabled={!data.can_next} title="Next Episode">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                                </button>
                            </div>
                            <div id="np-progress-label" class="np-progress-label" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>E{watched} / {totalStr}</div>
                        </div>

                        <div class="np-progress-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                             <button id="btn-minus" class="icon-btn-minimal" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => api.adjustEpisode(-1)} aria-label="Decrease Episode">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                            <div id="np-progress-segments" class="progress-segments" style={{ flex: 1, height: '8px' }}>
                                <ProgressBar progress={watched} total={total} nextAiringEpisode={nextAiring} />
                            </div>
                            <button id="btn-plus" class="icon-btn-minimal" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => api.adjustEpisode(1)} aria-label="Increase Episode">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div id="np-season-selector" class="np-season-selector-modern" style={{ display: 'flex', alignItems: 'center' }}>
                                {seasonOptions.length > 0 && (
                                    <>
                                        <label for="np-season" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.6, marginRight: '0.5rem' }}>Season</label>
                                        <select id="np-season" onChange={handleSeasonChange} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.5rem', borderRadius: '4px' }}>
                                            {seasonOptions.sort((a, b) => (b.seasonYear || 0) - (a.seasonYear || 0)).map(opt => (
                                                <option key={opt.mediaId} value={opt.mediaId} selected={opt.mediaId === selectedMediaId} style={{ background: '#1e293b' }}>
                                                    {escapeHtml(opt.title || `Season ${opt.season || ''} ${opt.seasonYear || ''}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                            <button id="btn-sync" class="sync-btn-modern" style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={handleSync}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.83-2.06"/></svg>
                                Sync to AniList
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function IdleState({ status }) {
    const data = status;
    const hasResume = data?.last_played_file;
    let lastTitle = data?.last_played_title || 'Last Video';
    if (lastTitle && (lastTitle.includes('/') || lastTitle.includes('\\'))) {
        lastTitle = lastTitle.split(/[\\/]/).pop();
    }

    return (
        <section id="idle-state" class="idle-card">
            <div class="idle-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                    <path d="M10 9l4 2.5L10 14V9Z" fill="currentColor" opacity="0.5"/>
                </svg>
            </div>
            <h2>Waiting for media player...</h2>
            <p>Open a video file in MPV or MPC-HC to start tracking automatically.</p>
            {hasResume && (
                <div id="resume-container" style={{ marginTop: '2rem', display: 'flex', alignItems: 'stretch', gap: '0.5rem', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                    <button id="btn-resume-last" class="resume-btn-premium" style={{ margin: 0, flex: 1 }} onClick={() => api.resumePlay()} title="Resume Last Video">
                        <div class="resume-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <div class="resume-info">
                            <span class="resume-label">Resume Last Played</span>
                            <span id="resume-filename" class="resume-filename">{lastTitle}</span>
                        </div>
                    </button>
                    <button id="btn-open-folder" class="resume-folder-btn" onClick={() => api.openFolderPost()} title="Open Folder">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </button>
                </div>
            )}
        </section>
    );
}
