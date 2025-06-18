# README.md

## Interview API

### Endpoints
- `POST /interview/schedule` - Schedule new interview
- `POST /interview/session/{interview_id}` - Start/continue interview session
- `POST /interview/chat` - Process chat messages

### Models (Request and Response)

Check in `models/schemas.py`

### Environment Setup
1. Create `.env` file using `.env.example` template
2. Configure all required services (MongoDB, Redis)
3. Install requirements:
```bash
pip install fastapi uvicorn motor redis requests pydantic-settings
```

# Running

```bash
uvicorn main:app --reload
```

Or  (From root directory)

```bash
docker compose up interview_backend --build
```