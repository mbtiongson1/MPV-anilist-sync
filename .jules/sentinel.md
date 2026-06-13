## 2026-05-20 - SSRF via Parser Differential
**Vulnerability:** The `/api/image` endpoint was vulnerable to Server-Side Request Forgery (SSRF) bypassing domain allowlists.
**Learning:** `urllib.parse.urlparse` and HTTP clients like `requests` differ in parsing URLs with non-standard characters like `\` or `@`. A URL like `http://127.0.0.1\.anilist.co` is interpreted as having the hostname `127.0.0.1\.anilist.co` by `urllib`, passing the `.anilist.co` suffix check. However, `requests` resolves this to `http://127.0.0.1/`, bypassing the intended restriction.
**Prevention:** Always validate extracted hostnames using a strict character allowlist (e.g., `^[a-zA-Z0-9.-]+$`) and reject URLs containing characters known to cause parser confusion (e.g., `\`, `@`, `#` before the path) before passing them to HTTP clients.

## 2026-05-22 - AppleScript Command Injection Escaping Bypass
**Vulnerability:** Command injection via AppleScript due to improper string escaping. Replacing only `"` with `\"` allows bypass using a backslash before the quote (`\"`).
**Learning:** Python's `.replace('"', '\\"')` on `\"` turns into `\\\"`, where `\\` is interpreted by AppleScript as an escaped backslash, leaving the final `"` unescaped and breaking out of the string literal.
**Prevention:** When escaping strings for AppleScript interpolation, always escape backslashes first before escaping quotes: `.replace('\\', '\\\\').replace('"', '\\"')`.

## 2026-05-23 - Fix Arbitrary File Execution in /api/play_file endpoint
**Vulnerability:** Arbitrary file execution vulnerability (RCE) via `os.startfile` and `xdg-open` because the `/api/play_file` endpoint accepted an unfiltered `path` parameter.
**Learning:** External user inputs were passed blindly to OS-level execution tools which would blindly execute non-media formats like `.bat` or `.sh`.
**Prevention:** Implement an allowlist of known safe extensions (e.g., `.mkv`, `.mp4`) when attempting to automatically open files based on user-provided path inputs.

## 2026-05-30 - Unauthenticated Network Access to OS APIs
**Vulnerability:** The web server was bound to `0.0.0.0`, exposing local filesystem and OS APIs (like `/api/open_folder` and `/api/move_to_trash`) to the entire network without authentication.
**Learning:** Local-first applications often omit authentication for convenience, assuming local-only access. Binding such applications to `0.0.0.0` allows anyone on the local network (or wider internet if port forwarded) to execute sensitive actions.
**Prevention:** Always bind unauthenticated, local-first applications strictly to `127.0.0.1` (localhost) rather than `0.0.0.0` to restrict access solely to the local machine.

## 2026-06-01 - SSRF in Nyaa Torrent Downloader
**Vulnerability:** The `download_torrent` method in `src/nyaa.py` accepted an arbitrary URL and passed it to `requests.get()` without validation, allowing a Server-Side Request Forgery (SSRF) attack if the URL input was malicious.
**Learning:** `urllib.parse.urlparse` and `requests` have a parser differential when handling characters like `\` or `@`, potentially bypassing simple string checks. Additionally, any endpoint downloading files from user-supplied URLs must restrict the domains to prevent internal network scanning or local file access.
**Prevention:** Implemented strict URL validation before calling `requests.get()`. This includes checking for `\@` and `\\`, using regex `^[a-zA-Z0-9.-]+$` to validate the parsed hostname, and enforcing a strict allowlist of allowed domains (`nyaa.si`, `sukebei.nyaa.si`).

## 2026-06-02 - Overly Permissive CORS Configuration Allows CSRF
**Vulnerability:** The FastAPI backend used `allow_origins=["*"]` combined with `allow_credentials=True`, which allowed Cross-Site Request Forgery (CSRF). Malicious websites could make authenticated requests to the local server, potentially compromising local data or interacting with OS APIs.
**Learning:** Local applications that run servers must restrict Cross-Origin Resource Sharing (CORS) to the explicit local origins expected to interact with the backend. Using `*` effectively bypasses same-origin policies entirely, putting local-first applications at risk when users visit external malicious sites.
**Prevention:** Explicitly define the allowed frontend origins (e.g., `http://localhost:5173`, `http://127.0.0.1:8080`) when configuring CORS, and avoid using `*` alongside `allow_credentials=True`.


## 2026-06-03 - Path Traversal in Update Downloader
**Vulnerability:** The `/api/download_update` endpoint extracted the update filename directly from the GitHub API release response (`asset.get('name')`) and joined it with the downloads directory path, creating a Path Traversal vulnerability.
**Learning:** Even data originating from trusted external sources (like GitHub API) should be treated as untrusted input when used in local filesystem operations. A compromised or spoofed API response could supply a malicious filename like `../../../etc/passwd` to overwrite arbitrary files on the system during the download process.
**Prevention:** Always apply strict sanitization, such as `os.path.basename(filename)`, before joining externally sourced filenames with local directory paths to ensure the resulting path remains within the intended directory.

## 2025-02-20 - RCE via tampered config file (last_played_file)
**Vulnerability:** The `/api/resume` endpoint executed the path stored in `last_played_file` directly via `os.startfile`, `subprocess.run`, or `xdg-open` without validating the file extension.
**Learning:** Even internal state properties saved from settings (`config.json`) can be tampered with by a malicious local user/script to trick the application into executing an arbitrary file (e.g. `.bat`, `.sh`, `.exe`) next time it attempts to "resume" playback.
**Prevention:** Always validate file extensions against a safe allowlist (e.g., media files: `.mkv`, `.mp4`, `.avi`, `.webm`, `.m4v`) before passing paths to OS execution commands, regardless of whether the path comes directly from the user or from internal state.
