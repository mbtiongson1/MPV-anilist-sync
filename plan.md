1. **Optimize Tree Filtering in `LibraryView.jsx`**
   - The current `filterTree` implementation in `LibraryView.jsx` runs recursively during the standard render path for tree structures, which causes exponential O(N^2) overhead because it re-evaluates `filterTree` down the tree repeatedly and allocates new intermediate arrays during `.filter()` and `.map()`.
   - Wrap `filterTree` and the derived expanded state logic in a single `useMemo` block to memoize the filtered library structure and prevent redundant recalculation on unrelated re-renders.

2. **Optimize Chained Filters and List Operations in `StatsView.jsx` and `TorrentsView.jsx`**
   - In `StatsView.jsx` and `TorrentsView.jsx`, chaining `.filter()` with `.reduce()`, `.map()`, or `.forEach()` iterates over the array multiple times and unnecessarily allocates memory for intermediate arrays.
   - Combine multiple list operations into single `for` loops (loop fusion) to prevent unnecessary GC pressure and intermediate array allocations.

3. **Verify Performance Improvement**
   - Run `pnpm build` and the backend test suite to ensure no regressions were introduced. Ensure build times are stable and UI components render correctly.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run formatting and linting. Record performance learnings to `bolt.md`.
