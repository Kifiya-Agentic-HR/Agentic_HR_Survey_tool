import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import bcrypt

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Nigielove_21@localhost:5432/hrsurvey")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    role = Column(String, nullable=False, default='User')

# EventLog model
class EventLog(Base):
    __tablename__ = "event_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    event_type = Column(String, nullable=False)
    event_details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)

# AccessLog model
class AccessLog(Base):
    __tablename__ = "access_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    user_role = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    accessed_at = Column(DateTime, default=datetime.utcnow)
    action = Column(String)

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Password hashing utilities
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))