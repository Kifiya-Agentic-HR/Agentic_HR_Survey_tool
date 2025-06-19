from database import SessionLocal
from sqlalchemy import text
import json
from datetime import datetime

def log_event(user_id, event_type, event_details, ip_address):
    db = SessionLocal()
    db.execute(
        text("INSERT INTO event_logs (user_id, event_type, event_details, ip_address) VALUES (:user_id, :event_type, :event_details, :ip_address)"),
        {
            "user_id": user_id,
            "event_type": event_type,
            "event_details": json.dumps(event_details),
            "ip_address": ip_address
        }
    )
    db.commit()
    db.close()

def log_access(user_id, user_role, ip_address, action):
    db = SessionLocal()
    db.execute(
        text("INSERT INTO access_logs (user_id, user_role, ip_address, action, accessed_at) VALUES (:user_id, :user_role, :ip_address, :action, :accessed_at)"),
        {
            "user_id": user_id,
            "user_role": user_role,
            "ip_address": ip_address,
            "action": action,
            "accessed_at": datetime.utcnow()
        }
    )
    db.commit()
    db.close() 