# db/dependencies.py
from fastapi import Request, Depends
from motor.motor_asyncio import AsyncIOMotorClient
import redis
from src.api.core.config import get_settings

def setup_dependencies(app):
    settings = get_settings()
    
    # MongoDB setup
    mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    app.state.mongo_client = mongo_client
    app.state.mongo_db = mongo_client[settings.MONGO_DB]
    
    # Redis setup
    app.state.redis_client = redis.Redis.from_url(settings.REDIS_URI, db=0)

def get_mongo_db(request: Request):
    return request.app.state.mongo_db

def get_redis_client(request: Request):
    return request.app.state.redis_client