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

## 2026-06-06 - Optimize Library Tree Filtering\n**Learning:** In Preact components, invoking recursive filtering functions (e.g. `filterTree`) inside standard render paths or iterations (like `map()` for tree node expansion checks) causes exponential (N^2)$ performance bottlenecks when searching large tree structures.\n**Action:** Always wrap heavy tree filtering operations in a single `useMemo` block that calculates and returns a fully pruned data structure. This ensures the filter is only executed once when the search query or data changes, rather than re-evaluating the entire branch for every node during rendering.
