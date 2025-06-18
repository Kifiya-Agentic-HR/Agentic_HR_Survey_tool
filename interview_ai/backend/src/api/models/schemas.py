from .enums import ChatState
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional

class SessionData(BaseModel):
    interview_id: str
    employee_id: str
    user_info: str  # Usually reason for exit or notes from exit request
    user_email: EmailStr
    name: str
    job_title: str
    role_info: str = "Exit Interview"
    conversation_history: List[str] = Field(default_factory=list)
    user_answer: Optional[str] = ""

class SessionRequest(BaseModel):
    interview_id: str  # exit interview ID

class ChatRequest(BaseModel):
    session_id: str
    user_answer: Optional[str] = ""

class ChatResponse(BaseModel):
    state: ChatState | None
    text: str
    success: bool
    error: str | None = None

class ScheduleRequest(BaseModel):
    exit_request_id: str  # still needed if you're mapping from a leave request or HR application

class ScheduleResponse(BaseModel):
    success: bool
    interview_id: Optional[str]
    error: Optional[str]

class SessionResponse(BaseModel):
    interview_id: str
    employee_id: str
    session_id: Optional[str] = None
    chat_history: Optional[List[str]] = []
    success: bool
    error: Optional[str]
    

class ExitFlagRequest(BaseModel):
    interview_id: str
    remarks: str

class ExitFlagResponse(BaseModel):
    success: bool
    error: Optional[str]

class ExitScheduleRequest(BaseModel):
    employee_id: str
    name: str
    job_title: str
    department: str
    user_email: EmailStr
    last_working_day: str  # or use datetime if you're validating the format
    exit_reason: Optional[str] = None

