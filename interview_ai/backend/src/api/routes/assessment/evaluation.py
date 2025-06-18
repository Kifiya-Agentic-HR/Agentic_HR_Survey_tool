import json
import uuid
import time
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from redis import Redis
from src.api.db.dependencies import get_mongo_db, get_redis_client
from src.interview_ai.engine import UnifiedInterface

router = APIRouter(prefix="/exit", tags=["exit_interview"])

@router.post("/schedule")
async def schedule_exit_interview(
    payload: dict,
    db: Database = Depends(get_mongo_db)
):
    interview_id = str(uuid.uuid4())

    document = {
        "_id": interview_id,
        "user_info": payload["user_info"],
        "role_info": payload["role_info"],
        "name": payload.get("name", "Anonymous"),
        "status": "scheduled",
        "conversation_history": [],
        "created_at": time.time()
    }

    db.exit_interviews.insert_one(document)
    return {"interview_id": interview_id}

@router.post("/session/{interview_id}")
async def start_exit_session(
    interview_id: str,
    db: Database = Depends(get_mongo_db),
    redis: Redis = Depends(get_redis_client)
):
    interview = db.exit_interviews.find_one({"_id": interview_id})
    if not interview or interview["status"] != "scheduled":
        raise HTTPException(400, "Invalid interview ID or already started")

    session_id = str(uuid.uuid4())
    redis.setex(session_id, 3600, json.dumps({
        "interview_id": interview_id,
        "start_time": time.time()
    }))

    db.exit_interviews.update_one(
        {"_id": interview_id},
        {"$set": {"status": "ongoing"}}
    )

    return {"session_id": session_id}

@router.post("/chat/{session_id}")
async def continue_conversation(
    session_id: str,
    message: dict,
    redis: Redis = Depends(get_redis_client),
    db: Database = Depends(get_mongo_db)
):
    session_data = redis.get(session_id)
    if not session_data:
        raise HTTPException(400, "Invalid session")

    session = json.loads(session_data)
    interview_id = session["interview_id"]
    interview = db.exit_interviews.find_one({"_id": interview_id})
    if not interview:
        raise HTTPException(404, "Interview not found")

    input_payload = {
        "conversation_history": interview["conversation_history"],
        "user_info": interview["user_info"],
        "role_info": interview["role_info"],
        "name": interview["name"],
        "user_answer": message["user_answer"]
    }

    result = UnifiedInterface().kickoff(input_payload)

    updated_history = input_payload["conversation_history"]
    if "text" in result:
        updated_history.append({
            "question": result["text"],
            "answer": message["user_answer"]
        })

    db.exit_interviews.update_one(
        {"_id": interview_id},
        {"$set": {"conversation_history": updated_history}}
    )

    return result

@router.post("/complete/{interview_id}")
async def complete_exit_interview(
    interview_id: str,
    db: Database = Depends(get_mongo_db)
):
    interview = db.exit_interviews.find_one({"_id": interview_id})
    if not interview:
        raise HTTPException(404, "Interview not found")

    payload = {
        "conversation_history": interview["conversation_history"],
        "user_info": interview["user_info"],
        "role_info": interview["role_info"]
    }

    result = UnifiedInterface().kickoff(payload)

    db.exit_interviews.update_one(
        {"_id": interview_id},
        {"$set": {
            "status": "completed",
            "final_summary": result,
            "completed_at": time.time()
        }}
    )

    return {"success": True, "summary": result}
