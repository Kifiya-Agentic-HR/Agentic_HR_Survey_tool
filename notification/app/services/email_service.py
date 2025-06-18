import smtplib
import ssl
from email.message import EmailMessage
from app.config import settings

def send_email_notification(to: str, subject: str, body: str = "", html: str = ""):
    """
    Basic SMTP-based sending of an email.
    Could be replaced with an API-based provider like SendGrid or Mailgun.
    """

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SENDER_EMAIL
    msg["To"] = to

    # If HTML content is provided, set the content type accordingly
    if html:
        msg.add_alternative(html, subtype="html")
    else:
        msg.set_content(body)

    try:
        print("Creating secure connection...")
        context = ssl.create_default_context()
        print("Connecting to SMTP server...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls(context=context)
            print("Logging in...")
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            print("Sending email...")
            server.send_message(msg)
            print("Email sent.")
        return True
    except Exception as e:
        # Logging, retries, etc. could be handled here
        print(f"Error sending email: {e}")
        return False

if __name__ == "__main__":
    # For local testing
    print("Sending test email...")
    result = send_email_notification(
        to="abdulmunimjemal@gmail.com",
        subject="Hello",
        body="Hello World!"
    )
    print("Email sent successfully." if result else "Failed to send email.")