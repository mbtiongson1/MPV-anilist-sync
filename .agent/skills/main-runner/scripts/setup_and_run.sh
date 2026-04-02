#!/bin/bash

# Check if uv is installed
if command -v uv &> /dev/null; then
    echo "✅ uv found, using it for environment setup."
    if [ ! -d ".venv" ]; then
        echo "🔧 Creating virtual environment with uv..."
        uv venv
    fi
    source .venv/bin/activate
    echo "📦 Installing dependencies with uv..."
    uv pip install -r requirements.txt
else
    echo "⚠️ uv not found, falling back to venv..."
    if [ ! -d "venv" ]; then
        echo "🔧 Creating virtual environment with venv..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    echo "📦 Installing dependencies with pip..."
    pip install -r requirements.txt
fi

# Run the main script
echo "🚀 Running src/main.py..."
python3 src/main.py
