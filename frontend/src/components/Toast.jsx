import { useEffect } from 'preact/hooks';
import { toasts } from '../store';

export function Toast() {
    const items = toasts.value;

    if (items.length === 0) return null;

    return (
        <div class="toast-container" aria-live="polite" aria-atomic="true">
            {items.map(t => (
                <ToastItem key={t.id} toast={t} />
            ))}
        </div>
    );
}

function ToastItem({ toast }) {
    useEffect(() => {
        const el = document.getElementById(`toast-${toast.id}`);
        if (el) {
            // Trigger fade-out 500ms before removal
            const timer = setTimeout(() => el.classList.add('fade-out'), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.id]);

    return (
        <div id={`toast-${toast.id}`} class={`toast toast-${toast.type}`} role="status">
            {toast.message}
        </div>
    );
}
