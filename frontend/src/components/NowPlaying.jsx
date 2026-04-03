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

    if (selectedMediaId && userSettings.value?.title_overrides?.[selectedMediaId]) {
        displayTitle = userSettings.value.title_overrides[selectedMediaId];
    }

    let fallbackAnime = null;
    if (selectedMediaId) {
        fallbackAnime = animeList.value.find(a => Number(a.mediaId) === Number(selectedMediaId));
    }

    const details = data.media_details || fallbackAnime || {};
    const rawCoverUrl = details.coverImage?.large || details.coverImage?.medium || fallbackAnime?.coverImage?.large || fallbackAnime?.coverImage?.medium || '';
    const rawBannerUrl = details.bannerImage || fallbackAnime?.bannerImage || rawCoverUrl;
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
        const anime = animeList.value.find(a => Number(a.mediaId) === Number(selectedMediaId));
        if (anime) {
            recordApiRequest('PROGRESS', selectedMediaId, { episode: watched }, `${displayTitle}: Set progress to ${watched}`);
            anime.progress = watched;
            animeList.value = [...animeList.value];
            showToast("Progress recorded (Pending Update)");
        } else {
            // Force progress sync even if not in current list
            try {
                const resp = await fetch('/api/update_progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mediaId: parseInt(selectedMediaId, 10), episode: watched })
                });
                const result = await resp.json();
                if (result.success) {
                    showToast("Progress synced directly to Anilist");
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleOpenFolder = () => {
        if (selectedMediaId) api.openFolder(selectedMediaId);
        else api.openFolderPost();
    };

    const handleSearchTorrents = () => {
        if (data.base_title || data.title) {
            activeSearchTerm.value = data.base_title || data.title;
            setActiveTab('TORRENTS');
        }
    };

    return (
        <div id="now-playing" class="now-playing redesign">
            <div id="np-banner" class="np-banner" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}>
                <div class="np-banner-overlay" />
            </div>
            <div class="np-content">
                <div class="np-cover-wrapper">
                    <img id="np-cover" class="np-cover" src={coverUrl || '/placeholder.png'} alt="cover"
                        style={rawCoverUrl ? 'cursor: pointer;' : ''}
                        onClick={() => rawCoverUrl && window.open(rawCoverUrl, '_blank')}
                    />
                </div>
                <div class="np-details">
                    <div class="np-header-row">
                        <span id="np-player-badge" class="np-player-badge">
                            {data.watcher_name ? `PLAYING VIA ${data.watcher_name.toUpperCase()}` : 'NOW PLAYING'}
                        </span>
                        <div class="np-quick-actions">
                            <button id="btn-open-np-folder" class="quick-action-btn" onClick={handleOpenFolder} title="Open Folder">
                                <FolderIcon size={16} /> <span>Folder</span>
                            </button>
                            <button id="btn-search-np-torrents" class="quick-action-btn" onClick={handleSearchTorrents} title="Search Torrents">
                                <SearchIcon size={16} /> <span>Torrents</span>
                            </button>
                            <button id="btn-edit-nowplaying" class="quick-action-btn" onClick={() => {
                                if (selectedMediaId) {
                                    const anime = fallbackAnime || { mediaId: selectedMediaId, title: details.title, coverImage: details.coverImage };
                                    if (anime) onOpenDetails?.(anime);
                                }
                            }} title="Anime Details" disabled={!selectedMediaId}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg> <span>Details</span>
                            </button>
                        </div>
                    </div>

                    <h2 id="np-title" class="np-title">
                        {selectedMediaId ? (
                            <a href={`https://anilist.co/anime/${selectedMediaId}`} target="_blank" rel="noopener noreferrer">
                                {escapeHtml(displayTitle)}
                            </a>
                        ) : escapeHtml(displayTitle)}
                    </h2>
                    
                    <div id="np-studio" class="np-studio">{details.studio || 'Unknown Studio'}</div>

                    {seasonOptions.length > 0 && (
                        <div class="np-season-selector" style="display: flex;">
                            <select id="np-season" class="np-season-select" onChange={handleSeasonChange}>
                                {seasonOptions.sort((a, b) => (b.seasonYear || 0) - (a.seasonYear || 0)).map(opt => (
                                    <option key={opt.mediaId} value={opt.mediaId} selected={opt.mediaId === selectedMediaId}>
                                        {escapeHtml(opt.title || `Season ${opt.season || ''} ${opt.seasonYear || ''}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div id="np-stats" class="np-stats">
                        {stats.map((s, i) => <span key={i} class="np-stat">{s}</span>)}
                    </div>

                    {summary && (
                        <div id="np-summary" class="np-summary" dangerouslySetInnerHTML={{ __html: summary }} />
                    )}

                    <div class="np-bottom-controls">
                        <div class="np-progress-section">
                            <div class="np-progress-bar-container">
                                <span id="np-progress-label" class="np-progress-label">E{watched} / {totalStr}</span>
                                <div id="np-progress-segments" class="np-progress-segments">
                                    <ProgressBar progress={watched} total={total} nextAiringEpisode={nextAiring} />
                                </div>
                            </div>
                            <div class="np-ep-adjust">
                                <button class="icon-btn" onClick={() => api.adjustEpisode(-1)} title="-1 Episode">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </button>
                                <button class="icon-btn" onClick={() => api.adjustEpisode(1)} title="+1 Episode">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </button>
                                <button class="primary-btn btn-sync" onClick={handleSync} title="Record Progress to AniList">
                                    Sync Episode
                                </button>
                            </div>
                        </div>

                        <div class="np-media-controls">
                            <button id="btn-play-prev" class="icon-btn" onClick={() => api.playPrev()} disabled={!data.can_prev} title="Previous Episode">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></svg>
                            </button>
                            <button id="btn-play-pause" class="icon-btn play-pause-btn" onClick={() => api.playPause()} title="Play/Pause">
                                {data.paused ? (
                                    <svg id="svg-play" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                ) : (
                                    <svg id="svg-pause" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                )}
                            </button>
                            <button id="btn-play-next" class="icon-btn" onClick={() => api.playNext()} disabled={!data.can_next} title="Next Episode">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IdleState({ status }) {
    const data = status;
    const hasResume = data?.last_played_file;

    return (
        <div id="idle-state" class="idle-state">
            <div class="idle-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                </svg>
            </div>
            <div class="idle-text">
                <p>Nothing is playing</p>
                <p class="idle-subtext">Open a video in a supported player to start tracking</p>
            </div>
            {hasResume && (
                <div id="resume-container" class="resume-container resume-btn-premium">
                    <div class="resume-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                    <div class="resume-info" onClick={() => api.resumePlay()} style="cursor: pointer; flex: 1;">
                        <span class="resume-label">Resume Playing</span>
                        <span id="resume-filename" class="resume-filename">{data.last_played_title || 'Last Video'}</span>
                    </div>
                    <button id="btn-open-folder" class="resume-folder-btn" onClick={(e) => { e.stopPropagation(); api.openFolderPost(); }} title="Open Folder">
                        <FolderIcon size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}