## 2024-05-20 - Icon-only buttons lacking ARIA labels
**Learning:** Found multiple instances of icon-only buttons (`<button class="icon-btn">✕</button>`) missing `aria-label`s, especially in modal components like AnimeDetails and Changelog.
**Action:** Always scan for `icon-btn` class usage in React/Preact components to ensure accessibility for screen readers.
