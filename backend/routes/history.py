"""
History Routes — GET/DELETE endpoints for analysis history.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.main import get_current_user, get_supabase

router = APIRouter()


@router.get("/history")
async def get_history(
    type: Optional[str] = Query(None, description="Filter by content type"),
    verdict: Optional[str] = Query(None, description="Filter by verdict"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user),
):
    """
    Get user's analysis history, newest first.
    Supports filtering by content_type and final_verdict.
    """
    try:
        supabase = get_supabase()
        query = (
            supabase.table("analyses")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", desc=True)
        )

        if type and type in ("image", "text", "video"):
            query = query.eq("content_type", type)

        if verdict and verdict in ("ai_generated", "real"):
            query = query.eq("final_verdict", verdict)

        query = query.range(offset, offset + limit - 1)
        result = query.execute()

        return {
            "items": result.data or [],
            "total": len(result.data or []),
            "limit": limit,
            "offset": offset,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.get("/history/{request_id}")
async def get_history_item(
    request_id: str,
    user=Depends(get_current_user),
):
    """Get a single analysis result by request_id."""
    try:
        supabase = get_supabase()
        result = (
            supabase.table("analyses")
            .select("*")
            .eq("request_id", request_id)
            .eq("user_id", user.id)
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Analysis not found")

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")


@router.delete("/history/{id}")
async def delete_history_item(
    id: str,
    user=Depends(get_current_user),
):
    """Delete a single analysis record."""
    try:
        supabase = get_supabase()
        result = (
            supabase.table("analyses")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
            .execute()
        )

        return {"success": True, "deleted_id": id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")
