from fastapi import APIRouter, Depends, Request, Response, status
from bson import ObjectId
from typing import Dict
import logging
from src.api.models.schemas import ChatRequest, ChatResponse, SessionData
from src.api.db.dependencies import get_mongo_db, get_redis_client
from src.api.core.config import get_settings
from src.api.services.email import send_email_notification
from src.api.utils import sanitizer
from src.interview_ai import unified_interface

router = APIRouter(prefix="/chat", tags=["Exit Interview Chat"])
logger = logging.getLogger(__name__)
settings = get_settings()

@router.post("", response_model=ChatResponse)
async def process_exit_chat(
    request: Request,
    response: Response,
    chat_request: ChatRequest,
    redis_client=Depends(get_redis_client),
    mongo_db=Depends(get_mongo_db)
) -> ChatResponse:  # <-- also specify ChatResponse here
    try:
        if not chat_request.session_id:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return ChatResponse(  # ✅ EDIT HERE
                success=False,
                error="Missing session ID",
                state=None,
                text=""
            )

        session_json = redis_client.get(chat_request.session_id)
        if not session_json:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return ChatResponse(  # ✅ EDIT HERE
                success=False,
                error="Invalid session ID",
                state=None,
                text=""
            )

        session_data = SessionData.model_validate_json(session_json)
        logger.info(f"EXIT CHAT: Session data found: {session_data}")

        if chat_request.user_answer:
            chat_request.user_answer = sanitizer(chat_request.user_answer)
            session_data.conversation_history.append(f"Employee: {chat_request.user_answer}")

        session_data.user_answer = chat_request.user_answer

        # Kick off AI response
        interviewer_result = unified_interface.kickoff(
            session_data.model_dump(),
            max_conversation_history=settings.MAX_CONVERSATION_HISTORY
        )

        if interviewer_result.get("error"):
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            return ChatResponse(  # ✅ EDIT HERE
                success=False,
                error=interviewer_result["error"],
                state=None,
                text=""
            )

        interviewer_text = interviewer_result.get("text", "")
        state = interviewer_result.get("state", None)
        session_data.conversation_history.append(f"HR: {interviewer_text}")

        if state == "completed":
            try:
                await mongo_db.exit_interviews.update_one(
                    {"_id": ObjectId(session_data.interview_id)},
                    {"$set": {
                        "exit_status": "completed",
                        "feedback_topics": interviewer_result.get("feedback", {}),
                        "conversation_history": session_data.conversation_history,
                        "summary_feedback": interviewer_result.get("summary", ""),
                    }}
                )

                send_email_notification(
                    to=session_data.user_email,
                    type="exit_interview_completed",
                    subject="Exit Interview Completed",
                    name=session_data.name,
                    title=session_data.job_title
                )
            except Exception as e:
                logger.error(f"Exit interview completion error: {str(e)}")

        elif state == "ongoing":
            session_data.feedback_topics = interviewer_result.get("feedback", session_data.skills)

        # Update Redis
        redis_client.setex(
            chat_request.session_id,
            86400,
            session_data.model_dump_json()
        )

        logger.info(f"[Exit Interview] Ongoing feedback topics: {session_data.feedback_topics}")

        return ChatResponse(  # ✅ EDIT HERE
            success=True,
            error=None,
            state=state,
            text=interviewer_text
        )

    except Exception as e:
        logger.error(f"Exit Chat error: {str(e)}")
        return ChatResponse(  # ✅ EDIT HERE
            success=False,
            error=str(e),
            state=None,
            text=""
        )
