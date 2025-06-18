import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_send_email_notification():
    response = client.post(
    "/api/v1/notify/email",
    json={
    "to": "test@example.com",
    "subject": "Test Subject",
    "body": "Test Body"
    },
    )
    assert response.status_code == 200
    assert "message" in response.json()


    # Additional checks or mocking (smtplib) should be added
    # to ensure that email_service.send_email_notification is called properly.