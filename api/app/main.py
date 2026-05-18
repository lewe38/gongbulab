"""gongbulab API — FastAPI entrypoint.

Endpoints will be mounted as we build modules (auth, lessons, srs, chat).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="gongbulab API",
    version="0.1.0",
    description="Backend pour la plateforme de révision du coréen.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "gongbulab",
        "docs": "/docs",
        "health": "/health",
    }
