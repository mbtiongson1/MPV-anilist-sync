## 2026-06-08 - Toggle Switch Accessibility & Labels
**Learning:** Custom toggle switches using visually hidden checkboxes inside nested labels break structural accessibility and reduce click target clarity.
**Action:** Always link text labels directly to toggle inputs using the `for` attribute and an `id`, ensure `cursor: pointer` is present to signify interactivity, and attach `onKeyDown` handlers (listening for 'Enter' or 'Space') to restore standard keyboard support lost by hiding the native checkbox.
