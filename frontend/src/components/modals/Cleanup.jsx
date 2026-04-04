import { useState } from 'preact/hooks';
import { animeList, cleanupCandidates, recordApiRequest, showToast } from '../../store';
import { getRelativeTime } from '../../utils';

export function CleanupModal({ visible, onClose }) {
    const [step, setStep] = useState(1);
    const [retentionVal, setRetentionVal] = useState(parseInt(localStorage.getItem('cleanupPrefs') ? JSON.parse(localStorage.getItem('cleanupPrefs')).val : '3') || 3);
    const [retentionUnit, setRetentionUnit] = useState(localStorage.getItem('cleanupPrefs') ? JSON.parse(localStorage.getItem('cleanupPrefs')).unit || 'months' : 'months');
    const [activeTiers, setActiveTiers] = useState(new Set());
    const [activeFormats, setActiveFormats] = useState(new Set());
    const [checkedIds, setCheckedIds] = useState(new Set());

    if (!visible) return null;

    const toggleTier = (tier) => {
        const newSet = new Set(activeTiers);
        newSet.has(tier) ? newSet.delete(tier) : newSet.add(tier);
        setActiveTiers(newSet);
    };

    const toggleFormat = (format) => {
        const newSet = new Set(activeFormats);
        newSet.has(format) ? newSet.delete(format) : newSet.add(format);
        setActiveFormats(newSet);
    };

    const handleNext = () => {
        let retentionDays = retentionVal;
        if (retentionUnit === 'months') retentionDays = retentionVal * 30;
        if (retentionUnit === 'years') retentionDays = retentionVal * 365;

        const now = Math.floor(Date.now() / 1000);
        const cutoff = now - (retentionDays * 86400);

        const candidates = animeList.value.filter(a =>
            a.listStatus === 'CURRENT' && a.updatedAt && a.updatedAt < cutoff
        );

        if (candidates.length === 0) {
            showToast('No anime found matching retention criteria.');
            return;
        }

        cleanupCandidates.value = candidates;
        setCheckedIds(new Set(candidates.map(a => a.mediaId.toString())));
        setStep(2);
    };

    const filteredCandidates = cleanupCandidates.value.filter(a => {
        const prog = a.progress || 0;
        const format = (a.format || 'TV').toUpperCase();

        let matchesTier = activeTiers.size === 0;
        if (!matchesTier) {
            if (activeTiers.has('0') && prog === 0) matchesTier = true;
            if (activeTiers.has('1') && prog === 1) matchesTier = true;
            if (activeTiers.has('3') && prog >= 2 && prog <= 3) matchesTier = true;
            if (activeTiers.has('6') && prog >= 4 && prog <= 6) matchesTier = true;
            if (activeTiers.has('6+') && prog > 6) matchesTier = true;
        }
        if (!matchesTier) return false;

        let matchesFormat = activeFormats.size === 0 || activeFormats.has(format);
        return matchesFormat;
    });

    const handleConfirm = () => {
        let count = 0;
        filteredCandidates.forEach(a => {
            if (!checkedIds.has(a.mediaId.toString())) return;
            const title = a.title?.romaji || a.title?.english || 'Unknown';
            recordApiRequest('STATUS', a.mediaId, { status: 'DROPPED' }, `${title}: Auto-Drop (Inactive)`);
            a.listStatus = 'DROPPED';
            count++;
        });
        if (count > 0) {
            animeList.value = [...animeList.value];
            showToast(`Marked ${count} anime as Dropped (Pending)`);
        }
        onClose();
    };

    const tiers = [
        { key: '0', label: '0 eps' },
        { key: '1', label: '1 ep' },
        { key: '3', label: '2-3 eps' },
        { key: '6', label: '4-6 eps' },
        { key: '6+', label: '6+ eps' },
    ];

    const formats = ['TV', 'ONA', 'OVA', 'MOVIE', 'SPECIAL'];

    return (
        <div id="cleanup-modal" class="modal">
            <div class="modal-overlay" onClick={onClose} />
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Cleanup In Progress List</h2>
                    <button class="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div class="modal-body">
                    {step === 1 && (
                        <div id="cleanup-step-1">
                            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                                Find anime in your "In Progress" list that haven't been updated recently, so you can drop them.
                            </p>
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                                <label style="font-weight: 600;">Inactive for at least:</label>
                                <input type="number" value={retentionVal} min="1" onInput={e => setRetentionVal(parseInt(e.target.value) || 1)}
                                    style="width: 60px; padding: 4px 8px;" class="filter-input" />
                                <select value={retentionUnit} onChange={e => setRetentionUnit(e.target.value)} class="filter-select">
                                    <option value="days">Days</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </select>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div id="cleanup-step-2">
                            <div style="margin-bottom: 1rem;">
                                <label style="font-weight: 600; margin-bottom: 6px; display: block;">Filter by watched episodes:</label>
                                <div id="cleanup-tier-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    {tiers.map(t => (
                                        <button key={t.key} class={`tier-pill ${activeTiers.has(t.key) ? 'active' : ''}`}
                                            data-tier={t.key} onClick={() => toggleTier(t.key)}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <label style="font-weight: 600; margin-bottom: 6px; display: block;">Filter by format:</label>
                                <div id="cleanup-format-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    {formats.map(f => (
                                        <button key={f} class={`tier-pill ${activeFormats.has(f) ? 'active' : ''}`}
                                            data-format={f} onClick={() => toggleFormat(f)}>
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" id="cleanup-select-all" checked={checkedIds.size === filteredCandidates.length}
                                    onChange={(e) => {
                                        if (e.target.checked) setCheckedIds(new Set(filteredCandidates.map(a => a.mediaId.toString())));
                                        else setCheckedIds(new Set());
                                    }} />
                                <label for="cleanup-select-all" style="font-weight: 600;">Select All ({filteredCandidates.length})</label>
                            </div>
                            <div id="cleanup-container" style="max-height: 400px; overflow-y: auto;">
                                {filteredCandidates.length === 0 && (
                                    <div style="padding: 20px; text-align: center; color: var(--text-muted);">No anime match your active filters.</div>
                                )}
                                {filteredCandidates.map(a => {
                                    const title = a.title?.romaji || a.title?.english || 'Unknown';
                                    const year = a.seasonYear ? ` (${a.seasonYear})` : '';
                                    const relTime = getRelativeTime(a.updatedAt);
                                    const id = a.mediaId.toString();
                                    return (
                                        <div key={id} class="changelog-item" style="display: flex; align-items: center; gap: 10px;">
                                            <input type="checkbox" checked={checkedIds.has(id)}
                                                onChange={(e) => {
                                                    const newSet = new Set(checkedIds);
                                                    e.target.checked ? newSet.add(id) : newSet.delete(id);
                                                    setCheckedIds(newSet);
                                                }} />
                                            <div style="flex: 1;">
                                                <strong>{title}{year}</strong><br />
                                                <span style="font-size: 0.8rem; color: var(--text-muted);">
                                                    Inactive for {relTime} • Watched: {a.progress || 0} eps • {a.format || 'TV'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="secondary-btn" onClick={onClose}>Cancel</button>
                    {step === 1 && <button class="primary-btn" onClick={handleNext}>Next</button>}
                    {step === 2 && <button class="primary-btn" onClick={handleConfirm}>Drop Selected</button>}
                </div>
            </div>
        </div>
    );
}
