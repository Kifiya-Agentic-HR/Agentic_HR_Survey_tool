from fastapi import APIRouter, Depends, Response
from bson import ObjectId
from .scheduling import router as scheduling_router
from .sessions import router as sessions_router
from .chat import router as chat_router
from src.api.db.dependencies import get_mongo_db, get_redis_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assessment", tags=["interview"])
router.include_router(scheduling_router)
router.include_router(sessions_router)
router.include_router(chat_router)

# add  a get request
@router.get("/{assessment_id}")
async def get_interview(assessment_id: str,
                        response: Response,
                        mongo_db=Depends(get_mongo_db),
                            ):
    result = await mongo_db.interviews.find_one({"_id": ObjectId(interview_id)})
    status = result.get("interview_status", None)
    if status == "completed":
        return {"success": True, "status": "completed"}
    elif status == "scheduled":
        return {"success": True, "status": "scheduled"}
    elif status == "flagged":
        return {"success": True, "status": "flagged"}
    else:
        return {"success": False, "status": "not found"}
