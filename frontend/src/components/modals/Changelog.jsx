import { pendingApiRequests, removeApiRequest, clearApiRequests, showToast, animeList } from '../../store';
import { escapeHtml } from '../../utils';
import * as api from '../../api';
import { useState } from 'preact/hooks';

export function ChangelogModal({ visible, onClose, onSynced }) {
    const [syncing, setSyncing] = useState(false);
    if (!visible) return null;

    const requests = pendingApiRequests.value;

    if (requests.length === 0) {
        return null;
    }

    const handleSync = async () => {
        setSyncing(true);
        try {
            for (const req of requests) {
                let url = '';
                if (req.type === 'STATUS') url = '/api/change_status';
                else if (req.type === 'PROGRESS') url = '/api/update_progress';
                else if (req.type === 'TITLE_OVERRIDE') url = '/api/update_title_override';

                if (url) {
                    await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mediaId: req.mediaId, ...req.data })
                    });
                }
            }
            showToast(`Successfully pushed ${requests.length} changes to AniList!`);
            clearApiRequests();
            onClose();
            onSynced?.();
        } catch (err) {
            console.error('Push failed:', err);
            showToast('Failed to push some items. Check logs.', 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div id="changelog-modal" class="modal">
            <div class="modal-overlay" id="changelog-modal-overlay" onClick={onClose} />
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Review Pending Changes</h2>
                    <button class="modal-close-btn" id="changelog-modal-close" onClick={onClose}>×</button>
                </div>
                <div class="modal-body">
                    <div id="changelog-container">
                        {requests.map((req, idx) => (
                            <div key={idx} class="changelog-item">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div class="changelog-title">{escapeHtml(req.label)}</div>
                                    <button class="icon-btn" onClick={() => {
                                        removeApiRequest(idx);
                                        if (pendingApiRequests.value.length === 0) onClose();
                                    }} title="Remove change">✕</button>
                                </div>
                                <div class="changelog-detail">Type: {req.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button id="changelog-cancel" class="secondary-btn" onClick={onClose}>Cancel</button>
                    <button id="changelog-confirm" class="primary-btn" onClick={handleSync} disabled={syncing}>
                        {syncing ? 'Syncing...' : 'Confirm and Sync'}
                    </button>
                </div>
            </div>
        </div>
    );
}
