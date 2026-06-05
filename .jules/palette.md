## 2026-06-05 - Link text labels to checkboxes
**Learning:** In Preact/React components with separated text labels and custom checkboxes, wrapping the text in a `div` severely limits the clickable target area. This makes it difficult for users (especially those on touch devices or with motor impairments) to toggle the checkbox.
**Action:** Always connect the visual `<label>` to the `<input>` using the `for` attribute and corresponding `id` to ensure the text label remains a clickable target. Also ensure cursor style is set to pointer to give user visual feedback.
