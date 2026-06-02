import { useState, useEffect, useRef } from 'preact/hooks';

export function MiniWindow({ id, title, visible, onClose, defaultPos, savedPos, onPositionChange, children }) {
    if (!visible) return null;

    const [isMinimized, setIsMinimized] = useState(false);
    const [pos, setPos] = useState(savedPos || defaultPos || { x: 100, y: 100 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const windowStart = useRef({ x: 0, y: 0 });

    // Sync position if savedPos changes from external updates (e.g. initial load)
    useEffect(() => {
        if (savedPos) {
            setPos(savedPos);
        }
    }, [savedPos]);

    const handleMouseDown = (e) => {
        // Drag only from the header, and not from buttons inside the header or inputs
        if (e.target.closest('.mini-window-btn') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
        
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        windowStart.current = { x: pos.x, y: pos.y };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        let newX = windowStart.current.x + dx;
        let newY = windowStart.current.y + dy;
        
        // Prevent dragging completely off screen
        newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 40, newY));

        setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        if (isDragging.current) {
            isDragging.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (onPositionChange) {
                onPositionChange(id, pos);
            }
        }
    };

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div 
            class={`mini-window ${isMinimized ? 'minimized' : ''}`} 
            style={{ 
                position: 'fixed', 
                left: `${pos.x}px`, 
                top: `${pos.y}px`, 
                zIndex: 1000,
            }}
        >
            <div class="mini-window-header" onMouseDown={handleMouseDown}>
                <div class="mini-window-title-group">
                    <span class="mini-window-drag-dots">⋮⋮</span>
                    <span class="mini-window-title">{title}</span>
                </div>
                <div class="mini-window-actions">
                    <button 
                        class="mini-window-btn minimize-btn" 
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? "Restore" : "Minimize"}
                        aria-label={isMinimized ? "Restore" : "Minimize"}
                    >
                        {isMinimized ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        )}
                    </button>
                    <button 
                        class="mini-window-btn close-btn" 
                        onClick={onClose}
                        title="Close"
                        aria-label="Close"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
            {!isMinimized && (
                <div class="mini-window-content">
                    {children}
                </div>
            )}
        </div>
    );
}
