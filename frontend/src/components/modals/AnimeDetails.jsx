import { useState } from 'preact/hooks';
import { escapeHtml, formatPopularity, getCachedImageUrl, getDisplayTitle } from '../../utils';
import { userSettings, animeList, recordApiRequest, showToast, pendingApiRequests } from '../../store';
import * as api from '../../api';

export function AnimeDetailsModal({ anime, visible, onClose }) {
    if (!visible || !anime) return null;

    const [progress, setProgress] = useState(anime.progress || 0);
    const [selectedStatus, setSelectedStatus] = useState(anime.listStatus);
    const [nameOverride, setNameOverride] = useState(
        (userSettings.value?.title_overrides?.[anime.mediaId]) || ''
    );

    const title = anime.title?.romaji || anime.title?.english || anime.title?.native || 'Unknown';
    const description = anime.description || 'No description available.';
    const cover = getCachedImageUrl(anime.coverImage?.large || anime.coverImage?.medium || '');
    const stats = [];
    if (anime.status) stats.push({ label: 'Status', value: anime.status });
    if (anime.season && anime.seasonYear) stats.push({ label: 'Season', value: `${anime.season} ${anime.seasonYear}` });
    if (anime.episodes) stats.push({ label: 'Episodes', value: anime.episodes });
    if (anime.averageScore) stats.push({ label: 'Score', value: `${anime.averageScore}%` });
    if (anime.popularity) stats.push({ label: 'Popularity', value: formatPopularity(anime.popularity) });

    const handleSave = async () => {
        const localAnime = animeList.value.find(a => a.mediaId === anime.mediaId);
        const animeTitle = anime.title?.romaji || anime.title?.english || 'Anime';

        if (localAnime) {
            const oldStatus = localAnime.listStatus;
            const oldProgress = localAnime.progress || 0;
            let targetStatus = selectedStatus;

            localAnime.progress = progress;

            if (localAnime.episodes && progress < localAnime.episodes && oldStatus === 'COMPLETED') {
                targetStatus = 'CURRENT';
                localAnime.listStatus = 'CURRENT';
            }

            // Title override
            const oldOverride = userSettings.value?.title_overrides?.[anime.mediaId] || '';
            if (nameOverride !== oldOverride) {
                api.updateTitleOverride(anime.mediaId, nameOverride).catch(console.error);
                const settings = { ...userSettings.value };
                if (!settings.title_overrides) settings.title_overrides = {};
                settings.title_overrides[anime.mediaId] = nameOverride;
                userSettings.value = settings;
            }

            if (targetStatus !== oldStatus) {
                recordApiRequest('STATUS', anime.mediaId, { status: targetStatus }, `${animeTitle}: Move to ${targetStatus}`);
            }

            if (progress !== oldProgress) {
                recordApiRequest('PROGRESS', anime.mediaId, { episode: progress }, `${animeTitle}: Set progress to ${progress}`);
            }

            // Force signal reactivity
            animeList.value = [...animeList.value];

            onClose();

            if (targetStatus !== oldStatus || progress !== oldProgress) {
                showToast("Changes recorded (Pending Update)");
            } else {
                showToast("Local changes saved");
            }
        }
    };

    const statuses = [
        { key: 'CURRENT', label: 'In Progress' },
        { key: 'PLANNING', label: 'Planning' },
        { key: 'COMPLETED', label: 'Completed' },
        { key: 'DROPPED', label: 'Dropped' },
        { key: 'PAUSED', label: 'Paused' },
    ];

    return (
        <div id="details-modal" class="modal">
            <div class="modal-overlay" onClick={onClose} />
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Anime</h2>
                    <button class="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div class="modal-body">
                    <div class="details-modal-grid">
                        <div class="details-modal-left">
                            <img src={cover} alt="cover" class="details-modal-cover" />
                        </div>
                        <div class="details-modal-right">
                            <h3>{escapeHtml(title)}</h3>
                            <div class="modal-meta">
                                {stats.map(s => <p key={s.label}><strong>{s.label}:</strong> {s.value}</p>)}
                            </div>
                            <p><strong>Description</strong></p>
                            <div class="modal-description" dangerouslySetInnerHTML={{ __html: description }} />
                        </div>
                    </div>
                    <div class="modal-actions" style="flex-direction: column; align-items: flex-start; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 1rem;">
                        <div style="width: 100%;">
                            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Local Name Override (folder name):</label>
                            <input
                                type="text"
                                value={nameOverride}
                                onInput={(e) => setNameOverride(e.target.value)}
                                class="filter-input"
                                style="width: 100%; padding: 8px;"
                                placeholder="e.g. My Folder Name"
                            />
                        </div>
                        <div style="width: 100%;">
                            <label style="display: block; font-weight: 600; margin-bottom: 6px;">Move To:</label>
                            <div id="modal-status-selector" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                {statuses.map(s => (
                                    <button
                                        key={s.key}
                                        class={`status-btn ${selectedStatus === s.key ? 'active' : ''}`}
                                        data-status={s.key}
                                        style={`--btn-color: var(--status-${s.key.toLowerCase()})`}
                                        onClick={() => setSelectedStatus(s.key)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; align-items: center; width: 100%; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <label style="font-weight: 600;">Set progress:</label>
                                <div style="display: flex; align-items: center; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; padding: 2px;">
                                    <button class="icon-btn" style="width: 28px; height: 28px; padding: 0;"
                                        onClick={() => setProgress(Math.max(0, progress - 1))}>-</button>
                                    <input
                                        type="number"
                                        value={progress}
                                        min="0"
                                        onInput={(e) => setProgress(parseInt(e.target.value) || 0)}
                                        style="width: 50px; padding: 4px; border: none; background: transparent; text-align: center; color: var(--text-primary); font-family: inherit; font-weight: 600;"
                                    />
                                    <button class="icon-btn" style="width: 28px; height: 28px; padding: 0;"
                                        onClick={() => setProgress(progress + 1)}>+</button>
                                </div>
                            </div>
                            <button class="primary-btn" onClick={handleSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
