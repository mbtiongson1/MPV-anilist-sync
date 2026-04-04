import { selectedAnime, clearSelection, pendingApiRequests, showToast, recordApiRequest, animeList } from '../store';

export function SelectionBar({ onShowReview }) {
    const count = selectedAnime.value.size;
    if (count === 0) return null;

    const moveSelectedTo = (newStatus) => {
        const selectedIds = Array.from(selectedAnime.value);
        selectedIds.forEach(mediaId => {
            const anime = animeList.value.find(a => a.mediaId == mediaId);
            if (anime && anime.listStatus !== newStatus) {
                const idInt = parseInt(mediaId);
                const title = anime.title?.romaji || anime.title?.english || 'Anime';
                recordApiRequest('STATUS', idInt, { status: newStatus }, `${title}: Move to ${newStatus}`);
                anime.listStatus = newStatus;
            }
        });
        clearSelection();
        showToast(`Recorded ${selectedIds.length} status changes (Pending Update)`);
    };

    return (
        <div id="selection-bar" class="selection-bar">
            <div class="selection-info">
                <span id="selection-count">{count}</span> selected
            </div>
            <div class="selection-actions">
                <button id="btn-select-none" class="icon-btn" onClick={clearSelection} title="Clear Selection">
                    Clear
                </button>
                <div class="move-to-wrapper">
                    <button id="btn-move-to" class="primary-btn btn-move-to"
                        onClick={(e) => {
                            e.stopPropagation();
                            const dd = document.getElementById('move-to-dropdown');
                            if (dd) dd.classList.toggle('show');
                        }}
                    >
                        Move to...
                    </button>
                    <div id="move-to-dropdown" class="move-to-dropdown">
                        {['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'].map(status => (
                            <div key={status} class="move-to-option" data-status={status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    moveSelectedTo(status);
                                    document.getElementById('move-to-dropdown')?.classList.remove('show');
                                }}
                            >
                                {status === 'CURRENT' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase()}
                            </div>
                        ))}
                    </div>
                </div>
                <button id="btn-bulk-sync" class="primary-btn" onClick={onShowReview}>
                    Review & Sync
                </button>
            </div>
        </div>
    );
}
