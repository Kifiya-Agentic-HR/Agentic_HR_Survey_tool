from fastapi import APIRouter, Depends, Request, Response, status
from uuid import uuid4
from bson import ObjectId
from datetime import datetime
import logging
from typing import Dict

from src.api.models.schemas import SessionRequest, SessionResponse, SessionData
from src.api.db.dependencies import get_mongo_db, get_redis_client
from src.api.core.config import get_settings

router = APIRouter(prefix="/session", tags=["Exit Interview Session"])
logger = logging.getLogger(__name__)
settings = get_settings()

@router.post("/", response_model=SessionResponse)
async def manage_exit_session(
    request: Request,
    response: Response,
    session_request: SessionRequest,
    mongo_db=Depends(get_mongo_db),
    redis_client=Depends(get_redis_client)
) -> Dict:
    interview_id = session_request.interview_id

    if not interview_id or not isinstance(interview_id, str):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {
            "success": False,
            "error": "Invalid exit interview ID",
            "interview_id": interview_id,
            "session_id": None,
            "chat_history": []
        }

    try:
        logger.info(f"Looking up Redis key: exit_interview:{interview_id}")
        existing_session_id = redis_client.get(f"exit_interview:{interview_id}")

        if existing_session_id:
            session_key = existing_session_id.decode()
            logger.info(f"Found existing session ID in Redis: {session_key}")
            session_data = redis_client.get(session_key)

            if session_data:
                logger.info(f"Session data retrieved from Redis for session ID: {session_key}")
                try:
                    parsed_data = SessionData.model_validate_json(session_data)
                    logger.info(f"Successfully parsed session data for Exit Interview: {interview_id}")
                    response.status_code = status.HTTP_200_OK
                    return {
                        "success": True,
                        "employee_id": parsed_data.employee_id,
                        "interview_id": interview_id,
                        "session_id": session_key,
                        "chat_history": parsed_data.conversation_history,
                        "error": None
                    }
                except Exception as e:
                    logger.error(f"Session data corrupted for session ID {session_key}: {str(e)}")
                    redis_client.delete(f"exit_interview:{interview_id}")
                    redis_client.delete(session_key)
                    logger.warning(f"Deleted corrupted Redis keys for interview_id: {interview_id}")
            else:
                logger.warning(f"No session data found for session ID: {session_key}")
        else:
            logger.info(f"No existing session ID found for interview_id: {interview_id}")

        # Proceed with new session creation
        try:
            interview_obj_id = ObjectId(interview_id)
        except Exception:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {
                "success": False,
                "error": "Invalid exit interview ID format",
                "interview_id": interview_id,
                "session_id": None,
                "chat_history": []
            }

        # Fetch exit interview record
        exit_interview_data = await mongo_db.exit_interviews.find_one({"_id": interview_obj_id})
        if not exit_interview_data:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {
                "success": False,
                "error": "Exit interview not found. Please schedule the interview first.",
                "interview_id": interview_id,
                "session_id": None,
                "chat_history": []
            }

        # Fetch employee details
        employee = await mongo_db.employees.find_one({"_id": ObjectId(exit_interview_data["employee_id"])})
        if not employee:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {
                "success": False,
                "error": "Employee not found. Please contact HR.",
                "interview_id": interview_id,
                "session_id": None,
                "chat_history": []
            }

        # Optional: fetch reason from exit request
        exit_request = await mongo_db.exit_requests.find_one(
            {"_id": ObjectId(exit_interview_data["exit_request_id"])}
        )
        reason = exit_request.get("reason", "") if exit_request else ""

        # Construct and store session data
        session = SessionData(
            interview_id=interview_id,
            employee_id=str(exit_interview_data["employee_id"]),
            job_id="",
            user_info=reason,
            user_email=employee.get("email", ""),
            name=employee.get("full_name", ""),
            job_title=employee.get("position", "Employee"),
            role_info="Exit Interview",
            skills={},
            conversation_history=exit_interview_data.get("conversation_history", [])
        )

        session_id = str(uuid4())
        redis_client.setex(session_id, 86400, session.model_dump_json())
        redis_client.setex(f"exit_interview:{interview_id}", 86400, session_id)

        logger.info(f"New session created and stored in Redis for interview_id: {interview_id} with session_id: {session_id}")

        return {
            "success": True,
            "employee_id": session.employee_id,
            "interview_id": interview_id,
            "session_id": session_id,
            "chat_history": session.conversation_history,
            "error": None
        }

    except Exception as e:
        logger.error(f"Exit Interview Session error: {str(e)}")
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {
            "success": False,
            "error": str(e),
            "interview_id": interview_id,
            "session_id": None,
            "chat_history": []
        }
