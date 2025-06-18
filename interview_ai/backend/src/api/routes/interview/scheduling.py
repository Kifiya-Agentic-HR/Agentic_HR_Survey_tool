from fastapi import APIRouter, Depends, Request, Response, status
from bson import ObjectId
from bson.errors import InvalidId
from src.api.models.enums import EmailType
from typing import Dict
from datetime import datetime
import logging
from zoneinfo import ZoneInfo

from src.api.models.schemas import ScheduleRequest, ScheduleResponse, SessionData
from src.api.db.dependencies import get_mongo_db, get_redis_client
from src.api.core.config import get_settings
from src.api.services.email import send_email_notification

router = APIRouter(prefix="/schedule", tags=["Exit Interview Scheduling"])
logger = logging.getLogger(__name__)
settings = get_settings()

@router.post("", response_model=ScheduleResponse)
async def schedule_exit_interview(
    request: Request,
    response: Response,
    schedule_request: ScheduleRequest,
    mongo_db=Depends(get_mongo_db),
    redis_client=Depends(get_redis_client),
) -> Dict:
    try:
        logger.info(f"Received interview scheduling request with exit_request_id: {schedule_request.exit_request_id}")

        try:
            exit_request = await mongo_db.exit_requests.find_one({"_id": ObjectId(schedule_request.exit_request_id)})
            logger.info(f"Exit request fetched: {exit_request}")
        except InvalidId:
            logger.error("Invalid exit_request_id format")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Invalid exit request ID format", "interview_id": None}

        if not exit_request:
            logger.warning("No exit request found with the given ID")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Invalid exit request ID", "interview_id": None}

        employee_id = exit_request.get("employee_id")
        if not employee_id:
            logger.error("Exit request is missing employee reference")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Missing employee reference", "interview_id": None}

        employee = await mongo_db.employees.find_one({"_id": ObjectId(employee_id)})
        if not employee:
            logger.warning(f"No employee found for employee_id: {employee_id}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "error": "Employee not found", "interview_id": None}

        logger.info(f"Creating interview record for employee {employee.get('full_name')} ({employee_id})")

        interview_data = {
            "exit_request_id": str(schedule_request.exit_request_id),
            "employee_id": str(employee_id),
            "interview_date": datetime.now(ZoneInfo("Etc/GMT-3")),
            "exit_status": "scheduled",
            "feedback_summary": {},
            "conversation_history": [],
            "recommendation": "",
            "exit_reasoning": "",
            "rating": 0
        }

        interview_result = await mongo_db.exit_interviews.insert_one(interview_data)
        interview_id = str(interview_result.inserted_id)
        logger.info(f"Interview document created with ID: {interview_id}")

        try:
            interview_link = f"{settings.FRONTEND_BASE_URL}/{interview_id}"
            logger.info(f"Generated interview link: {interview_link}")

            send_email_notification(
                to=employee["email"],
                type=EmailType.interview_scheduled,
                subject="Exit Interview Scheduled",
                interview_link=interview_link,
                name=employee.get("full_name", "Employee"),
                title="Your Exit Interview"
            )
            logger.info(f"Email notification sent to {employee['email']}")
        except Exception as e:
            logger.error(f"Exit Interview Email failed: {str(e)}")

        return {"success": True, "interview_id": interview_id, "error": None}

    except Exception as e:
        logger.exception(f"Exit Interview Scheduling Error: {str(e)}")
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"success": False, "interview_id": None, "error": str(e)}
