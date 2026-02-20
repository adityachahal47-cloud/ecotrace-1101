"""
Analyze Route — POST /api/analyze

Accepts content (file upload, URL, or text), runs through the full
analysis pipeline, optionally saves to Supabase, and returns the result.
Auth is optional — works without login for testing.
"""

import uuid
import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from pydantic import BaseModel

from backend.services.openrouter import call_models
from backend.services.consensus_engine import calculate_consensus
from backend.services.evidence_generator import generate_evidence
from backend.services.internal_model import analyze_content

router = APIRouter()


class AnalyzeRequest(BaseModel):
    type: str  # "image", "text", "video"
    content: Optional[str] = None  # text content or URL
    source: str = "web"  # "web" or "extension"


def _try_get_user(authorization: Optional[str] = None):
    """Try to authenticate user. Returns user or None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        from backend.main import get_supabase
        token = authorization.replace("Bearer ", "")
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user
    except Exception:
        pass
    return None


@router.post("/analyze")
async def analyze_content_endpoint(
    type: str = Form(...),
    content: Optional[str] = Form(None),
    source: str = Form("web"),
    file: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None),
):
    """
    Full analysis pipeline (auth optional):
    1. Preprocess input (file/URL/text)
    2. Run heuristic analyzers
    3. Calculate consensus
    4. Generate evidence
    5. Run internal analysis
    6. Save to Supabase (if logged in)
    7. Return full result
    """
    # Try to get user (optional)
    user = _try_get_user(authorization)

    # Validate content type
    if type not in ("image", "text", "video"):
        raise HTTPException(status_code=400, detail="Invalid content type. Must be 'image', 'text', or 'video'.")

    # Validate source
    if source not in ("web", "extension"):
        source = "web"

    # Process input
    file_data = None
    analysis_content = content or ""

    if file:
        # Read uploaded file
        file_bytes = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        file_b64 = base64.b64encode(file_bytes).decode("utf-8")
        file_data = f"data:{mime_type};base64,{file_b64}"

        if type == "image":
            analysis_content = file.filename or "uploaded_image"
        elif type == "text":
            # If text file uploaded, use its content
            analysis_content = file_bytes.decode("utf-8", errors="replace")

    if not analysis_content and not file_data:
        raise HTTPException(status_code=400, detail="No content provided. Upload a file, provide a URL, or paste text.")

    # Generate a unique request ID
    request_id = str(uuid.uuid4())

    try:
        # 1. Run heuristic analyzers
        model_outputs = await call_models(analysis_content, type, file_data)

        # 2. Calculate consensus
        consensus = calculate_consensus(model_outputs)

        # 3. Generate evidence
        evidence = generate_evidence(consensus["model_outputs"], type)

        # 4. Run internal analysis
        internal = analyze_content(analysis_content, type, file_data)

        # Combine scores
        behavioral_score = internal.get("behavioral_score", 0.0)
        scam_risk_score = internal.get("scam_risk_score", 0.0)

        # Add internal flags to evidence
        for flag in internal.get("flags", []):
            evidence.append({
                "type": "behavioral",
                "description": f"[internal] {flag}",
                "severity": "medium" if behavioral_score > 0.3 else "low",
            })

        # 5. Build the result
        result = {
            "request_id": request_id,
            "content_type": type,
            "final_verdict": consensus["final_verdict"],
            "ai_likelihood": consensus["ai_likelihood"],
            "agreement_level": consensus["agreement_level"],
            "scam_risk_score": round(scam_risk_score, 4),
            "behavioral_score": round(behavioral_score, 4),
            "model_outputs": [
                {
                    "model": o["model"],
                    "verdict": o["verdict"],
                    "confidence": o["confidence"],
                    "reasons": o["reasons"],
                    "structural_flags": o["structural_flags"],
                    "weight": round(o["weight"], 4),
                    "normalized_score": round(o.get("normalized_score", 0.5), 4),
                }
                for o in consensus["model_outputs"]
            ],
            "evidence": evidence,
            "source": source,
        }

        # 6. Save to Supabase (only if logged in)
        if user:
            try:
                from backend.main import get_supabase
                supabase = get_supabase()
                record = {
                    "user_id": user.id,
                    "request_id": request_id,
                    "content_type": type,
                    "final_verdict": consensus["final_verdict"],
                    "ai_likelihood": consensus["ai_likelihood"],
                    "agreement_level": consensus["agreement_level"],
                    "scam_risk_score": scam_risk_score,
                    "behavioral_score": behavioral_score,
                    "model_outputs": result["model_outputs"],
                    "evidence": evidence,
                    "source": source,
                }
                supabase.table("analyses").insert(record).execute()
            except Exception as e:
                print(f"[WARN] Failed to save to Supabase: {str(e)}")
                result["_save_error"] = str(e)[:200]

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/json")
async def analyze_content_json(
    request: AnalyzeRequest,
    authorization: Optional[str] = Header(None),
):
    """
    JSON body variant of the analyze endpoint (used by the browser extension).
    Auth is optional.
    """
    if request.type not in ("image", "text", "video"):
        raise HTTPException(status_code=400, detail="Invalid content type.")

    if not request.content:
        raise HTTPException(status_code=400, detail="No content provided.")

    user = _try_get_user(authorization)
    request_id = str(uuid.uuid4())
    source = request.source if request.source in ("web", "extension") else "web"

    file_data = None
    if request.type == "image" and request.content and not request.content.startswith("http"):
        file_data = request.content

    try:
        model_outputs = await call_models(request.content, request.type, file_data)
        consensus = calculate_consensus(model_outputs)
        evidence = generate_evidence(consensus["model_outputs"], request.type)
        internal = analyze_content(request.content, request.type, file_data)

        result = {
            "request_id": request_id,
            "content_type": request.type,
            "final_verdict": consensus["final_verdict"],
            "ai_likelihood": consensus["ai_likelihood"],
            "agreement_level": consensus["agreement_level"],
            "scam_risk_score": round(internal.get("scam_risk_score", 0.0), 4),
            "behavioral_score": round(internal.get("behavioral_score", 0.0), 4),
            "model_outputs": [
                {
                    "model": o["model"],
                    "verdict": o["verdict"],
                    "confidence": o["confidence"],
                    "reasons": o["reasons"],
                    "structural_flags": o["structural_flags"],
                    "weight": round(o["weight"], 4),
                    "normalized_score": round(o.get("normalized_score", 0.5), 4),
                }
                for o in consensus["model_outputs"]
            ],
            "evidence": evidence + [
                {
                    "type": "behavioral",
                    "description": f"[internal] {flag}",
                    "severity": "medium",
                }
                for flag in internal.get("flags", [])
            ],
            "source": source,
        }

        if user:
            try:
                from backend.main import get_supabase
                supabase = get_supabase()
                record = {
                    "user_id": user.id,
                    "request_id": request_id,
                    **{k: v for k, v in result.items() if k != "request_id"},
                }
                supabase.table("analyses").insert(record).execute()
            except Exception as e:
                print(f"[WARN] Failed to save to Supabase: {str(e)}")

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
