import os
import threading
import subprocess
import time
import asyncio

def start_web_server(agent, port: int = 8080):
    try:
        import uvicorn
        from fastapi.staticfiles import StaticFiles
        from src.api import app

        app.state.agent = agent
        
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
        static_dir = os.path.join(os.path.dirname(__file__), 'static')
        serve_dir = frontend_dist if os.path.isdir(frontend_dist) else static_dir

        # Try to kill existing port process if running
        try:
            import sys
            if sys.platform != "win32":
                pids = subprocess.check_output(["lsof", "-ti", f":{port}"], stderr=subprocess.DEVNULL).decode().strip().split('\n')
                for pid in pids:
                    if pid: subprocess.call(["kill", "-9", pid])
            else:
                output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
                for line in output.splitlines():
                    if "LISTENING" in line:
                        pid = line.strip().split()[-1]
                        subprocess.call(["taskkill", "/F", "/PID", pid])
        except Exception:
            pass

        time.sleep(0.5)

        if os.path.exists(serve_dir):
            app.mount("/", StaticFiles(directory=serve_dir, html=True), name="static")

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
