import logging
from fastapi.templating import Jinja2Templates
from app.schemas import NotificationUnion

templates = Jinja2Templates(directory="app/templates")
logger = logging.getLogger(__name__)

def render_notification(notification: NotificationUnion) -> str:
    """
    Render a notification into HTML using the appropriate Jinja2 template.

    This function selects a template based on notification.type and renders it with
    the data from the notification model. It wraps the rendered HTML in a consistent 
    container for styling, and in case of an error (such as an unknown notification type
    or rendering failure), it logs the issue and returns a fallback error message.

    Returns:
        str: The rendered HTML.
    """
    # Map notification types to template filenames.
    template_map = {
        "interview_scheduled": "interview_scheduled.html",
        "interview_completed": "interview_completed.html",
        "text": "text.html",
        'application_received': 'application_received.html',
        "interview_flagged": "interview_flagged.html",
        "application_passed": "application_passed.html",
        "application_rejected": "application_rejected.html",
        "otp_verification": "otp_verification.html",
        "application_invite": "application_invite.html",
    }
    
    try:
        # Select the appropriate template, or fallback if type is unknown.
        template_name = template_map.get(notification.type)
        if not template_name:
            logger.warning("Unknown notification type: %s. Using default template.", notification.type)
            template_name = "default_.html"  # Ensure this fallback template exists.

        # Render the template with the notification's data.
        context = notification.model_dump()
        template = templates.get_template(template_name)
        rendered_html = template.render(context)
        
        # Wrap the output in a consistent container.
        return f"<div class='notification'>{rendered_html}</div>"
    except Exception as e:
        logger.exception("Failed to render notification.")
        # Return a consistent fallback error message.
        return None