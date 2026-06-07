## 2026-06-07 - Label-to-Checkbox Linkage and Keyboard A11y
**Learning:** In Preact components, specifically  and , detached text labels next to checkboxes reduced clickable areas and keyboard accessibility. Using standard HTML `for` and `id` attributes significantly improves usability, and adding `onKeyDown` ensures custom toggles remain accessible.
**Action:** Always wrap or link textual descriptions to their corresponding inputs using `for`/`id` and apply `cursor-pointer`. Ensure interactive toggles that perform actions directly (like filtering/searching) handle keyboard events like 'Enter'.
## 2026-06-07 - Label-to-Checkbox Linkage and Keyboard A11y
**Learning:** In Preact components, specifically TorrentsView.jsx and Cleanup.jsx, detached text labels next to checkboxes reduced clickable areas and keyboard accessibility. Using standard HTML 'for' and 'id' attributes significantly improves usability, and adding onKeyDown ensures custom toggles remain accessible.
**Action:** Always wrap or link textual descriptions to their corresponding inputs using 'for'/'id' and apply cursor-pointer. Ensure interactive toggles that perform actions directly handle keyboard events like Enter.
