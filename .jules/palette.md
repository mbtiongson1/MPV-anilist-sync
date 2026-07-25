## 2026-06-08 - Toggle Switch Accessibility & Labels
**Learning:** Custom toggle switches using visually hidden checkboxes inside nested labels break structural accessibility and reduce click target clarity.
**Action:** Always link text labels directly to toggle inputs using the `for` attribute and an `id`, ensure `cursor: pointer` is present to signify interactivity, and attach `onKeyDown` handlers (listening for 'Enter' or 'Space') to restore standard keyboard support lost by hiding the native checkbox.

## 2026-06-09 - Semantic Pagination and Interactive Toggle States
**Learning:** Interactive toggles (like filter toggles) and active page items in pagination lists are opaque to screen readers if they only use visual highlight classes (such as `.active`). Utilizing native `aria-pressed` for toggle buttons and `aria-current="page"` for active pagination page numbers provides critical state semantics to assistive technologies.
**Action:** Always map active tab/page states to `aria-current` and toggle button filter states to `aria-pressed` to communicate selection state explicitly to screen readers.
