# Notification Service

The **Notification Service** is a FastAPI-based microservice responsible for rendering templated notifications and sending email alerts via SMTP. It provides a REST API to accept notification payloads, generate HTML emails using Jinja2 templates, and dispatch them asynchronously.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [API Endpoints](#api-endpoints)
- [Templates](#templates)
- [Logging & Monitoring](#logging--monitoring)
- [Testing](#testing)
- [Docker](#docker)
- [Contributing](#contributing)
- [License](#license)

## Features

- Receive notification requests via HTTP POST
- Render dynamic HTML content with Jinja2 templates
- Send transactional emails over SMTP in background tasks
- Health check endpoint
- Extensible notification types via Pydantic models

## Technology Stack

- Python 3.10+
- FastAPI
- Uvicorn for ASGI server
- Pydantic for data validation
- Jinja2 for template rendering
- SMTP library (`smtplib`) for email dispatch
- Python-dotenv for environment variable management

## Prerequisites

- Python 3.10 or higher
- Access to an SMTP server (e.g., SendGrid, Mailgun, or corporate SMTP)
- RabbitMQ/Kafka (optional for event-driven integration)

## Repository Structure

```text
services/notification
├── .env                 # Environment variables example
├── Dockerfile           # Docker configuration
├── README.md            # This file
├── requirements.txt     # Python dependencies
├── app
│   ├── config.py        # Configuration with Pydantic and dotenv
│   ├── main.py          # FastAPI application setup
│   ├── routers
│   │   └── email_router.py  # API routes for notifications
│   ├── schemas.py       # Pydantic models for notification payloads
│   ├── services
│   │   ├── email_service.py     # SMTP email logic
│   │   └── template_renderer.py # Jinja2 rendering logic
│   └── templates        # Jinja2 HTML templates
└── tests                # Unit and integration tests
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repo_url>
   cd services/notification
   ```
2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Create an `.env` file in the root directory with the following variables:

```dotenv
HOST=0.0.0.0           # FastAPI host
PORT=8001              # FastAPI port
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=notifications@example.com
``` 

| Variable        | Description                                      |
|-----------------|--------------------------------------------------|
| `HOST`          | Service host (default `0.0.0.0`)                 |
| `PORT`          | Service port (default `8001`)                    |
| `SMTP_HOST`     | SMTP server address                              |
| `SMTP_PORT`     | SMTP server port                                 |
| `SMTP_USERNAME` | SMTP authentication user                         |
| `SMTP_PASSWORD` | SMTP authentication password                     |
| `SMTP_FROM`     | Default sender email address                     |

## Running the Service

Start the FastAPI app with Uvicorn:

```bash
uvicorn app.main:app --reload --host $HOST --port $PORT
``` 

- Access the health check: `GET http://localhost:$PORT/health`
- Swagger UI: `http://localhost:$PORT/docs`

## API Endpoints

### POST /api/v1/notify/email

Send an email notification.

- Request Body: `NotificationUnion` schema (see `app/schemas.py`)

Example payload for an interview scheduled notification:

```json
{
  "type": "interview_scheduled",
  "to": "alice@example.com",
  "name": "Alice",
  "title": "Software Engineer",
  "interview_link": "https://zoom.us/j/123456789"
}
```

- Response:
  - `200 OK` on success
  - JSON `{ "message": "Email notification sent successfully." }`
  - Appropriate HTTP error codes and messages on failure

## Templates

Notification templates are Jinja2 files stored under `app/templates/`. Each notification type has its own template, e.g.,:

```
app/templates/
├── interview_scheduled.html
├── application_received.html
└── password_reset.html
```

To add a new notification type:
1. Define a Pydantic model in `app/schemas.py`.
2. Create a corresponding template file in `app/templates/`.
3. Add rendering logic in `app/services/template_renderer.py`.

## Logging & Monitoring

- Default log level is `INFO`.
- Logs are printed to stdout; use container logs or a centralized logging solution for production.
- Health check endpoint for liveness probes.

## Testing

Run unit tests with pytest:

```bash
pytest -q
```

Tests cover:
- Schema validation
- Template rendering
- Email service success and error paths
- Router integration

## Docker

Build and run the service using Docker:

```bash
docker build -t notification-service .
``` 

Run with environment variables:

```bash
docker run --rm -p 8001:8001 \
  --env-file .env \
  notification-service
```

## Contributing

Contributions are welcome:
1. Fork and clone the repo
2. Create a feature branch: `git checkout -b feature/foo`
3. Commit changes: `git commit -m "Add feature foo"`
4. Push branch: `git push origin feature/foo`
5. Open a pull request

## License

This service is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.