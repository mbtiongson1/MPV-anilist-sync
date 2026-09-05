import { useState, useEffect } from 'preact/hooks';
import { selectedAnime, clearSelection, pendingApiRequests, showToast, recordApiRequest, animeList } from '../store';

export function SelectionBar({ onShowReview }) {
    const [isOpen, setIsOpen] = useState(false);
    const count = selectedAnime.value.size;

    useEffect(() => {
        const handleOutsideClick = () => setIsOpen(false);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

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
                <button id="btn-select-none" class="icon-btn" onClick={clearSelection} title="Clear Selection" aria-label="Clear Selection">
                    Clear
                </button>
                <div class="move-to-wrapper">
                    <button id="btn-move-to" class={`primary-btn move-to-btn ${isOpen ? 'active' : ''}`}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                    >
                        <span>Move to...</span>
                        <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div id="move-to-dropdown" class={`move-to-dropdown ${isOpen ? 'show' : ''}`} role="menu" aria-label="Move to status">
                        {['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED'].map(status => (
                            <button key={status} type="button" role="menuitem" class="move-to-option" data-status={status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    moveSelectedTo(status);
                                    setIsOpen(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        moveSelectedTo(status);
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {status === 'CURRENT' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
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
