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
        <div id="now-playing" class="now-playing">
            <div id="np-banner" class="np-banner" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}>
                <div class="np-banner-overlay" />
            </div>
            <div class="np-content">
                <img id="np-cover" class="np-cover" src={coverUrl} alt="cover"
                    style={rawCoverUrl ? 'cursor: pointer;' : ''}
                    onClick={() => rawCoverUrl && window.open(rawCoverUrl, '_blank')}
                />
                <div class="np-details">
                    <span id="np-player-badge" class="np-player-badge">
                        {data.watcher_name ? `NOW PLAYING (${data.watcher_name})` : 'NOW PLAYING'}
                    </span>
                    <h2 id="np-title" class="np-title">
                        {selectedMediaId ? (
                            <a href={`https://anilist.co/anime/${selectedMediaId}`} target="_blank" rel="noopener noreferrer">
                                {escapeHtml(displayTitle)}
                            </a>
                        ) : displayTitle}
                    </h2>
                    <div id="np-studio" class="np-studio">{details.studio || ''}</div>

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
                        <div id="np-summary" class="np-summary">{summary}</div>
                    )}

                    <div class="np-progress">
                        <span id="np-progress-label" class="np-progress-label">E{watched} / {totalStr}</span>
                        <div id="np-progress-segments">
                            <ProgressBar progress={watched} total={total} nextAiringEpisode={nextAiring} />
                        </div>
                    </div>

                    <div class="np-controls">
                        <div class="np-media-controls">
                            <button id="btn-play-prev" class="icon-btn" onClick={() => api.playPrev()} disabled={!data.can_prev} title="Previous Episode">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></svg>
                            </button>
                            <button id="btn-play-pause" class="icon-btn play-pause-btn" onClick={() => api.playPause()} title="Play/Pause">
                                {data.paused ? (
                                    <svg id="svg-play" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                ) : (
                                    <svg id="svg-pause" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                )}
                            </button>
                            <button id="btn-play-next" class="icon-btn" onClick={() => api.playNext()} disabled={!data.can_next} title="Next Episode">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                            </button>
                        </div>
                        <div class="np-action-controls">
                            <button id="btn-minus" class="icon-btn" onClick={() => api.adjustEpisode(-1)} title="-1 Episode">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <button id="btn-plus" class="icon-btn" onClick={() => api.adjustEpisode(1)} title="+1 Episode">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <button id="btn-sync" class="primary-btn btn-sync" onClick={handleSync} title="Record Progress">
                                Sync
                            </button>
                            <button id="btn-open-np-folder" class="icon-btn" onClick={handleOpenFolder} title="Open Folder">
                                <FolderIcon size={14} />
                            </button>
                            <button id="btn-search-np-torrents" class="icon-btn" onClick={handleSearchTorrents} title="Search Torrents">
                                <SearchIcon size={14} />
                            </button>
                            <button id="btn-edit-nowplaying" class="icon-btn" onClick={() => {
                                if (selectedMediaId) {
                                    const anime = animeList.value.find(a => a.mediaId == selectedMediaId);
                                    if (anime) onOpenDetails?.(anime);
                                }
                            }} title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
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
    let lastTitle = data?.last_played_title || 'Last Video';
    if (lastTitle && (lastTitle.includes('/') || lastTitle.includes('\\'))) {
        lastTitle = lastTitle.split(/[\\/]/).pop();
    }

    return (
        <div id="idle-state" class="idle-state">
            <div class="idle-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                </svg>
            </div>
            <div class="idle-text">
                <p>Nothing is playing</p>
                <p class="idle-subtext">Open a video in a supported player to start tracking</p>
            </div>
            {hasResume && (
                <div id="resume-container" class="resume-container">
                    <span id="resume-filename" class="resume-filename">{lastTitle}</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button id="btn-resume-last" class="primary-btn btn-resume-last" onClick={() => api.resumePlay()} title="Resume Last Video">
                            Resume
                        </button>
                        <button id="btn-open-folder" class="icon-btn" onClick={() => api.openFolderPost()} title="Open Folder">
                            <FolderIcon size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
