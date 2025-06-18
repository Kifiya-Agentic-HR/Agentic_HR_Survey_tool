from pydantic import BaseModel, EmailStr
from typing import Optional, Union
from enum import Enum

class NotificationType(str, Enum):
    interview_scheduled = "interview_scheduled"
    interview_completed = "interview_completed"
    text = "text"
    application_received = "application_received"
    application_passed = "application_passed"
    interview_flagged = "interview_flagged"
    application_rejected = "application_rejected"
    otp_verification = "otp_verification"
    application_invite = "application_invite"

from typing import Literal
from pydantic import BaseModel, EmailStr

class BaseNotification(BaseModel):
    type: NotificationType
    subject: str
    to: EmailStr

class InterviewScheduledNotification(BaseNotification):
    type: Literal[NotificationType.interview_scheduled]
    interview_link: str
    name: str
    title: str  # Job title

class InterviewCompletedNotification(BaseNotification):
    type: Literal[NotificationType.interview_completed]
    name: str
    title: str  # Job title

class InterviewFlaggedNotification(BaseNotification):
    type: Literal[NotificationType.interview_flagged]

class TextNotification(BaseNotification):
    type: Literal[NotificationType.text]
    message: str

class ApplicationReceivedNotification(BaseNotification):
    type: Literal[NotificationType.application_received]
    name: str
    title: str  # Job title

class ApplicationPassedNotification(BaseNotification):
    type: Literal[NotificationType.application_passed]
    name: str
    title: str  # Job title

class OtpVerificationNotification(BaseNotification):
    type: Literal[NotificationType.otp_verification]
    otp: str
    expires_in_minutes: int = 15

class ApplicationRejectedNotification(BaseNotification):
    type: Literal[NotificationType.application_rejected]
    name: str
    title: str  # Job title
    suggestion: Optional[str] = ""
    rejection_reason: Optional[str] = ". After careful consideration, we have decided to move forward with other candidates who more closely match our current needs. We appreciate your interest and encourage you to apply for future opportunities that align with your skills and experience."

class ApplicationInviteNotification(BaseNotification):
    type: Literal[NotificationType.application_invite]
    name: str
    title: str  # Job title
    apply_link: str

NotificationUnion = Union[
    InterviewScheduledNotification,
    InterviewCompletedNotification,
    TextNotification,
    ApplicationReceivedNotification,
    InterviewFlaggedNotification,
    ApplicationPassedNotification,
    ApplicationRejectedNotification, 
    OtpVerificationNotification,
    ApplicationInviteNotification
]