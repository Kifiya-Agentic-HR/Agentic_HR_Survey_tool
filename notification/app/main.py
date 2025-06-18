import uvicorn
from fastapi import FastAPI
from app.config import settings
from app.routers import email_router

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/health", status_code=200)
def health_check():
    return {"status": "ok"}

app.include_router(email_router.router, prefix="/api/v1")

if __name__ == "main":
    # For local development. For production, consider using gunicorn + uvicorn workers.
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)