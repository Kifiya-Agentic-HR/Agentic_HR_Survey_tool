from fastapi import APIRouter, Depends, Response
from bson import ObjectId
from .scheduling import router as scheduling_router
from .sessions import router as sessions_router
from .chat import router as chat_router
from .flag import router as flag_router
from src.api.db.dependencies import get_mongo_db, get_redis_client
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview", tags=["interview"])
router.include_router(scheduling_router)
router.include_router(sessions_router)
router.include_router(chat_router)
router.include_router(flag_router)

@router.get("/{interview_id}")
async def get_interview(interview_id: str,
                        response: Response,
                        mongo_db=Depends(get_mongo_db)):
    logger.info(f"GET /interview/{interview_id} - Incoming request")

    try:
        logger.info("Attempting to convert interview_id to ObjectId")
        interview_obj_id = ObjectId(interview_id)
    except Exception as e:
        logger.error(f"Invalid ObjectId format: {e}")
        response.status_code = 400
        return {"success": False, "status": "invalid id format"}

    logger.info("Querying exit_interviews collection")
    result = await mongo_db.exit_interviews.find_one({"_id": interview_obj_id})

    if not result:
        logger.warning(f"No interview found with ID: {interview_id}")
        response.status_code = 404
        return {"success": False, "status": "not found"}

    logger.info(f"Interview found: {result}")

    interview_date = result.get("interview_date")
    logger.info(f"Interview date (raw): {interview_date}")

    # Get current time in GMT+3 and UTC for later use
    current_time = datetime.now(timezone.utc)
    logger.info(f"Current UTC time: {current_time}")

    status = result.get("exit_status", None)
    logger.info(f"Interview status: {status}")

    # If interview_date is naive (no timezone), set it to UTC
    if interview_date.tzinfo is None:
        logger.info("Interview date is naive. Assigning UTC timezone.")
        interview_date = interview_date.replace(tzinfo=timezone.utc)

    # Handle various interview statuses
    if status == "scheduled":
        expiration_time = interview_date + timedelta(hours=72)
        logger.info(f"Interview expiration time: {expiration_time}")

        if current_time > expiration_time:
            logger.info("Interview has expired")
            return {"success": True, "status": "expired"}
        else:
            logger.info("Interview is still scheduled")
            return {"success": True, "status": "scheduled"}

    if status == "completed":
        logger.info("Interview is marked completed")
        return {"success": True, "status": "completed"}

    elif status == "flagged":
        logger.info("Interview is flagged")
        return {"success": True, "status": "flagged"}

    elif status == "started":
        logger.info("Interview is in progress")
        return {"success": True, "status": "started"}

    else:
        logger.warning("Interview status is unknown")
        return {"success": False, "status": "not found"}
