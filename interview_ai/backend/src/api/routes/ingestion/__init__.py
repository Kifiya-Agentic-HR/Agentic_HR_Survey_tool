from fastapi import APIRouter, Depends, Response
from bson import ObjectId
from .ingestion import router as ingestion_router
from .retrieval import router as retrieval_router
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["interview"])
router.include_router(ingestion_router)
router.include_router(retrieval_router)
