import { useState } from 'preact/hooks';
import { userSettings, showToast } from '../../store';
import * as api from '../../api';

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

    return (
        <div id="settings-modal" class="modal">
            <div class="modal-overlay" id="settings-modal-overlay" onClick={onClose} />
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Settings</h2>
                    <button class="modal-close-btn" id="settings-modal-close" onClick={onClose}>×</button>
                </div>
                <div class="modal-body">
                    <div class="settings-group">
                        <label>Preferred Sub Groups</label>
                        <input type="text" id="setting-groups" class="filter-input" value={groups} onInput={e => setGroups(e.target.value)} placeholder="e.g. SubsPlease, Erai-raws" />
                    </div>
                    <div class="settings-group">
                        <label>Preferred Resolution</label>
                        <select id="setting-resolution" class="filter-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                            <option value="1080p">1080p</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                        </select>
                    </div>
                    <div class="settings-group">
                        <label>Download Directory</label>
                        <input type="text" id="setting-download-dir" class="filter-input" value={downloadDir} onInput={e => setDownloadDir(e.target.value)} placeholder="Default download path" />
                    </div>
                    <div class="settings-group">
                        <label>Base Anime Folder</label>
                        <input type="text" id="setting-base-anime-folder" class="filter-input" value={baseFolder} onInput={e => setBaseFolder(e.target.value)} placeholder="e.g. D:\Anime" />
                    </div>
                    <div class="settings-group">
                        <label class="toggle-label">
                            <span>Enable Drag & Drop</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-enable-drag-drop" checked={dragDrop} onChange={e => setDragDrop(e.target.checked)} />
                                <span class="toggle-slider" />
                            </label>
                        </label>
                    </div>
                    <div class="settings-group">
                        <label class="toggle-label">
                            <span>Reduce Colors</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-reduce-colors" checked={reduceColors} onChange={e => setReduceColors(e.target.checked)} />
                                <span class="toggle-slider" />
                            </label>
                        </label>
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
