---
name: Version Update
description: Manages updating and synchronizing the project version across multiple source files.
---

# 🚀 Version Update Skill

This skill allows the agent to update the version number across the project consistently. It ensures both the `VERSION` file and the `README.md` file are updated in sync.

## 🛠️ When to Use

- When the user asks to "bump the version", "update the version", or "set version to X.Y.Z".
- Before packaging or releasing a new build.

## 📋 Required Files

- `VERSION`: The single source of truth for the version string.
- `README.md`: The main documentation where the version appears in the title (e.g. `(v0.1.0)`).

## ⚙️ How to Use

1. **Identify the type of update.**
   - Use `major` for breaking changes or big updates (e.g. `1.0.0` -> `2.0.0`).
   - Use `minor` for new features or standard updates (e.g. `1.0.0` -> `1.1.0`). **(Default)**
   - Use `patch` for small bug fixes (e.g. `1.0.0` -> `1.0.1`).

2. **Run the update script** or request the update:
   - To perform a **minor** bump (default):
     ```bash
     python3 .agent/skills/version_update/scripts/update_version.py
     ```
   - To perform a **major** bump:
     ```bash
     python3 .agent/skills/version_update/scripts/update_version.py major
     ```
   - To set a **specific version** (e.g. `0.2.5`):
     ```bash
     python3 .agent/skills/version_update/scripts/update_version.py 0.2.5
     ```

3. **Verify** both `VERSION` and `README.md` were updated correctly.

## ⚠️ Important Considerations

- Ensure the version format follows Semantic Versioning (SemVer) standard (`MAJOR.MINOR.PATCH`).
- Check if other files (like `package.py` or `config.json`) need version updates but currently use `VERSION` as truth.
