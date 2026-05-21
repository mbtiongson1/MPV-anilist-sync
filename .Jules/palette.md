## 2026-05-20 - Icon-only buttons lacking ARIA labels
**Learning:** Found multiple instances of icon-only buttons (`<button class="icon-btn">✕</button>`) missing `aria-label`s, especially in modal components like AnimeDetails and Changelog. Additional icon-only buttons in TorrentsView, Upcoming, NowPlaying, RecentAnime, and SelectionBar also lack labels.
**Action:** Always scan for `icon-btn` class usage in React/Preact components to ensure accessibility for screen readers. Always add `aria-label` attributes to icon-only buttons when creating or updating UI components.
