# tests/test_routes.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import MongoDB, RedisDB
from bson import ObjectId

client = TestClient(app)

@pytest.fixture(autouse=True)
async def setup_and_teardown():
    # Setup: Insert mock schedule
    test_interview = {
        "_id": ObjectId(),
        "user_info": "Test User Info",
        "role_info": "Test Role Info",
        "conversation_history": []
    }
    await MongoDB.db.schedules.insert_one(test_interview)
    yield
    # Teardown: Clean up test DB
    await MongoDB.db.schedules.delete_many({})
    await MongoDB.db.results.delete_many({})
    await RedisDB.redis.flushall()

def test_create_schedule():
    response = client.post("/api/v1/schedule", json={
        "user_info": "John Doe, Engineering Department",
        "role_info": "Backend Engineer"
    })
    assert response.status_code == 200
    data = response.json()
    assert "interview_id" in data
    assert isinstance(data["interview_id"], str)

def test_invalid_session_id():
    response = client.post("/api/v1/chat?session_id=invalid", json={
        "user_answer": "Yes, I felt supported during my time here."
    })
    assert response.status_code == 400
    assert "Invalid session ID format" in response.text
