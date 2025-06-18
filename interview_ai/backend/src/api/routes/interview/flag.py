from fastapi import APIRouter, Depends, Request, Response, status
from bson import ObjectId
from typing import Dict
import logging
from src.api.models.schemas import ExitFlagRequest, ExitFlagResponse
from src.api.models.enums import EmailType
from src.api.db.dependencies import get_mongo_db, get_redis_client
from src.api.core.config import get_settings
from src.api.services.email import send_email_notification

router = APIRouter(prefix="/flag", tags=["Exit Interview Flags"])
logger = logging.getLogger(__name__)
settings = get_settings()

@router.post("", response_model=ExitFlagResponse)
async def flag_exit_feedback(
    request: Request,
    response: Response,
    chat_request: ExitFlagRequest,
    redis_client=Depends(get_redis_client),
    mongo_db=Depends(get_mongo_db)
) -> Dict:
    exit_id = chat_request.exit_id
    remarks = chat_request.remarks  # Sensitive or concerning feedback

    try:
        if not exit_id:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Missing exit interview ID"}

        # Find exit interview
        interview = await mongo_db.exit_interviews.find_one({"_id": ObjectId(exit_id)})
        if not interview:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Invalid exit interview ID"}

        if interview.get("exit_status", None) == "flagged":
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Feedback already flagged"}

        # Flag it as sensitive
        await mongo_db.exit_interviews.update_one(
            {"_id": ObjectId(exit_id)},
            {"$set": {"exit_status": "flagged", "flagged_feedback": remarks}}
        )

        # Notify HR only
        hr_email = settings.HR_EMAIL
        if hr_email:
            send_email_notification(
                type=EmailType.exit_feedback_flagged,
                to=hr_email,
                subject="⚠️ Sensitive Exit Interview Feedback Flagged",
                body=f"Exit Interview ID: {exit_id}\n\nFlagged Content:\n{remarks}"
            )

        return {"success": True, "error": None}

    except Exception as e:
        logger.error(f"Exit flag error: {str(e)}")
        return {"success": False, "error": str(e)}
