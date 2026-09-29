import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401 — ensure all models are registered before create_all

from app.routers import auth, integrations, products, campaigns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    logger.info("Starting InstaPilot AI backend...")
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Database tables created.")
    yield
    logger.info("Shutting down InstaPilot AI backend.")


app = FastAPI(
    title="InstaPilot AI",
    description="AI-powered Instagram advertising dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────
# Allow the configured frontend URL (and common dev variants)
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving for uploaded images ──────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(integrations.router)
app.include_router(products.router)
app.include_router(campaigns.router)


@app.get("/")
def root():
    return {"message": "InstaPilot AI API is running.", "docs": "/docs"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "meta_configured": bool(settings.META_APP_ID and settings.META_APP_SECRET),
        "ai_configured": bool(settings.OPENAI_API_KEY),
    }
