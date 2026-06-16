import { CloseIcon } from '../../icons';

export function Modal({ id, title, visible, onClose, children, footer }) {
    if (!visible) return null;

    return (
        <div id={id} class="modal">
            <div class="modal-overlay" onClick={onClose} />
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="details-modal-title">{title}</h2>
                    <button class="modal-close-btn" aria-label="Close modal" onClick={onClose}>
                        <CloseIcon size={16} />
                    </button>
                </div>
                <div id="modal-body" class="modal-body">
                    {children}
                </div>
                {footer && (
                    <div class="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
