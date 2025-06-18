from enum import Enum

class ChatState(str, Enum):
    welcome = "welcome"
    ongoing = "ongoing"
    completed = "completed"

class EmailType(str, Enum):
    interview_scheduled = "interview_scheduled"
    interview_completed = "interview_completed"
    # interview_flagged = "interview_flagged"