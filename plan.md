1. **Analyze `LibraryView.jsx` issue**:
   - The recursive filtering of the `data` in `LibraryView.jsx` using `filterTree` is an exponential `O(N^2)` operation. The method traverses down the tree recursively during rendering.
   - We will extract `filterTree` logic and wrap it into a `useMemo` block that computes and prunes the full library structure whenever `data` or `search` changes.
   - Also, `filterTree(node.children)` is called recursively not only in `const filtered = filterTree(data);` but also inside `renderNode` on line 143: `search && node.children?.some(c => filterTree([c]).length > 0)` and line 216: `{filterTree(node.children).map(child => renderNode(child, depth + 1))}`.

2. **Implement solution**:
   - Modify `LibraryView.jsx` to introduce a pre-pruned data structure via `useMemo`.
   - Update `renderNode` to not re-filter its children, since they will be already pruned.

3. **Verify Frontend**:
   - Check using `pnpm build`.
   - Take screenshots/videos using `frontend_verification_instructions` script.

4. **Review & Pre-commit Steps**:
   - Ensure the performance improvement is documented in `BOLT.md`.
   - Run lints/tests as requested.
   - Submit PR.
