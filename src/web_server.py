import os
import threading
import time
import asyncio

try:
    from src.runtime_env import resolve_resource_path
except ImportError:
    from runtime_env import resolve_resource_path

def start_web_server(agent, port: int = 8080):
    try:
        import uvicorn
        from fastapi.staticfiles import StaticFiles
        from src.api import app

        app.state.agent = agent

        frontend_dist = resolve_resource_path("frontend", "dist")
        static_dir = resolve_resource_path("src", "static")
        serve_dir = frontend_dist if frontend_dist.is_dir() else static_dir

        if not serve_dir.exists():
            raise FileNotFoundError(f"No UI assets found in {frontend_dist} or {static_dir}")

        # Avoid duplicate mounts when the server is started repeatedly in tests.
        existing_mount = next((route for route in app.routes if getattr(route, "path", None) == "/"), None)
        if existing_mount is None:
            app.mount("/", StaticFiles(directory=str(serve_dir), html=True), name="static")

        print(f"UI Server started via FastAPI/Uvicorn at http://localhost:{port}")

        config = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="warning")
        server = uvicorn.Server(config)

        # Make asyncio run the server
        async def run_server():
            await server.serve()

        asyncio.run(run_server())

    except BaseException as e:
        print(f"Failed to start FastAPI server: {e}")
        # fallback simple http missing here for brevity

def run_server_in_background(agent, port: int = 8080):
    thread = threading.Thread(target=start_web_server, args=(agent, port), daemon=True)
    thread.start()
    return thread
