# 🛡️ Codebase Audit Report

## 📋 Summary
This audit identifies several key areas of improvement, primarily focusing on the decomposition of `web_server.py`, consolidation of configuration/cache management, and improvement of test coverage.

## 🏗️ Architecture Findings

### 1. **Decomposition of `web_server.py`**
- **Issue**: `web_server.py` is a 1400-line "God file". It handles HTTP routing, business logic, file system operations (moving/renaming files), process management (port cleanup), and image caching.
- **Impact**: High technical debt, difficult to test, and prone to side-effect bugs.
- **Recommendation**: Split `web_server.py` into:
  - `web_server.py`: Only handles the HTTP server and routing.
  - `api_handlers.py`: Logic for individual API endpoints.
  - `file_manager.py`: File system operations (moving/renaming/library scanning).
  - `process_utils.py`: Port cleanup and process management logic.

### 2. **Dual Frontends**
- **Issue**: The project maintains both a Tkinter UI (`ui.py`) and a Web UI (`src/static/`).
- **Impact**: Duplicate effort to maintain feature parity.
- **Recommendation**: Standardize on the Web UI and treat the Tkinter/Python side as a headless agent + tray icon.

### 3. **Shared Configuration File**
- **Issue**: Both `SettingsManager` and `AnilistClient` write to `config.json` independently.
- **Impact**: Potential race conditions and data loss during concurrent writes.
- **Recommendation**: Centralize all configuration management into `SettingsManager` and have `AnilistClient` use it.

## 🔒 Security Findings

### 1. **Missing Timeouts**
- **Issue**: `AnilistClient._execute_query` uses `requests.post` without a timeout.
- **Impact**: The application could hang indefinitely if the AniList API is unresponsive.
- **Recommendation**: Add a default timeout (e.g., 10 seconds) to all `requests` calls.

### 2. **Token Persistence**
- **Issue**: The AniList token is stored in `config.json`. While ignored in `.gitignore`, this is a standard JSON file.
- **Impact**: Minimal security risk for a local app, but could be improved.
- **Recommendation**: Consider using system keychain for tokens if higher security is desired.

## ⚡ Performance Findings

### 1. **Manual Cache Management**
- **Issue**: Multiple JSON files (`list_cache.json`, `library_cache.json`, `upcoming_cache.json`) are managed manually across files.
- **Impact**: Inconsistent caching logic and code duplication.
- **Recommendation**: Create a unified `CacheManager` or utilize a local database (e.g., SQLite) for structured metadata.

### 2. **Image Caching**
- **Issue**: Image caching in `web_server.py` is manually implemented with `.meta` files.
- **Impact**: Complex and error-prone.
- **Recommendation**: Use a more robust caching library or simplify the metadata storage.

## 🧹 Maintainability Findings

### 1. **Low Test Coverage**
- **Issue**: Core components like `web_server.py`, `main.py`, and `nyaa.py` have zero automated tests.
- **Impact**: High risk of regressions during refactoring.
- **Recommendation**: Implement integration tests for the API endpoints and unit tests for `nyaa.py`.

### 2. **Error Handling**
- **Issue**: Many `try/except Exception:` blocks exist, catching too broadly.
- **Impact**: Masks specific errors and makes debugging difficult.
- **Recommendation**: Refactor to catch specific exceptions (e.g., `FileNotFoundError`, `requests.RequestException`).

## 🚀 Action Plan

1. **Immediate**: Add timeouts to `AnilistClient` and `NyaaInterface`.
2. **Short-term**: Refactor `SettingsManager` to own the AniList token persistence.
3. **Mid-term**: Decouple file system logic from `web_server.py`.
4. **Long-term**: Consolidate frontends and increase test coverage.
