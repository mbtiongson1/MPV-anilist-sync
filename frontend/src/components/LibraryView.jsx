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
            <div class="library-toolbar">
                <div class="library-search">
                    <SearchIcon size={14} />
                    <input type="text" placeholder="Search library..." value={search} onInput={e => setSearch(e.target.value)} class="filter-input" />
                </div>
                <button class="refresh-btn" onClick={() => fetchLibrary(true)} title="Refresh Library">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                </button>
            </div>
            <div id="library-tree-container" class="library-tree-container">
                {loading && <div class="loading-state"><div class="spinner" /><p>Scanning library...</p></div>}
                {!loading && filtered.length === 0 && (
                    <div class="empty-state"><p>No library items found. Set a Base Anime Folder in Settings.</p></div>
                )}
                {!loading && filtered.map(node => renderNode(node, 0))}
            </div>
        </div>
    );
}
