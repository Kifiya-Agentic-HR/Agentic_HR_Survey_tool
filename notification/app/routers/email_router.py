# app/routers/notifications.py
from fastapi import APIRouter, status, HTTPException, BackgroundTasks
from app.schemas import NotificationUnion
from app.services.email_service import send_email_notification
from app.services.template_renderer import render_notification
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

@router.post("/notify/email", status_code=status.HTTP_200_OK)
def notify_email(
    notification: NotificationUnion, 
    background_tasks: BackgroundTasks
):
    """
    Endpoint to accept a NotificationUnion JSON, 
    render a template, and send an email.
    
    Example JSON for an InterviewScheduledNotification:
    {
      "type": "interview_scheduled",
      "interview_link": "https://zoom.us/some-meeting",
      "to": "alice@example.com",
      "name": "Alice",
      "title": "Software Engineer"
    }
    """

    logger.info(f"Received notification: {notification}")

    try:
        logger.info(f"Rendering notification")
        # Render the email body (HTML) based on the notification
        html_body = render_notification(notification)
        logger.info(f"Rendered HTML: {html_body}")

        # You can also define your logic for 'to' and 'subject'.
        # For example, notification.user_email might be the "to"
        # subject could be something dynamic for each type, or hard-coded.

        # For demonstration, let's say:
        to_email = notification.to 
        subject = notification.subject

        if html_body:
            logger.info(f"Sending email notification to {to_email}")
            # Send the email in the background
            background_tasks.add_task(
                send_email_notification,
                to=to_email,
                subject=subject,# if you also want a plain text version
                html=html_body
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to render notification."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

    return {"message": "Email notification sent successfully."}