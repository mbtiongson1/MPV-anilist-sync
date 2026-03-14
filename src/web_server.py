import json
import http.server
import socketserver
import threading
import os
from src.main import TrackerAgent

class TrackerStateHandler(http.server.SimpleHTTPRequestHandler):
    agent: TrackerAgent = None
    
    def __init__(self, *args, **kwargs):
        # Serve files from the static directory by default
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'static'), **kwargs)

    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*') # Allow cross-origin just in case
            self.end_headers()
            
            # Prepare state
            is_running = False
            title = ""
            
            if self.agent and self.agent.watcher.is_connected:
                filename = self.agent.watcher.get_current_filename()
                if filename:
                    from src.parser import AnimeParser
                    parsed = AnimeParser.parse_filename(filename)
                    if parsed and parsed.get('title'):
                        title = parsed['title']
                        episode = parsed.get('episode')
                        if isinstance(episode, list):
                            episode = episode[-1]
                        if episode is not None:
                            title += f" - E{episode}"
                    else:
                        title = filename
                        
                    is_running = True
            
            response = {
                "running": is_running,
                "title": title
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            # Fallback to serving static files
            super().do_GET()

    # Suppress logging to keep the terminal clean
    def log_message(self, format, *args):
        pass

def start_web_server(agent: TrackerAgent, port: int = 8080):
    TrackerStateHandler.agent = agent
    handler = TrackerStateHandler
    
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"UI Server started at http://localhost:{port}")
        httpd.serve_forever()

def run_server_in_background(agent: TrackerAgent, port: int = 8080):
    thread = threading.Thread(target=start_web_server, args=(agent, port), daemon=True)
    thread.start()
    return thread
