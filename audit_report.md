# 🛡️ MPV Anilist Tracker - Audit Report

This document outlines the findings of a comprehensive audit of the `MPV Anilist Tracker` codebase, covering Architecture, Security, Performance, and Maintainability.

## 1. 🏗️ Architecture
- **Modularity:** 
  - `web_server.py` is quite large (1,500+ lines). It currently handles HTTP routing, business logic, CORS boilerplate, file system parsing, and more in a single massive handler class. There is a strong need to break this down into specific route modules.
- **Separation of Concerns:** 
  - Business logic is heavily mixed with API response generation in `web_server.py`. Functions for OS interactions (opening folders, trashing files) are hardcoded into the router rather than cleanly separated into an OS utility service.
- **State Management:**
  - `TrackerAgent` correctly orchestrates state between `Anilist`, `Nyaa`, and the local `Settings`, holding the system state seamlessly for UI API endpoints.

## 2. 🔒 Security
- **Bandit Analysis Results:**
  - `High/Medium Severity:` Bandit revealed 6 action items related to `subprocess` invocations. `subprocess.call` and `subprocess.Popen` are used heavily in `web_server.py` across OS commands. Need to ensure all paths supplied to standard execution hooks are correctly wrapped or sanitized.
  - `Low Severity:` Using the default `http.server.SimpleHTTPRequestHandler` is not fundamentally designed to withstand production network setups.
- **Error Swallowing:** 
  - Constant use of `try ... except Exception: pass` found within the server loop. This masks critical security or syntax failures and artificially obscures root causes when diagnosing bugs.

## 3. ⚡ Performance
- **Caching Mechanisms:** 
  - The implementation of `library_cache` and `list_cache` functions well and mitigates continuous remote hitting to the AniList API.
- **Concurrency:** 
  - Fetching search torrents and concurrently watching for saves would greatly benefit if transitioned to an asynchronous web framework such as `FastAPI`. Large operations like `/api/nyaa_batch_search` still utilize threading to bypass server blocking.
- **Frontend Optimization:** 
  - `Preact` handles DOM updates effectively via lightweight footprint sizes.

## 4. 🧹 Maintainability
- **Flake8 Quality Checks:**
  - Found `616` PEP-8 style violations across `src/`.
  - Extremely high frequency of `E501 (Line too long)` - lines continuously exceed the standard 80-character limit, especially iterating payload endpoints.
  - Usage of `E722 (Bare except)` is prevalent. Standardizing exception handles to at least catch explicit exceptions and securely logging them ensures much better longevity.
  - Duplicated manual CORS header declarations in `web_server.py`.

---
**Verdict:**
The application correctly resolves its main problem of offline media tracking to a centralized AniList database, yet suffers mainly from monolithic scripts (`web_server.py`) and older manual concurrency handling. Refactoring server logic to an async layout will greatly clean up the codebase.
