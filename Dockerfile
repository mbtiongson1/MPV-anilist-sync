# Use an official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies if any are needed
# python-mpv-jsonipc only needs the socket, but some environments might need basic tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install only the necessary dependencies for the CLI/Web version
# We avoid pystray and Pillow as they require X11/GUI libs
RUN pip install --no-cache-dir requests guessit python-mpv-jsonipc

# Copy the rest of the application code
COPY src/ ./src/

# Expose the web UI port
EXPOSE 8080

# Run the application
# We use the src directory as the search path for imports
ENV PYTHONPATH=/app
CMD ["python", "src/main.py"]
