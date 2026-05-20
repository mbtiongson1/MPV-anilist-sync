## 2026-05-19 - React Stats Performance
**Learning:** `StatsView` calculates very heavy metrics (heatmaps, mean score, Pareto charts) over the entire `animeList` on every render. This blocks the main thread when navigating tabs.
**Action:** Always wrap heavy aggregation operations derived from global store signals in `useMemo` to prevent redundant recalculation.
