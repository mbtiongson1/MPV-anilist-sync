import { useState, useEffect } from 'preact/hooks';
import { libraryData, libraryExclusions, showToast } from '../store';
import { escapeHtml, formatBytes } from '../utils';
import { FolderIcon, PlayIcon, ChevronIcon, VideoIcon, SearchIcon } from '../icons';
import * as api from '../api';

export function LibraryView() {
    const [loading, setLoading] = useState(false);
    const [libraryActionLoading, setLibraryActionLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [expandedDirs, setExpandedDirs] = useState(new Set());

    const data = libraryData.value;
    const exclusions = libraryExclusions.value;

    const fetchLibrary = async (force = false) => {
        setLoading(true);
        try {
            const [lib, excl] = await Promise.all([
                api.fetchLibrary(force),
                api.fetchLibraryExclusions()
            ]);
            libraryData.value = lib || [];
            libraryExclusions.value = excl?.exclusions || [];
        } catch (e) {
            showToast('Failed to load library', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data.length === 0) fetchLibrary();
    }, []);

    const toggleDir = (path) => {
        const newSet = new Set(expandedDirs);
        newSet.has(path) ? newSet.delete(path) : newSet.add(path);
        setExpandedDirs(newSet);
    };

    const isExcluded = (path) => exclusions.some(e => path.startsWith(e));

    const handleExclude = async (path) => {
        try {
            await api.excludePath(path);
            libraryExclusions.value = [...exclusions, path];
            showToast('Path excluded');
        } catch (e) {
            showToast('Failed to exclude path', 'error');
        }
    };

    const handleInclude = async (path) => {
        try {
            await api.includePath(path);
            libraryExclusions.value = exclusions.filter(e => e !== path);
            showToast('Path included');
        } catch (e) {
            showToast('Failed to include path', 'error');
        }
    };

    const handlePlay = (path) => {
        api.playFile(path);
    };

    const handleOpenFolder = (path) => {
        api.openFolderByPath(path);
    };

    const handleCleanupFiles = async () => {
        if (libraryActionLoading) return;
        setLibraryActionLoading(true);
        try {
            const candidates = await api.fetchCleanupCandidates();
            if (!Array.isArray(candidates) || candidates.length === 0) {
                showToast('No cleanup candidates found');
                return;
            }

            const selectedPaths = candidates.map(c => c.path).filter(Boolean);
            if (selectedPaths.length === 0) {
                showToast('No cleanup candidates found');
                return;
            }

            const shouldProceed = window.confirm(`Move ${selectedPaths.length} watched/completed files to Trash?`);
            if (!shouldProceed) return;

            const result = await api.moveToTrash(selectedPaths);
            if (result?.success) {
                showToast(`Moved ${result.count || selectedPaths.length} files to Trash`);
                await fetchLibrary(true);
            } else {
                showToast('Failed to move some files to Trash', 'error');
            }
        } catch (e) {
            showToast('Cleanup failed', 'error');
        } finally {
            setLibraryActionLoading(false);
        }
    };

    const handleOrganizeFolders = async () => {
        if (libraryActionLoading) return;
        setLibraryActionLoading(true);
        try {
            const result = await api.organizeFolders();
            if (result?.success) {
                const movedCount = Array.isArray(result.results) ? result.results.length : 0;
                showToast(movedCount > 0 ? `Organized ${movedCount} file${movedCount === 1 ? '' : 's'}` : 'No loose files to organize');
                await fetchLibrary(true);
            } else {
                showToast('Failed to organize folders', 'error');
            }
        } catch (e) {
            showToast('Failed to organize folders', 'error');
        } finally {
            setLibraryActionLoading(false);
        }
    };

    // Filter library items by search
    const filterTree = (items) => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter(item => {
            const nameMatch = (item.name || '').toLowerCase().includes(q);
            if (nameMatch) return true;
            if (item.children) return filterTree(item.children).length > 0;
            return false;
        });
    };

    const filtered = filterTree(data);

    const renderNode = (node, depth = 0) => {
        const isDir = node.type === 'directory' || (node.children && node.children.length > 0);
        const excluded = isExcluded(node.path);
        
        // Expand if it's root, or if user expanded, or if searching matches children
        const expanded = depth === 0 || expandedDirs.has(node.path) || (search && node.children?.some(c => filterTree([c]).length > 0));

        const padLeft = depth * 16 + 8;
        const isVideo = !isDir && ['mkv', 'mp4', 'avi', 'webm', 'flv', 'mov', 'ts'].includes((node.name || '').split('.').pop().toLowerCase());

        const handleCheckbox = (e) => {
            e.stopPropagation();
            if (excluded) handleInclude(node.path);
            else handleExclude(node.path);
        };

        const itemContent = (
            <div class="tree-item" style={{ paddingLeft: `${padLeft}px`, opacity: excluded ? 0.5 : 1 }} onClick={() => isDir && toggleDir(node.path)}>
                <div class={`tree-chevron ${isDir ? '' : 'leaf'} ${expanded ? 'expanded' : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
                <input type="checkbox" class="library-trash-checkbox custom-checkbox" checked={!excluded} onChange={handleCheckbox} style={{ marginRight: '8px' }} onClick={e => e.stopPropagation()} />
                <div class="tree-icon">
                    {isDir ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                    )}
                </div>
                
                <div class="tree-label-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div class="tree-label" style={node.mediaId ? { fontWeight: '700', color: 'var(--accent)' } : {}}>
                            {escapeHtml(node.name)}
                        </div>
                        
                        {isDir && (
                            <button class="tree-action-btn" title="Open Folder" onClick={(e) => { e.stopPropagation(); handleOpenFolder(node.path); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            </button>
                        )}
                        
                        {!isDir && isVideo && (
                            <button class="tree-action-btn play-btn" title="Play File" onClick={(e) => { e.stopPropagation(); handlePlay(node.path); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>
                            </button>
                        )}
                    </div>

                    {node.mediaId && node.listStatus && (
                        <div class="tree-sublabel" style={{ color: node.listStatus === 'CURRENT' ? '#10b981' : '#94a3b8' }}>
                            {node.listStatus === 'CURRENT' ? 'In Progress' : node.listStatus.charAt(0) + node.listStatus.slice(1).toLowerCase()}
                        </div>
                    )}
                    {isDir && !node.mediaId && node.name !== 'Downloads' && (
                        <div class="tree-sublabel not-matched">Not in library</div>
                    )}
                </div>
                
                <div class="tree-meta">
                    {!isDir ? formatBytes(node.size || 0) : `${formatBytes(node.size || 0)} (${node.children?.length || 0} items)`}
                </div>
                
                <div class="tree-actions">
                    {isDir && (
                        <button class="tree-action-btn" title="Search Torrents" onClick={(e) => { e.stopPropagation(); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </button>
                    )}
                </div>
            </div>
        );

        return (
            <div key={node.path} class="tree-node">
                {itemContent}
                {isDir && node.children && (
                    <div class={`tree-children ${expanded ? 'expanded' : ''}`}>
                        {filterTree(node.children).map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div id="library-content" class="library-content">
            <div class="library-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Local Library Tree</h3>
                    <button id="btn-refresh-library" class="tree-action-btn" title="Refresh Library" style={{ opacity: 1 }} onClick={() => fetchLibrary(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M2.66 15.57a10 10 0 0 0 17.68-1.27M21.34 8.43a10 10 0 0 0-17.68 1.27"/></svg>
                    </button>
                    <a id="link-edit-path" href="#" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); /* open settings */ }}>Edit library path</a>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button id="btn-cleanup-files" class="secondary-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', opacity: libraryActionLoading ? 0.7 : 1 }} title="Cleanup watched/completed files" onClick={handleCleanupFiles} disabled={libraryActionLoading}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Cleanup Files
                    </button>
                    <button id="btn-organize-folders" class="secondary-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: libraryActionLoading ? 0.7 : 1 }} onClick={handleOrganizeFolders} disabled={libraryActionLoading}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg> Automatically organize anime folders
                    </button>
                </div>
            </div>
            <div class="library-search-container" style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                <div class="filter-search">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="library-search-input" placeholder="Search files or folders..." style={{ width: '100%' }} value={search} onInput={e => setSearch(e.target.value)} />
                    {search && <button id="btn-clear-library-search" class="clear-search-btn" title="Clear search" onClick={() => setSearch('')}>✕</button>}
                </div>
            </div>
            <div id="library-tree-container">
                {loading && <div class="loading-state"><div class="spinner" /><p>Scanning library...</p></div>}
                {!loading && filtered.length === 0 && (
                    <div class="empty-state"><p>No library items found. Set a Base Anime Folder in Settings.</p></div>
                )}
                {!loading && filtered.map(node => renderNode(node, 0))}
            </div>
        </div>
    );
}
