## 2026-05-20 - Icon-only buttons lacking ARIA labels
**Learning:** Found multiple instances of icon-only buttons (`<button class="icon-btn">✕</button>`) missing `aria-label`s, especially in modal components like AnimeDetails and Changelog. Additional icon-only buttons in TorrentsView, Upcoming, NowPlaying, RecentAnime, SelectionBar, and LibraryView also lack labels. While `title` provides a tooltip, it is often not reliably read by all screen readers and does not serve as an accessible name in all contexts. Reusable input clearing buttons (like 'X' clear buttons on search fields) often lack context-specific `aria-label`s, resulting in screen readers just reading "Clear" multiple times on a page without specifying *what* is being cleared.
**Action:** Always scan for `icon-btn` class usage in React/Preact components to ensure accessibility for screen readers. Always add explicit `aria-label` attributes to icon-only interactive elements (buttons, anchor tags), regardless of whether a `title` attribute is present. When adding `aria-label`s to generic clear or action buttons, always include the context of the action (e.g., "Clear Group Filter" instead of just "Clear").
<<<<<<< HEAD

## 2026-05-20 - Adding explicit aria-labels
**Learning:** Some accessibility issues can be fixed by simply adding an `aria-label` attribute to icon-only buttons or buttons with missing context. `title` attributes alone aren't enough for screen readers. Duplicate `aria-label` elements can occur, so care is needed to find missing elements and avoid adding them redundantly when updating multiple files.
**Action:** When working on UX issues, verify that interactive icon elements have explicit `aria-label` attributes.

## 2026-05-27 - Preact specific accessibility insights
**Learning:** In Preact, standard HTML attributes such as `for` and `class` should be used instead of React-specific `htmlFor` and `className`.
**Action:** When adding accessibility features like linking labels to inputs, ensure `for` is used instead of `htmlFor` to follow Preact conventions.

## 2026-05-30 - Component-Level Aria Labels
**Learning:** Components may have buttons with text that is visually hidden by CSS (e.g. Settings and Full Refresh buttons in the Header) which require explicit `aria-label` attributes to ensure screen readers correctly interpret them, as standard text detection might be confused by the CSS `display: none` logic or similar screen reader heuristics.
**Action:** When adding `aria-label`s to icon-only buttons, also verify if any text-containing buttons in the same component use CSS tricks to hide text, and explicitly provide `aria-label`s for them to guarantee accessibility.
