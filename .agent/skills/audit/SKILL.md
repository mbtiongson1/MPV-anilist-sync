---
name: Audit
description: Systematic review of architecture, security, performance, and maintainability.
---

# 🛡️ Audit Skill

This skill provides a structured methodology for auditing the codebase for architectural flaws, security vulnerabilities, performance bottlenecks, and maintainability issues.

## 🛠️ When to Use

- When the user asks for a codebase review or "areas of improvement".
- After major feature implementations to ensure quality.
- Periodically to prevent technical debt.

## 📋 Audit Checklist

### 1. 🏗️ Architecture
- **Modularity**: Are files too large? (e.g., `web_server.py` > 2000 lines).
- **Separation of Concerns**: Is business logic mixed with API/UI code?
- **Data Flow**: Are database connections or API clients instantiated redundanty?
- **State Management**: Is frontend state sync correctly handled with the backend?

### 2. 🔒 Security
- **Token Protection**: Are API keys (AniList, etc.) ever logged or exposed to the frontend?
- **Input Sanitization**: Do API endpoints validate types and ranges of input?
- **Dependency Vulnerabilities**: Are there outdated packages with known CVEs?
- **Local Storage**: Is local cache data stored securely?

### 3. ⚡ Performance
- **API Efficiency**: Are we hitting rate limits? Can we batch AniList requests?
- **Database/Cache**: Are lookups in the local cache efficient (indexing)?
- **Frontend**: Are DOM updates minimized? Are large lists (anime grid) paginated or virtualized?

### 4. 🧹 Maintainability
- **Code Duplication**: Are there shared utilities that should be in `utils.py`?
- **Error Handling**: Are `try/except` blocks specific, or do they catch generic `Exception`?
- **Documentation**: Are complex algorithms or regex patterns documented?

## ⚙️ How to Audit

1.  **Run automated checks** (recommended):
    - Security: `bandit -r src/`
    - Formatting: `flake8 src/`
2.  **Manual walkthrough**: Select a core component (e.g., Sync Logic) and trace it from UI to API.
3.  **Produce Report**: Create an `audit_report.md` artifact with findings and actionable fixes.

## ⚠️ Important Considerations

- **UI impact**: Improvements should avoid changing the visual design unless explicitly requested.
- **Backward compatibility**: Ensure changes don't break existing user data/caches.
