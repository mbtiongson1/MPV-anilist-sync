## 2026-06-08 - Toggle Switch Accessibility & Labels
**Learning:** Custom toggle switches using visually hidden checkboxes inside nested labels break structural accessibility and reduce click target clarity.
**Action:** Always link text labels directly to toggle inputs using the `for` attribute and an `id`, ensure `cursor: pointer` is present to signify interactivity, and attach `onKeyDown` handlers (listening for 'Enter' or 'Space') to restore standard keyboard support lost by hiding the native checkbox.

## 2026-06-09 - Web Accessibility with aria-current and aria-pressed
**Learning:** Interactive toggles (like filter buttons) and pagination components lack state representation for screen reader users when only visual active classes are used.
**Action:** Always use `aria-current='page'` to mark the active page link in pagination controls and `aria-pressed` for toggle buttons (such as filters) to explicitly communicate state to screen readers.
