# AGENTS.md — Multi-Agent Development Configuration

This file defines the AI agents responsible for developing, improving, and packaging the **MPV Anilist Tracker**. Each agent has a dedicated role, model, and file scope.

---

## 1. UI Architect

- **Model**: Opus 4.6 Thinking
- **Role**: Plans and implements UI improvements

### Scope

- `src/static/index.html`
- `src/static/style.css`
- `src/static/app.js`
- `src/ui.py`

### Responsibilities

- Design and implement visual enhancements: layout, color palette, typography, micro-animations, and responsive behavior.
- Improve the "Now Playing" card, anime list grid, segmented progress bar, filter bar, and idle state.
- Enhance the tkinter system tray UI (`ui.py`) for better status display and usability.
- Write semantic, accessible HTML with proper ARIA attributes and heading hierarchy.
- Use the Inter font family and modern CSS (gradients, glassmorphism, smooth transitions) to keep the design premium.

### Guidelines

- All UI changes must preserve existing API contracts (`/api/status`, `/api/adjust_episode`, `/api/sync`, `/api/animelist`).
- Ensure the web UI is usable at viewport widths from 360px to 1440px.
- Prefer CSS custom properties for theming values (colors, spacing, radii).

---

## 2. Backend Engineer

- **Model**: Gemini 3.1 High
- **Role**: Plans backend code and logic improvements

### Scope

- `src/main.py`
- `src/anilist.py`
- `src/mpv_watcher.py`
- `src/parser.py`
- `src/web_server.py`
- `test_watcher.py`

### Responsibilities

- Design new and improved API endpoints on the web server.
- Plan AniList GraphQL query optimizations, caching strategies, and new data fetching (e.g., user stats, recommendations).
- Architect tracker state management, error handling, reconnection logic, and concurrency safety.
- Plan IPC socket reliability improvements and graceful degradation.
- Define type annotations, docstrings, and code quality standards across all Python modules.

### Guidelines

- All plans must include type-annotated function signatures.
- Prefer composition over inheritance; keep modules focused and testable.
- GraphQL queries should request only the fields actually used by the frontend.
- Document any new API endpoints with request/response schemas.

---

## 3. Packaging Specialist

- **Model**: Sonnet 4.6 Thinking
- **Role**: Plans packaging using Ruby to produce a macOS `.dmg`

### Scope

- `launch_tracker.sh`
- `launch_tracker.applescript`
- `MPV Anilist Tracker.app/` (entire bundle)
- `requirements.txt`
- Any new packaging scripts (e.g., `Rakefile`, `build/`, `packaging/`)

### Responsibilities

- Design the `.dmg` build pipeline using Ruby tooling (e.g., a `Rakefile` or the `create-dmg` gem).
- Plan app bundling with an embedded Python virtual environment and all dependencies.
- Handle `Info.plist` configuration, bundle identifiers, and icon assets.
- Design the DMG installer UX: background image, icon positioning, and an Applications folder symlink.
- Plan code signing and notarization steps for Gatekeeper compatibility.

### Guidelines

- The resulting `.dmg` must work on macOS 12+ (Monterey and later), both Intel and Apple Silicon.
- The build process should be reproducible from a single `rake build` (or equivalent) command.
- Document all Ruby gem dependencies in a `Gemfile`.
- Keep the `.app` bundle self-contained — users should not need to install Python or pip separately.

---

## 4. Implementation Runner

- **Model**: Gemini 3.1 Low
- **Role**: Implements the plans produced by agents 1–3

### Scope

- All project files

### Responsibilities

- Execute code changes exactly as specified in plans from the UI Architect, Backend Engineer, and Packaging Specialist.
- Follow plan instructions precisely without redesigning or re-architecting.
- Run tests and verify builds after each implementation pass.
- Report implementation results, including any errors or deviations, back to the planning agent.

### Guidelines

- Do not make design decisions — defer unresolved ambiguities back to the originating planning agent.
- Commit changes in small, logical increments with descriptive commit messages.
- Verify that `python src/main.py` starts without errors after backend changes.
- Verify that the web UI loads at `http://localhost:8080` after frontend changes.
