FROM python:3.10-slim

# Set a working directory
WORKDIR /notification

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Copy app code
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# ENV variables (optional to set defaults here or rely on .env)
ENV PYTHONUNBUFFERED=1

# In production, run via a proper server like gunicorn + uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]