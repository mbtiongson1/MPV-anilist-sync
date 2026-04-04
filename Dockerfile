# Stage 1: Build the frontend (Node.js)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final runtime image (Python)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if required (for python-mpv mostly if it connects over IPC)
# But here we run headless APIs
RUN apt-get update && apt-get install -y --no-install-recommends \
    mpv \
    libmpv-dev \
    && rm -rf /var/lib/apt/lists/*
    
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY src/ ./src/
COPY VERSION ./VERSION

# Copy frontend statically built assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure the main port is exposed
EXPOSE 8080

# Run the API web server seamlessly headless
ENV PORT=8080
ENV HOST=0.0.0.0

CMD ["python", "src/main.py"]
