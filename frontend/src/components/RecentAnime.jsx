import { animeList, userSettings, activeSearchTerm } from '../store';
import { statusColors, escapeHtml, getCachedImageUrl, getRelativeTime, getDisplayTitle } from '../utils';
import { SearchIcon, FolderIcon } from '../icons';
import { setActiveTab } from '../store';
import * as api from '../api';

export function RecentAnime({ onOpenDetails }) {
    const list = animeList.value;
    const settings = userSettings.value;

    const recent = [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 10);

    if (recent.length === 0) {
        return (
            <div id="recent-anime-list" class="recent-anime-list">
                <div style="padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">No recent anime</div>
            </div>
        );
    }

    return (
        <div id="recent-anime-list" class="recent-anime-list">
            {recent.map(anime => {
                const title = getDisplayTitle(anime, settings);
                const cover = getCachedImageUrl(anime.coverImage?.medium || anime.coverImage?.large || '');
                const progress = anime.progress || 0;
                const total = anime.episodes || '?';
                const status = anime.listStatus || 'CURRENT';
                const baseColor = statusColors[status] || '#94a3b8';
                const tintColor = `${baseColor}15`;

                return (
                    <div key={anime.mediaId} class="recent-anime-item"
                        style={`display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem; background: ${tintColor}; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: all 0.2s ease; position: relative;`}
                        onClick={() => onOpenDetails?.(anime)}
                        onMouseOver={(e) => { e.currentTarget.style.background = `${baseColor}25`; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = tintColor; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                        <div style="display: flex; gap: 0.75rem; align-items: center; flex: 1; min-width: 0;">
                            <img src={cover} style="width: 32px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);" alt="" />
                            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
                                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.1rem; line-height: 1.2;" title={title}>{title}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                    <span>Ep {progress} / {total}</span>
                                    <span style={`opacity: 0.9; font-weight: 800; font-size: 0.6rem; letter-spacing: 0.02em; color: ${baseColor}; white-space: nowrap;`}>
                                        {status === 'CURRENT' ? 'IN PROGRESS' : status}
                                    </span>
                                    {anime.updatedAt && (
                                        <span style="font-size: 0.65rem; opacity: 0.7; color: var(--text-muted);">• {getRelativeTime(anime.updatedAt)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {status === 'CURRENT' && (
                            <button class="icon-btn btn-search-torrents" style="padding: 0.3rem;"
                                title="Search Torrents"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    activeSearchTerm.value = title;
                                    setActiveTab('TORRENTS');
                                }}>
                                <SearchIcon size={14} />
                            </button>
                        )}
                        <button class="icon-btn btn-open-folder" style="padding: 0.3rem;"
                            title="Open folder"
                            onClick={(e) => {
                                e.stopPropagation();
                                api.openFolder(anime.mediaId);
                            }}>
                            <FolderIcon size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
