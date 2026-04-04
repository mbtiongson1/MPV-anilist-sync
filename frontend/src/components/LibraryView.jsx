import { useState, useEffect } from 'preact/hooks';
import { libraryData, libraryExclusions, showToast } from '../store';
import { escapeHtml, formatBytes } from '../utils';
import { FolderIcon, PlayIcon, ChevronIcon, VideoIcon, SearchIcon } from '../icons';
import * as api from '../api';

export function LibraryView() {
    const [loading, setLoading] = useState(false);
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
        const expanded = expandedDirs.has(node.path);
        const padLeft = depth * 16;

        if (isDir) {
            let children = node.children || [];
            if (search) children = filterTree(children);
            const fileCount = children.filter(c => c.type !== 'directory').length;
            const dirCount = children.filter(c => c.type === 'directory').length;

            return (
                <div key={node.path}>
                    <div class={`library-row library-dir ${excluded ? 'excluded' : ''}`}
                        style={`padding-left: ${padLeft + 8}px;`}
                        onClick={() => toggleDir(node.path)}>
                        <div class="library-expand">
                            <ChevronIcon size={10} style={expanded ? 'transform: rotate(90deg);' : ''} />
                        </div>
                        <FolderIcon size={14} />
                        <span class="library-name" title={node.name}>{escapeHtml(node.name)}</span>
                        <span class="library-count">{fileCount} file{fileCount !== 1 ? 's' : ''}{dirCount > 0 ? `, ${dirCount} folder${dirCount !== 1 ? 's' : ''}` : ''}</span>
                        <div class="library-actions" onClick={e => e.stopPropagation()}>
                            <button class="icon-btn" onClick={() => handleOpenFolder(node.path)} title="Open in Explorer"><FolderIcon size={12} /></button>
                            {excluded ? (
                                <button class="icon-btn" onClick={() => handleInclude(node.path)} title="Include">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                            ) : (
                                <button class="icon-btn" onClick={() => handleExclude(node.path)} title="Exclude">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                    {expanded && children.map(child => renderNode(child, depth + 1))}
                </div>
            );
        }

        // File node
        const ext = (node.name || '').split('.').pop().toLowerCase();
        const isVideo = ['mkv', 'mp4', 'avi', 'webm', 'flv', 'mov', 'ts'].includes(ext);

        return (
            <div key={node.path} class={`library-row library-file ${excluded ? 'excluded' : ''}`}
                style={`padding-left: ${padLeft + 28}px;`}>
                {isVideo ? <VideoIcon size={14} /> : <span style="width:14px;" />}
                <span class="library-name" title={node.name}>{escapeHtml(node.name)}</span>
                {node.size && <span class="library-size">{formatBytes(node.size)}</span>}
                <div class="library-actions">
                    {isVideo && <button class="icon-btn" onClick={() => handlePlay(node.path)} title="Play"><PlayIcon size={12} /></button>}
                </div>
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
                    <button id="btn-cleanup-files" class="secondary-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} title="Cleanup watched/completed files">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Cleanup Files
                    </button>
                    <button id="btn-organize-folders" class="secondary-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
