import { animeList, userSettings, selectedAnime, latestStatus, lastSelectedMediaId, sortBy, sortDirection, currentPage, toggleSelection, setSort, recordApiRequest, showToast, activeSearchTerm, setActiveTab, torrentCache } from '../store';
import { escapeHtml, formatPopularity, getCachedImageUrl, getAnimeSeasons, getDisplayTitle } from '../utils';
import { ProgressBar } from './ProgressBar';
import { EditIcon, FolderIcon, SearchIcon, ResumeIcon, SeasonIcon } from '../icons';
import { Pagination } from './Pagination';
import * as api from '../api';

export function AnimeGrid({ viewMode, onViewModeChange, filteredList, filterName, filterSeason, filterSort, onFilterNameChange, onFilterSeasonChange, onFilterSortChange, onOpenDetails, onCleanup, tab }) {
    const settings = userSettings.value;
    const iPerPage = parseInt(localStorage.getItem('mpvItemsPerPage')) || 20;
    const page = currentPage.value;
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / iPerPage);
    const pagedList = filteredList.slice((page - 1) * iPerPage, page * iPerPage);

    const handleProgressChange = (anime, delta) => {
        const newProgress = Math.max(0, (anime.progress || 0) + delta);
        if (newProgress === (anime.progress || 0)) return;
        const idInt = parseInt(anime.mediaId, 10);
        const title = anime.title?.romaji || anime.title?.english || 'Anime';
        const oldStatus = anime.listStatus;
        let targetStatus = oldStatus;
        if (anime.episodes && newProgress < anime.episodes && oldStatus === 'COMPLETED') targetStatus = 'CURRENT';
        if (targetStatus !== oldStatus) {
            recordApiRequest('STATUS', idInt, { status: targetStatus }, `${title}: Move to ${targetStatus}`);
            anime.listStatus = targetStatus;
        }
        recordApiRequest('PROGRESS', idInt, { episode: newProgress }, `${title}: Set progress to ${newProgress}`);
        anime.progress = newProgress;
        animeList.value = [...animeList.value];
        showToast(`Recorded update for ${title} (Pending Update)`);
    };

    const handleDragStart = (e, anime) => {
        e.dataTransfer.setData('text/plain', anime.mediaId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCardClick = (e, anime) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const mediaId = anime.mediaId.toString();

        if (e.shiftKey && lastSelectedMediaId.value) {
            e.preventDefault();
            const allIds = pagedList.map(a => a.mediaId.toString());
            let startIdx = allIds.indexOf(lastSelectedMediaId.value);
            const endIdx = allIds.indexOf(mediaId);
            if (startIdx === -1) startIdx = 0;
            if (endIdx !== -1) {
                const min = Math.min(startIdx, endIdx);
                const max = Math.max(startIdx, endIdx);
                const isSelecting = !selectedAnime.value.has(mediaId);
                const newSet = new Set(selectedAnime.value);
                for (let i = min; i <= max; i++) {
                    const id = allIds[i];
                    isSelecting ? newSet.add(id) : newSet.delete(id);
                }
                selectedAnime.value = newSet;
                lastSelectedMediaId.value = mediaId;
                return;
            }
        }
        toggleSelection(anime.mediaId);
    };

    const handleDblClick = (anime) => {
        api.openFolder(anime.mediaId);
    };

    const dragEnabled = settings ? settings.enable_drag_drop !== false : true;
    const isPlaying = (mediaId) => latestStatus.value?.running && latestStatus.value?.selected_media_id == mediaId;
    const isSelected = (mediaId) => selectedAnime.value.has(mediaId.toString());

    if (totalItems === 0) {
        return (
            <div id="anime-grid" class="anime-grid">
                <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p>No anime found</p>
                </div>
            </div>
        );
    }

    const getSortIndicator = (column) => {
        if (sortBy.value !== column) return '';
        return sortDirection.value === 1 ? ' ▲' : ' ▼';
    };

    const showCleanup = tab === 'CURRENT';

    return (
        <>
            <div class="filter-bar">
                <div class="filter-search">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input type="text" id="filter-name" placeholder="Search anime..." value={filterName}
                        onInput={(e) => onFilterNameChange(e.target.value)} />
                    {filterName && (
                        <button id="btn-clear-search" class="btn-clear-search" onClick={() => onFilterNameChange('')}>×</button>
                    )}
                </div>
                <select id="filter-season" class="filter-select" value={filterSeason} onChange={(e) => onFilterSeasonChange(e.target.value)}>
                    <option value="">All Seasons</option>
                    <option value="WINTER">Winter</option>
                    <option value="SPRING">Spring</option>
                    <option value="SUMMER">Summer</option>
                    <option value="FALL">Fall</option>
                </select>
                <input type="number" id="filter-year" placeholder="Year" class="filter-input" style={{ width: '80px' }} />
                <select id="filter-sort" class="filter-select" value={sortBy.value} onChange={(e) => onFilterSortChange(e.target.value)}>
                    <option value="progress">Progress</option>
                    <option value="title">Title</option>
                    <option value="score">Score</option>
                    <option value="popularity">Popularity</option>
                    <option value="season">Season</option>
                    <option value="studio">Studio</option>
                    <option value="updatedAt">Updated</option>
                </select>
                <div class="view-toggle-group" style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                    {showCleanup && (
                        <button id="btn-cleanup-progress" class="view-toggle-btn" onClick={onCleanup} title="Cleanup unwatched anime" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        </button>
                    )}
                    <button id="btn-view-grid" class={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => onViewModeChange?.('grid')} title="Grid View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </button>
                    <button id="btn-view-list" class={`view-toggle-btn ${viewMode === 'details' ? 'active' : ''}`} onClick={() => onViewModeChange?.('details')} title="Details View">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            <div id="anime-grid" class={`anime-grid ${viewMode === 'grid' ? 'grid-view' : viewMode === 'details' ? 'details-view' : 'list-view'}`}>
                {viewMode === 'details' ? (
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th data-sort="title" style="cursor: pointer;" onClick={() => setSort('title')}>Title{getSortIndicator('title')}</th>
                                <th data-sort="progress" style="cursor: pointer;" onClick={() => setSort('progress')}>Progress{getSortIndicator('progress')}</th>
                                <th data-sort="score" style="cursor: pointer;" onClick={() => setSort('score')}>Score{getSortIndicator('score')}</th>
                                <th data-sort="popularity" style="cursor: pointer;" onClick={() => setSort('popularity')}>Popularity{getSortIndicator('popularity')}</th>
                                <th data-sort="season" style="cursor: pointer;" onClick={() => setSort('season')}>Season{getSortIndicator('season')}</th>
                                <th data-sort="studio" style="cursor: pointer;" onClick={() => setSort('studio')}>Studio{getSortIndicator('studio')}</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedList.map(anime => (
                                <DetailsRow key={anime.mediaId} anime={anime} settings={settings}
                                    isSelected={isSelected(anime.mediaId)} isPlaying={isPlaying(anime.mediaId)}
                                    onClick={(e) => handleCardClick(e, anime)}
                                    onDblClick={() => handleDblClick(anime)}
                                    onEdit={() => onOpenDetails?.(anime)}
                                    onProgressChange={handleProgressChange}
                                    dragEnabled={dragEnabled} onDragStart={handleDragStart} />
                            ))}
                        </tbody>
                    </table>
                ) : (
                    pagedList.map(anime => viewMode === 'grid' ? (
                        <GridCard key={anime.mediaId} anime={anime} settings={settings}
                            isSelected={isSelected(anime.mediaId)} isPlaying={isPlaying(anime.mediaId)}
                            onClick={(e) => handleCardClick(e, anime)}
                            onDblClick={() => handleDblClick(anime)}
                            onEdit={() => onOpenDetails?.(anime)}
                            onProgressChange={handleProgressChange}
                            dragEnabled={dragEnabled} onDragStart={handleDragStart} />
                    ) : (
                        <ListItem key={anime.mediaId} anime={anime} settings={settings}
                            isSelected={isSelected(anime.mediaId)} isPlaying={isPlaying(anime.mediaId)}
                            onClick={(e) => handleCardClick(e, anime)}
                            onDblClick={() => handleDblClick(anime)}
                            onEdit={() => onOpenDetails?.(anime)}
                            onProgressChange={handleProgressChange}
                            dragEnabled={dragEnabled} onDragStart={handleDragStart} />
                    ))
                )}
            </div>

            <Pagination currentPage={page} totalItems={totalItems} itemsPerPage={iPerPage}
                onPageChange={(p) => currentPage.value = p}
                onItemsPerPageChange={(v) => { localStorage.setItem('mpvItemsPerPage', v); currentPage.value = 1; animeList.value = [...animeList.value]; }} />
        </>
    );
}

function ActionButtons({ anime, onEdit, settings }) {
    const title = getDisplayTitle(anime, settings);
    return (
        <div style="display: flex; gap: 0.25rem; margin-left: auto;">
            <button class="icon-btn btn-open-folder" onClick={(e) => { e.stopPropagation(); api.openFolder(anime.mediaId); }} title="Open Folder"><FolderIcon /></button>
            <button class="icon-btn btn-search-torrents" onClick={(e) => {
                e.stopPropagation();
                torrentCache.value = { ...torrentCache.value, mediaId: anime.mediaId, query: title };
                activeSearchTerm.value = title;
                setActiveTab('TORRENTS');
            }} title="Search Torrents"><SearchIcon size={14} /></button>
            <button class="icon-btn edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit Progress"><EditIcon /></button>
            {anime.listStatus === 'COMPLETED' && (
                <button class="icon-btn btn-resume" onClick={(e) => {
                    e.stopPropagation();
                    const newProgress = Math.max(0, (anime.progress || 0) - 1);
                    const animeTitle = anime.title?.romaji || anime.title?.english || 'Anime';
                    recordApiRequest('STATUS', anime.mediaId, { status: 'CURRENT' }, `${animeTitle}: Move to CURRENT`);
                    recordApiRequest('PROGRESS', anime.mediaId, { episode: newProgress }, `${animeTitle}: Set progress to ${newProgress}`);
                    anime.listStatus = 'CURRENT';
                    anime.progress = newProgress;
                    animeList.value = [...animeList.value];
                    showToast("Resume recorded (Pending Update)");
                }} title="Move to In Progress"><ResumeIcon /></button>
            )}
        </div>
    );
}

function LiveIndicator({ anime }) {
    if (anime.mediaStatus !== 'RELEASING') return null;
    let availableBadge = null;
    if (anime.nextAiringEpisode?.episode) {
        const available = anime.nextAiringEpisode.episode - 1 - (anime.progress || 0);
        if (available > 0) availableBadge = <span class="available-episodes-badge">+{available}</span>;
    }
    return (
        <div class="card-live-indicator">
            <div class="card-live-dot" />
            {availableBadge}
        </div>
    );
}

function SeasonTag({ anime }) {
    const seasons = getAnimeSeasons(anime);
    if (seasons.length === 0) return null;
    return (
        <div class="card-season-tag">
            {seasons.map((s, i) => <SeasonIcon key={i} season={s} size={14} />)}
        </div>
    );
}

function GridCard({ anime, settings, isSelected, isPlaying, onClick, onDblClick, onEdit, onProgressChange, dragEnabled, onDragStart }) {
    const title = getDisplayTitle(anime, settings);
    const cover = getCachedImageUrl(anime.coverImage?.large || anime.coverImage?.medium || '');
    const progress = anime.progress || 0;
    const total = anime.episodes || '?';
    const seasons = getAnimeSeasons(anime);
    const seasonalClass = seasons.length > 0 ? `season-bg-${seasons.slice(0, 2).join('-').toLowerCase()}` : '';

    return (
        <div class={`anime-card ${seasonalClass} ${isSelected ? 'selected' : ''} ${isPlaying ? 'now-playing-highlight' : ''}`}
            data-media-id={anime.mediaId} style="cursor: pointer;"
            onClick={onClick} onDblClick={onDblClick}
            draggable={dragEnabled} onDragStart={(e) => onDragStart(e, anime)}>
            <LiveIndicator anime={anime} />
            <SeasonTag anime={anime} />
            <div class="anime-card-cover" style={`background-image: url('${cover}')`}>
                <div class="anime-progress">
                    <ProgressBar progress={progress} total={anime.episodes || 0} nextAiringEpisode={anime.nextAiringEpisode} mediaId={anime.mediaId} />
                </div>
            </div>
            <div class="anime-info">
                <div class="anime-title" title={title}>{escapeHtml(title)}</div>
                <div class="anime-meta">Ep {progress} / {total}</div>
            </div>
            <div class="card-overlay">
                <ActionButtons anime={anime} onEdit={onEdit} settings={settings} />
            </div>
        </div>
    );
}

function ListItem({ anime, settings, isSelected, isPlaying, onClick, onDblClick, onEdit, onProgressChange, dragEnabled, onDragStart }) {
    const title = getDisplayTitle(anime, settings);
    const cover = getCachedImageUrl(anime.coverImage?.large || anime.coverImage?.medium || '');
    const progress = anime.progress || 0;
    const total = anime.episodes || '?';
    const score = anime.averageScore ? anime.averageScore + '%' : '-';
    const seasons = getAnimeSeasons(anime);
    const seasonalClass = seasons.length > 0 ? `season-bg-${seasons.slice(0, 2).join('-').toLowerCase()}` : '';

    return (
        <div class={`anime-list-item ${seasonalClass} ${isSelected ? 'selected' : ''} ${isPlaying ? 'now-playing-highlight' : ''}`}
            data-media-id={anime.mediaId} style="cursor: pointer;"
            onClick={onClick} onDblClick={onDblClick}
            draggable={dragEnabled} onDragStart={(e) => onDragStart(e, anime)}>
            <img src={cover} class="anime-list-cover" alt="cover" />
            {anime.mediaStatus === 'RELEASING' && <LiveIndicator anime={anime} />}
            <div class="list-info">
                <div class="list-title">
                    {escapeHtml(title)}
                    {seasons.length > 0 && <div class="card-season-tag list-season-tag">{seasons.map((s, i) => <SeasonIcon key={i} season={s} size={14} />)}</div>}
                </div>
                <div class="list-meta">
                    <span>{progress} / {total}</span>
                    <span>★ {score}</span>
                </div>
                <ProgressBar progress={progress} total={anime.episodes || 0} nextAiringEpisode={anime.nextAiringEpisode} mediaId={anime.mediaId}
                    showButtons onIncrement={() => onProgressChange(anime, 1)} onDecrement={() => onProgressChange(anime, -1)} />
            </div>
            <ActionButtons anime={anime} onEdit={onEdit} settings={settings} />
        </div>
    );
}

function DetailsRow({ anime, settings, isSelected, isPlaying, onClick, onDblClick, onEdit, onProgressChange, dragEnabled, onDragStart }) {
    const title = getDisplayTitle(anime, settings);
    const progress = anime.progress || 0;
    const total = anime.episodes || '?';
    const score = anime.averageScore ? anime.averageScore + '%' : '-';
    const pop = formatPopularity(anime.popularity || 0);
    const seasons = getAnimeSeasons(anime);

    let availableText = '';
    if (anime.mediaStatus === 'RELEASING' && anime.nextAiringEpisode) {
        const diff = Math.max(0, (anime.nextAiringEpisode.episode - 1) - progress);
        const color = diff > 0 ? 'var(--accent)' : 'var(--text-muted)';
        availableText = <span style={`color:${color}; font-size: 0.7rem; font-weight: 700;`}>(+{diff})</span>;
    }

    return (
        <tr class={`details-row ${isSelected ? 'selected' : ''} ${isPlaying ? 'now-playing-highlight' : ''}`}
            data-media-id={anime.mediaId} style="cursor: pointer;"
            onClick={onClick} onDblClick={onDblClick}
            draggable={dragEnabled} onDragStart={(e) => onDragStart(e, anime)}>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    {anime.mediaStatus === 'RELEASING' && <div class="card-live-dot" style="position: static; transform: scale(0.8);" />}
                    {escapeHtml(title)}
                </div>
            </td>
            <td>{progress} / {total} {availableText}</td>
            <td>{score}</td>
            <td>{pop}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    {seasons.length > 0 && <div class="card-season-tag inline-season-tag">{seasons.map((s, i) => <SeasonIcon key={i} season={s} size={14} />)}</div>}
                    {anime.season || '-'} {anime.seasonYear || ''}
                </div>
            </td>
            <td>{escapeHtml(anime.studio || '-')}</td>
            <td style="text-align: right; display: flex; justify-content: flex-end; gap: 0.25rem;">
                <ActionButtons anime={anime} onEdit={onEdit} settings={settings} />
            </td>
        </tr>
    );
}
