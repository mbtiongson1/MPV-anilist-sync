---
description: Rebuild the React frontend UI for the MPV Anilist Tracker
---

This workflow automates the process of installing Node.js dependencies and rebuilding the React frontend into the `frontend/dist` directory, which is served by the Python backend.

### Prerequisites

- **Node.js** and **npm** must be installed.

### Steps

1. **Install Dependencies**
   Navigate to the frontend directory and install the necessary npm packages.
   // turbo
   ```bash
   cd frontend && npm install
   ```

2. **Build the Frontend**
   Compile the React application. The output will be placed in `frontend/dist`.
   // turbo
   ```bash
   cd frontend && npm run build
   ```
