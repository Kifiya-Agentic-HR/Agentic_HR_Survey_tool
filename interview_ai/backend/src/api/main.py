from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes.interview import router as interview_router
from src.api.routes.ingestion import router as ingestion_router
from src.api.db.dependencies import setup_dependencies

def create_app():
    app = FastAPI(title="Interview API", version="1.0.0")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    setup_dependencies(app)
    # set base /api/v1
    app.include_router(interview_router, tags=["agentic", "HR", "Interviewer"], prefix="/api/v1")
    app.include_router(interview_router)
    app.include_router(ingestion_router, tags=["agentic", "RAG"], prefix="/api/v1")
    app.include_router(ingestion_router,  tags=["agentic", "RAG"],)
    
    return app

app = create_app()