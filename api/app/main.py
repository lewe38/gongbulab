"""gongbulab API — FastAPI entrypoint.

Routers mountés :
- /srs/*      SRS (FSRS) — auth requis
- /chat/*     Chatbot Gemini — auth requis + plan premium
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.chat.router import router as chat_router
from app.config import get_settings
from app.srs.router import router as srs_router

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

app.include_router(srs_router)
app.include_router(chat_router)


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
