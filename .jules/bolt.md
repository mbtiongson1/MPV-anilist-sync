## 2024-05-20 - Redundant O(N) Title Matching Fallback
**Learning:** In `src/library_index.py`, if a normalized candidate title failed to match against the `by_title` lookup dictionary, the code would fall back to an O(N) iteration over *all* entries, re-normalizing every candidate title again in a nested loop. Since `by_title` is populated comprehensively during initialization, this fallback loop would always fail and only acted as a massive performance bottleneck on cache misses.
**Action:** When using dictionary-based lookup tables for fast O(1) matching, trust the lookup table. If a match fails, return early instead of falling back to O(N) exhaustive searches that are computationally expensive and redundant.

## 2026-05-19 - Async Performance Optimization in FastAPI
**Learning:** Using synchronous operations like `requests.get` inside an asynchronous web framework (FastAPI/Uvicorn) can severely degrade performance by exhausting the worker threadpool. This blocks concurrent requests, turning an async application into a bottlenecked synchronous one.
**Action:** Replace `requests` with an asynchronous HTTP client like `httpx.AsyncClient` inside `async def` endpoints to ensure network I/O does not block the event loop or threadpool workers. Always verify the fix with concurrent benchmarking.

## 2026-05-19 - Testing `tkinter` code
**Learning:** `tkinter.Tk` instantiation fails in headless testing environments (e.g. CI/CD or docker containers) because `$DISPLAY` is not set. Mocking UI components such as `tk.Tk` and related widgets (`ttk.Label`, `tk.Text`, etc.) is required to run tests without a real display. Also dynamically fetching attributes dynamically inside methods (like using `webbrowser.open`) needs to be carefully patched at the correct module location.
**Action:** Always patch `tk.Tk` and other `tkinter` UI elements when testing UI modules to prevent `_tkinter.TclError: no display name and no $DISPLAY environment variable`.

## 2026-05-21 - Optimize StatsView React Calculations
**Learning:** `StatsView` calculates very heavy metrics (heatmaps, mean score, Pareto charts) over the entire `animeList` on every render. This blocks the main thread when navigating tabs.
**Action:** Always wrap heavy aggregation operations derived from global store signals in `useMemo` to prevent redundant recalculation.

## 2026-05-21 - Optimize chained Array.filter() in React/Preact useMemo
**Learning:** Chaining multiple `.filter()` calls (e.g., `list.filter(...).filter(...).filter(...)`) inside a `useMemo` block creates significant unnecessary performance overhead and GC pressure. Each `.filter()` call creates and returns a completely new intermediate array, changing a single O(N) pass into O(M*N) complexity and allocating M arrays in memory (where M is the number of filters). Hoist loop-invariant computations (like `.toLowerCase()`, `parseInt()`) outside the loop to avoid redundant operations.
**Action:** When applying multiple optional filters to a list, combine the logic into a single `.filter()` pass that checks all conditions using early returns or boolean logic. Additionally, replace multiple `.filter(...).length` counts over the same data with a single `.reduce()` or standard `for` loop to compute all counts in O(N) instead of O(N * number_of_groups).

## 2026-05-22 - Optimize Array.sort() Comparators
**Learning:** Performing expensive operations—such as unconditionally invoking function calls or allocating arrays for `.indexOf()`—inside an array `sort()` comparator severely degrades performance due to the $O(N \log N)$ execution frequency.
**Action:** When sorting arrays, defer function calls into specific conditional branches that strictly require them. Replace $O(N)$ operations like `.indexOf()` with constant-time $O(1)$ object or map lookups populated outside the sorting iteration.
## 2026-05-23 - Avoid Expensive RegEx inside O(N log N) Array Sorts
**Learning:** In `TorrentsView`, `displayItems` was re-filtered and re-sorted on every render. Because the `sort` operation executed an expensive `parseSize` function (which relies on Regular Expressions) for each item, this created a significant performance bottleneck due to $O(N \log N)$ regex evaluations.
**Action:** Always wrap heavy list processing (filtering and sorting) in a `useMemo` hook to prevent redundant execution on frequent component updates (e.g., selection changes, pagination).

## 2025-02-18 - Block-Scoped Lookup Maps for Array Sorts
**Learning:** Performing Regular Expression evaluations (e.g., regex-based parseSize) or redundant string allocations (e.g., `toLowerCase()`) inside `.sort()` comparators introduces significant $O(N \log N)$ performance bottlenecks in Preact views, which can lead to noticeable UI thread blocking during renders or filter updates.
**Action:** When filtering or sorting large arrays in UI components, always pre-compute derived strings and regex-parsed variables into block-scoped constant-time `Map` lookups before calling `.sort()`.

## 2026-06-07 - Optimize Preact Genre Aggregation Renders
**Learning:** In Preact components, deriving global unique lists (like genres) directly inside the render path via synchronous `forEach` or `map` loops on large state arrays (`animeList.value`) causes severe (N)$ overhead and garbage collection pressure every time the component updates (e.g., toggling a sidebar tab).
**Action:** Always wrap expensive list aggregation and sorting operations derived from global store signals in `useMemo` to prevent redundant execution and UI thread blocking on unrelated component updates.
## 2024-05-23 - Optimize multiple passes over lists in React/Preact
**Learning:** Performing a `.filter()` to create an intermediate array followed by `.forEach()`, `.map()`, or `.reduce()` iterates over the array multiple times and unnecessarily allocates memory for intermediate arrays. This degrades performance, especially in components processing large global state like `StatsView`.
**Action:** When filtering a large list before aggregation, use a single `for` loop to conditionally process items (loop fusion), eliminating the need for intermediate array allocation and halving the total iteration count.
## 2024-06-15 - [Library Tree Recursion Rendering Bottleneck]
**Learning:** In Preact components, avoid invoking recursive filtering functions inside standard render paths or map() iterations for tree structures, as it causes exponential O(N^2) performance bottlenecks.
**Action:** Wrap heavy tree filtering operations in a single useMemo block that returns a fully pruned data structure and pass that to the render path to ensure O(N) complexity.
## 2026-06-25 - O(N*M) Lookup Anti-Pattern
**Learning:** Iterating over global signals using `.find()` inside component render loops (like `.map()` rendering) causes an O(N*M) performance bottleneck, as seen in `Upcoming.jsx`.
**Action:** Always pre-compute a lookup `Map` using `useMemo` outside the loop to reduce lookup time to O(1) during rendering.
## 2026-06-25 - Avoid O(N log N) Sorting in Preact Render Paths
**Learning:** Sorting large arrays (e.g., `animeList.value` containing potentially thousands of entries) directly within a Preact component's functional render body causes the expensive $O(N \log N)$ operation to run on *every single render*. In components like `RecentAnime`, which receives inline props (like `onOpenDetails`) causing it to re-render whenever the parent updates, this blocks the main UI thread and creates noticeable micro-stutters during interactions like tab switching or modal opening.
**Action:** Always wrap heavy list processing, particularly array sorting and filtering derived from large global state signals, in a `useMemo` block to ensure they only re-execute when their actual dependencies change, rather than on every component render cycle.

## 2024-06-29 - O(N log N) Sorting in Preact Renders
**Learning:** Performing array cloning and sorting (`[...list].sort(...)`) directly inside a component's render path without memoization forces the expensive $O(N \log N)$ operation to re-execute on *every* component re-render, even if the underlying list hasn't changed. In `RecentAnime.jsx`, this bottleneck was triggered by any parent update or signal change unrelated to the `animeList.value` state.
**Action:** Always wrap expensive list transformations (like `.sort()` or `.filter()`) on large arrays in `useMemo` hooks, ensuring they only recompute when their explicit dependency array changes.

## 2026-06-25 - Extracted static arrays to module-level constants
**Learning:** Extracting static arrays to module-level constants in React/Preact components prevents redundant array allocations and garbage collection on every render.
**Action:** When working on React/Preact components, always move static arrays (like lists of tabs or extensions) and static JSX sets (like navigation icons) outside the component definition to module scope, especially if they are used for mapping or filtering. Use `Set` instead of `Array` when checking for existence (`.has()` vs `.includes()`) for faster `O(1)` lookups.
