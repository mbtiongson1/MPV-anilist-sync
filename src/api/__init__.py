from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.router_status import router as router_status
from src.api.router_anilist import router_anilist as router_anilist
from src.api.router_nyaa import router as router_nyaa
from src.api.router_os import router as router_os
from src.api.router_library import router as router_library

app = FastAPI(title="MPV Anilist Tracker API")

# Setup CORS to resolve the duplicate headers issue
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(router_status)
app.include_router(router_anilist)
app.include_router(router_nyaa)
app.include_router(router_os)
app.include_router(router_library)
