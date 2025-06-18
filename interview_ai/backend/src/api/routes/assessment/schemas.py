from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict
from datetime import datetime

class ExitInterviewCreate(BaseModel):
    user_info: str
    role_info: str
    name: Optional[str] = "Anonymous"

class ExitInterviewResponse(BaseModel):
    interview_id: str
    user_info: str
    role_info: str
    name: str
    status: Literal['scheduled', 'ongoing', 'completed']
    conversation_history: List[Dict] = []
    created_at: float
    completed_at: Optional[float] = None
    final_summary: Optional[Dict] = None

class SessionStartResponse(BaseModel):
    session_id: str
    interview_id: str
    start_time: float

class ExitMessage(BaseModel):
    user_answer: str

class ExitConversationTurn(BaseModel):
    question: str
    answer: str
    question_id: Optional[int] = None  # to track predefined questions

class ExitFinalSummary(BaseModel):
    state: Literal["completed"]
    text: str  # thank-you closing message
    summary: str  # explanation of experience
    recommendation_status: Literal["Would Recommend", "Would Not Recommend", "Neutral"]
    return_status: Literal["Would Return", "Would Not Return", "Unstated"]
    rating: int = Field(..., ge=0, le=100)

class FinalizeInterviewRequest(BaseModel):
    interview_id: str
