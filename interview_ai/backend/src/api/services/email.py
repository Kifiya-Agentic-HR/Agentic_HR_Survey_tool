import requests
from src.api.core.config import get_settings
from typing import Dict, Any
from src.api.models.enums import EmailType
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

settings = get_settings()

BASE_URL = settings.NOTIFICATION_SERVICE_URL.rstrip("/") + "/notify/email"

def send_email_notification(type: EmailType, to: str, subject: str, **kwargs) -> Dict[str, Any]:
    """Send an email notification via the notification service.

    Args:
        type (EmailType): Type of email notification.
        to (str): Recipient email address.
        subject (str): Email subject.
        body (str): Plain text email body.
        html (str): HTML formatted email body.

    Returns:
        Dict[str, Any]: Response containing status and message.
    """
    
    payload = {
        "to": to,
        "subject": subject,
        **kwargs,
    }

    payload['type'] = type.value


    logger.info(f"Sending email notification to {to} with subject: {subject}")
    logger.info(f"Base URL: {BASE_URL}")
    logger.info(f"Payload: {payload}")

    try:
        response = requests.post(BASE_URL, json=payload, timeout=10)
        response.raise_for_status()
        return {"status": "success", "data": response.json()}
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": str(e)}
