---
name: main
description: Runs the main application script (src/main.py) after ensuring a proper Python environment is set up. Automatically configures a `uv` or `venv` environment based on requirements.txt if needed. Use this when the user says '/main' or asks to 'run the main script'.
---

# Main Runner Skill

This skill automates the setup and execution of the `src/main.py` script.

## Workflow

1. **Environment Check**: The skill checks for an existing Python environment (`.venv` or `venv`).
2. **Setup**: If no environment is found, it attempts to use `uv` (preferred) or `venv` to create one and install dependencies from `requirements.txt`.
3. **Execution**: It runs `src/main.py` using the activated environment.
4. **Monitoring**: It monitors the output for errors and proactively suggests improvements.

## Usage

When the user triggers this skill (e.g., via `/main`), you should:

1. Identify the project root and locate `requirements.txt` and `src/main.py`.
2. Execute the provided setup and run script: `.agent/skills/main-runner/scripts/setup_and_run.sh`.
3. If errors occur during execution, analyze the logs and suggest specific fixes or improvements to the code.
4. If the environment setup fails, check `README.md` for any manual setup steps and report them to the user.

## Implementation Details

- **Script Location**: `.agent/skills/main-runner/scripts/setup_and_run.sh`
- **Primary Command**: `python3 src/main.py`
- **Auto-Config**: Uses `uv` if available for faster environment creation.
