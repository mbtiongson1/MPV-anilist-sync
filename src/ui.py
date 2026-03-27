import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
import threading
from src.main import TrackerAgent

class TrackerUI:
    status_var: tk.StringVar
    log_text: tk.Text

    def __init__(self, agent: TrackerAgent):
        self.agent = agent
        
        self.root = tk.Tk()
        self.root.title("Anime Tracker")
        self.root.geometry("400x500")
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        self.setup_ui()
        if self.agent.anilist.is_authenticated():
            self.log("App is running with existing AniList token. Tracking is active.")
        self.update_log()

    def setup_ui(self):
        ttk.Label(self.root, text="Anime Tracker", font=("Helvetica", 16, "bold")).pack(pady=10)
        
        self.status_var = tk.StringVar()
        self.status_var.set("Status: Waiting for media player...")
        ttk.Label(self.root, textvariable=self.status_var).pack(pady=5)
        
        ttk.Label(self.root, text="Recent Syncs:", font=("Helvetica", 12)).pack(anchor="w", padx=20, pady=(10, 0))
        
        self.log_text = tk.Text(self.root, height=15, width=45, state=tk.DISABLED)
        self.log_text.pack(pady=5, padx=20)
        
        btn_frame = ttk.Frame(self.root)
        btn_frame.pack(pady=10)
        
        ttk.Button(btn_frame, text="Authenticate", command=self.authenticate_anilist).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="View Anilist", command=self.open_anilist).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Hide to Tray", command=self.hide_window).pack(side=tk.LEFT, padx=5)

    def log(self, message: str):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)

    def update_log(self):
        # We could hook into the agent's prints by redirecting stdout, 
        # or have the agent emit events. For simplicity in this script, 
        # we'll just check if the agent has a new synced item.
        if hasattr(self.agent, 'last_synced_filename') and self.agent.last_synced_filename:
            # Quick hack to show the recently synced item
            # In a better architecture, agent would use a callback list
            pass
            
        # Update status
        active = getattr(self.agent, 'active_watcher', None)
        if active and active.is_connected:
            file = active.get_current_filename()
            if file:
                prog = active.get_percent_pos()
                watcher_name = active.__class__.__name__.replace("Watcher", "")
                self.status_var.set(f"[{watcher_name}] Playing: {file[:20]}... ({int(prog)}%)")
            else:
                self.status_var.set("Status: Connected, idle")
        else:
            self.status_var.set("Status: Waiting for media player...")
            
        self.root.after(1000, self.update_log)

    def authenticate_anilist(self):
        def auth_thread():
            self.log("Starting AniList authentication...")
            success = self.agent.anilist.authenticate()
            if success:
                self.log("Successfully authenticated with AniList!")
                self.root.after(0, self.status_var.set, "Status: Authenticated with AniList!")
                self.root.after(0, lambda: messagebox.showinfo("Authentication Successful", "The app is now running with AniList tracking enabled.\n\nThe background launch script will ensure the app stays running automatically."))  # type: ignore
            else:
                self.log("Authentication failed. (Check config.json for client_id)")
                
        threading.Thread(target=auth_thread, daemon=True).start()

    def open_anilist(self):
        import webbrowser
        username = "marcotiongson" # Ideally fetch from API
        if self.agent.anilist.user_id:
             webbrowser.open(f"https://anilist.co/user/{self.agent.anilist.user_id}/animelist")
        else:
             webbrowser.open("https://anilist.co/home")

    def hide_window(self):
        self.root.withdraw()

    def show_window(self, icon=None, item=None):
        self.root.deiconify()
        self.root.lift()

    def on_closing(self):
        self.hide_window()
        # If user explicitly wants to quit:
        # self.agent.stop()
        # self.root.destroy()
        
    def quit_app(self, icon=None, item=None):
        if icon:
            icon.stop()
        self.agent.stop()
        self.root.quit()

    def run(self):
        self.root.mainloop()
