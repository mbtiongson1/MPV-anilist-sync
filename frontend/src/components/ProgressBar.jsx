import { MinusIcon, PlusIcon } from '../icons';

export function ProgressBar({ progress, total, nextAiringEpisode, mediaId, showButtons = false, onIncrement, onDecrement }) {
    let validTotal = (total && total > 0) ? total : 0;
    let available = validTotal;

    if (nextAiringEpisode?.episode) {
        available = Math.max(0, nextAiringEpisode.episode - 1);
        if (validTotal === 0) validTotal = available + 1;
        if (available > validTotal) available = validTotal;
    }

    if (validTotal <= 0) validTotal = Math.max(progress, 1);
    if (available < progress) available = progress;

    const pWatched = Math.min((progress / validTotal) * 100, 100);
    const pAvailable = Math.min(((available - progress) / validTotal) * 100, 100);

    const bar = (
        <div class="progress-bar-container">
            <div class="progress-bar-watched" style={{ width: `${pWatched}%` }} />
            <div class="progress-bar-available" style={{ width: `${pAvailable}%` }} />
        </div>
    );

    if (showButtons && mediaId) {
        return (
            <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                <button
                    class="icon-btn btn-minus-prog"
                    onClick={(e) => { e.stopPropagation(); onDecrement?.(mediaId); }}
                    style="padding: 0.1rem; width: 22px; height: 22px; flex-shrink: 0;"
                    aria-label="Decrease Episode"
                    title="-1 Episode"
                >
                    <MinusIcon size={12} />
                </button>
                {bar}
                <button
                    class="icon-btn btn-plus-prog"
                    onClick={(e) => { e.stopPropagation(); onIncrement?.(mediaId); }}
                    style="padding: 0.1rem; width: 22px; height: 22px; flex-shrink: 0;"
                    aria-label="Increase Episode"
                    title="+1 Episode"
                >
                    <PlusIcon size={12} />
                </button>
            </div>
        );
    }

    return bar;
}
