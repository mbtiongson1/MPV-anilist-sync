## 2026-05-20 - Icon-only buttons lacking ARIA labels
**Learning:** Found multiple instances of icon-only buttons (`<button class="icon-btn">✕</button>`) missing `aria-label`s, especially in modal components like AnimeDetails and Changelog. Additional icon-only buttons in TorrentsView, Upcoming, NowPlaying, RecentAnime, SelectionBar, and LibraryView also lack labels. While `title` provides a tooltip, it is often not reliably read by all screen readers and does not serve as an accessible name in all contexts. Reusable input clearing buttons (like 'X' clear buttons on search fields) often lack context-specific `aria-label`s, resulting in screen readers just reading "Clear" multiple times on a page without specifying *what* is being cleared.
## 2026-05-20 - Adding explicit aria-labels
**Learning:** Some accessibility issues can be fixed by simply adding an `aria-label` attribute to icon-only buttons or buttons with missing context. `title` attributes alone aren't enough for screen readers. Duplicate `aria-label` elements can occur, so care is needed to find missing elements and avoid adding them redundantly when updating multiple files.
**Action:** When working on UX issues, verify that interactive icon elements have explicit `aria-label` attributes.

## 2026-05-27 - Preact specific accessibility insights
**Learning:** In Preact, standard HTML attributes such as `for` and `class` should be used instead of React-specific `htmlFor` and `className`.
**Action:** When adding accessibility features like linking labels to inputs, ensure `for` is used instead of `htmlFor` to follow Preact conventions.

## 2026-05-30 - Component-Level Aria Labels
**Learning:** Components may have buttons with text that is visually hidden by CSS (e.g. Settings and Full Refresh buttons in the Header) which require explicit `aria-label` attributes to ensure screen readers correctly interpret them, as standard text detection might be confused by the CSS `display: none` logic or similar screen reader heuristics.
**Action:** When adding `aria-label`s to icon-only buttons, also verify if any text-containing buttons in the same component use CSS tricks to hide text, and explicitly provide `aria-label`s for them to guarantee accessibility.

## 2026-06-13 - Toggle Switch Accessibility
**Learning:** Toggle switches built with custom CSS (like the ones in `Settings.jsx`, `Header.jsx`, and `TorrentsView.jsx`) often have text labels placed next to them. If these labels are simply `<span>` elements or generic `<label>` elements without a `for` attribute, the text is not clickable, forcing users to click the exact boundary of the switch component. Furthermore, wrapping the entire switch component and its text inside a single `<label>` element containing another `<label>` is invalid HTML and breaks screen reader parsing.
**Action:** When implementing or fixing custom toggle switches with separated text, ensure the outer container is a `<div>`, and the text is an explicitly linked `<label for="[input-id]" style={{ cursor: 'pointer' }}>`. This gives the text label a pointer cursor and expands the click target to improve usability for mouse users, while making the association clear for screen readers.
