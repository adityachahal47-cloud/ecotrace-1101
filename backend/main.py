"""
EcoTrace v3.0 — FastAPI Backend
Multi-model AI content verification API
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

# Load env files: backend/.env first, then project root .env.local as fallback
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env")
load_dotenv(_backend_dir.parent / ".env.local")

# Supabase client
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")


def get_supabase() -> Client:
    """Get Supabase admin client (service key for backend operations)."""
    key = SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
    if not SUPABASE_URL or not key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        return create_client(SUPABASE_URL, key)
    except Exception:
        raise HTTPException(status_code=500, detail="Supabase not configured (invalid URL)")


async def get_current_user(authorization: str = Header(...)):
    """Validate JWT and return user_id."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[EcoTrace] Backend starting...")
    yield
    print("[EcoTrace] Backend shutting down...")


app = FastAPI(
    title="EcoTrace API",
    description="Multi-model AI content verification",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ecotrace.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from backend.routes.analyze import router as analyze_router
from backend.routes.history import router as history_router

app.include_router(analyze_router, prefix="/api")
app.include_router(history_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EcoTrace API",
        "version": "3.0.0",
    }
