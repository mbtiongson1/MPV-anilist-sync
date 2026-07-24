import { useState } from 'preact/hooks';
import { userSettings, showToast, appUpdateStatus } from '../../store';
import * as api from '../../api';
import { CloseIcon } from '../../icons';

export function SettingsModal({ visible, onClose, onSaved }) {
    if (!visible) return null;

    const s = userSettings.value || {};
    const [groups, setGroups] = useState(s.preferred_groups || '');
    const [resolution, setResolution] = useState(s.preferred_resolution || '1080p');
    const [downloadDir, setDownloadDir] = useState(s.default_download_dir || '');
    const [baseFolder, setBaseFolder] = useState(s.base_anime_folder || '');
    const [dragDrop, setDragDrop] = useState(s.enable_drag_drop !== false);
    const [reduceColors, setReduceColors] = useState(s.reduce_colors === true);
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [checking, setChecking] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                preferred_groups: groups,
                preferred_resolution: resolution,
                default_download_dir: downloadDir,
                base_anime_folder: baseFolder,
                enable_drag_drop: dragDrop,
                reduce_colors: reduceColors
            };
            const resp = await api.saveSettings(payload);
            if (resp) {
                const newSettings = await api.loadSettings();
                userSettings.value = newSettings;
                onClose();
                onSaved?.();
            }
        } catch (e) {
            showToast('Error saving settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleResetOverrides = async () => {
        if (confirm("Are you sure you want to reset all custom title overrides?")) {
            try {
                const data = await api.resetTitleOverrides();
                if (data.success) {
                    showToast("Title overrides reset successfully");
                    onClose();
                    onSaved?.();
                }
            } catch (e) {
                showToast("Error resetting overrides", "error");
            }
        }
    };

    const handleCheckUpdate = async () => {
        setChecking(true);
        try {
            const res = await api.checkUpdate();
            appUpdateStatus.value = res;
            if (res.update_available) {
                showToast(`New update available: v${res.latest_version}`);
            } else if (res.error) {
                showToast(`Failed to check updates: ${res.error}`, 'error');
            } else {
                showToast('App is up to date');
            }
        } catch (e) {
            showToast('Failed to check updates', 'error');
        } finally {
            setChecking(false);
        }
    };

    const handleDownloadUpdate = async () => {
        if (!confirm('This will download the update and launch the installer. The app will close. Proceed?')) return;
        setUpdating(true);
        try {
            const res = await api.downloadUpdate();
            if (res.success) {
                showToast(res.message || 'Update downloaded and opened successfully.');
            } else {
                showToast(res.message || 'Failed to install update.', 'error');
            }
        } catch (e) {
            showToast('Error downloading update.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div id="settings-modal" class="modal">
            <div class="modal-overlay" id="settings-modal-overlay" onClick={onClose} />
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Settings</h2>
                    <button class="modal-close-btn" id="settings-modal-close" onClick={onClose} aria-label="Close">
                        <CloseIcon size={16} />
                    </button>
                </div>
                <div class="modal-body">
                    <div class="settings-group">
                        <label for="setting-groups">Preferred Sub Groups</label>
                        <input type="text" id="setting-groups" class="filter-input" value={groups} onInput={e => setGroups(e.target.value)} placeholder="e.g. SubsPlease, Erai-raws" />
                    </div>
                    <div class="settings-group">
                        <label for="setting-resolution">Preferred Resolution</label>
                        <select id="setting-resolution" class="filter-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                            <option value="1080p">1080p</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label for="setting-download-dir">Download Directory</label>
                        <input type="text" id="setting-download-dir" class="filter-input" value={downloadDir} onInput={e => setDownloadDir(e.target.value)} placeholder="Default download path" />
                    </div>
                    <div class="settings-group">
                        <label for="setting-base-anime-folder">Base Anime Folder</label>
                        <input type="text" id="setting-base-anime-folder" class="filter-input" value={baseFolder} onInput={e => setBaseFolder(e.target.value)} placeholder="e.g. D:\Anime" />
                    </div>
                    <div class="settings-group">
                        <div class="toggle-label">
                            <label for="setting-enable-drag-drop" style={{ cursor: 'pointer' }}>Enable Drag & Drop</label>
                            <label class="toggle-switch" for="setting-enable-drag-drop">
                                <input type="checkbox" id="setting-enable-drag-drop" checked={dragDrop} onChange={e => setDragDrop(e.target.checked)} onKeyDown={e => e.key === 'Enter' && setDragDrop(!dragDrop)} />
                                <span class="toggle-slider" />
                            </label>
                        </div>
                    </div>
                    <div class="settings-group">
                        <div class="toggle-label">
                            <label for="setting-reduce-colors" style={{ cursor: 'pointer' }}>Reduce Colors</label>
                            <label class="toggle-switch" for="setting-reduce-colors">
                                <input type="checkbox" id="setting-reduce-colors" checked={reduceColors} onChange={e => setReduceColors(e.target.checked)} onKeyDown={e => e.key === 'Enter' && setReduceColors(!reduceColors)} />
                                <span class="toggle-slider" />
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-group" style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
                        <h3 style="margin-bottom: 0.5rem; font-size: 1rem; font-weight: bold; color: var(--text-primary);">Application Updates</h3>
                        <div style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-muted);">
                            Current Version: <strong>v{appUpdateStatus.value?.current_version || 'unknown'}</strong>
                        </div>
                        {appUpdateStatus.value?.update_available ? (
                            <div style="background: var(--success-dim); border: 1px solid var(--success); padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem;">
                                <div style="font-weight: bold; color: var(--success); margin-bottom: 0.25rem;">
                                    A new version is available: v{appUpdateStatus.value.latest_version}
                                </div>
                                {appUpdateStatus.value.changelog && (
                                    <div style="font-size: 0.8rem; max-height: 100px; overflow-y: auto; margin-bottom: 0.75rem; padding: 0.5rem; background: var(--bg-input); border-radius: 4px; white-space: pre-wrap; color: var(--text-secondary);">
                                        {appUpdateStatus.value.changelog}
                                    </div>
                                )}
                                <button class="primary-btn" onClick={handleDownloadUpdate} disabled={updating}>
                                    {updating ? 'Downloading & Installing...' : 'Download & Install Update'}
                                </button>
                            </div>
                        ) : (
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                {checking ? 'Checking for updates...' : 'Your application is up to date.'}
                                {!checking && (
                                    <button class="secondary-btn" style="margin-left: 0.75rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onClick={handleCheckUpdate}>
                                        Check Now
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div class="settings-group" style="border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 0.5rem;">
                        <button id="btn-reset-overrides" class="secondary-btn" onClick={handleResetOverrides}>Reset All Title Overrides</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="settings-save-btn" class="primary-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}

