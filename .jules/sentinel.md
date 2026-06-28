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

## 2025-02-24 - Fix Arbitrary Code Execution (RCE) in OS execution via tampered settings
**Vulnerability:** The `/api/resume` endpoint executed files directly from internal state (`agent.settings.last_played_file`) without validating the file extension. This allowed arbitrary code execution (RCE) if an attacker or malicious script modified the `config.json` to point to an executable.
**Learning:** Internal state (like configuration files or database entries) must be treated as untrusted input when it crosses security boundaries, especially before passing paths to OS execution functions like `os.startfile`, `subprocess.run`, or `xdg-open`.
**Prevention:** Always validate the file extension against a safe allowlist (e.g., media files) even if the path originates from internal application state or settings, as these can be tampered with.

## 2025-02-14 - XSS in Preact Modals via dangerouslySetInnerHTML
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability found in frontend/src/components/modals/AnimeDetails.jsx and Upcoming.jsx where untrusted descriptions from an API were passed directly to `dangerouslySetInnerHTML`.
**Learning:** In Preact/React applications, any dynamically fetched HTML content must be treated as untrusted and sanitized before rendering to the DOM.
**Prevention:** Always sanitize external or untrusted HTML content using `DOMPurify.sanitize()` before passing it to `dangerouslySetInnerHTML` to prevent XSS vulnerabilities.

## 2024-06-28 - Path Traversal in File Deletion
**Vulnerability:** The `/api/move_to_trash` endpoint allowed arbitrary file deletion because it didn't validate if the target paths provided by the user were inside intended application directories.
**Learning:** Functions that interact with the filesystem (like `send2trash` or `os.remove`) using user-provided input must strictly enforce directory boundaries to prevent path traversal (`../`) and symlink bypass attacks.
**Prevention:** Construct a list of allowed base directories, use `os.path.realpath` to resolve symlinks and relative parts of both the allowed directories and target paths, and then verify that `os.path.commonpath([real_allowed_dir, real_target_path]) == real_allowed_dir`.
