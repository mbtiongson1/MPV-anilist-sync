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

## 2026-05-27 - Unauthenticated Network Exposure via Uvicorn Binding
**Vulnerability:** The backend FastAPI server in `src/web_server.py` was bound to `0.0.0.0`, exposing all endpoints (including those executing OS commands and filesystem actions) to anyone on the local network.
**Learning:** Local development servers with powerful local system privileges must be explicitly restricted to loopback (`127.0.0.1`) to avoid unauthorized access from adjacent network users.
**Prevention:** Always verify server host bindings (like `uvicorn.Config` host) and strictly use `127.0.0.1` unless external network access is an explicit requirement combined with robust authentication.
