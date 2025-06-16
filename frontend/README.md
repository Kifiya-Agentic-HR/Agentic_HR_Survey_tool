# HR Survey Analysis Platform

A comprehensive full-stack application for survey data analysis with PostgreSQL authentication, built with Next.js and FastAPI.

## Features

- **Authentication System**: Complete user registration, login, and JWT-based authentication
- **Survey Analysis Dashboard**: Advanced analytics for multiple-choice and text responses
- **Exit Interview System**: AI-powered chat platform (coming soon)
- **PostgreSQL Integration**: Secure user management with encrypted passwords
- **Docker Support**: Complete containerization for easy deployment

## Tech Stack

- **Frontend**: Next.js 13, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Authentication**: JWT tokens, bcrypt password hashing
- **Containerization**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd hr-survey-platform
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up PostgreSQL database:
```bash
# Make sure PostgreSQL is running
createdb hrsurvey
```

5. Start the backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses PostgreSQL with the following main table:

### Users Table
- `id`: Primary key (integer)
- `first_name`: User's first name (string)
- `last_name`: User's last name (string)
- `email`: Unique email address (string)
- `hashed_password`: Encrypted password (string)
- `is_active`: Account status (boolean)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Survey Analysis
- `POST /upload` - Upload survey data file
- `GET /dataset-info` - Get dataset information
- `GET /multiple-choice-analysis` - Analyze multiple choice questions
- `GET /text-analysis` - Analyze text responses
- `GET /cross-tabulation/{q1}/{q2}` - Cross-tabulation analysis
- `GET /summary-stats` - Overall summary statistics

## Security Features

- JWT-based authentication with configurable expiration
- bcrypt password hashing with salt
- Protected API endpoints requiring authentication
- CORS configuration for secure cross-origin requests
- Environment-based configuration for sensitive data

## File Upload Support

The platform supports:
- CSV files (.csv)
- Excel files (.xlsx, .xls)
- File size limit: 10MB
- Automatic data validation and processing

## Data Format Requirements

For optimal analysis, ensure your survey data follows this structure:
- **Multiple-choice questions**: All columns except the last three
- **Text response questions**: Last three columns
- **Headers**: Should contain question text or identifiers
- **Missing data**: Can be left blank or empty

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hrsurvey
SECRET_KEY=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Docker Services

The docker-compose setup includes:

1. **PostgreSQL Database** (port 5432)
   - Database: hrsurvey
   - User: postgres
   - Password: password

2. **FastAPI Backend** (port 8000)
   - Automatic database table creation
   - JWT authentication
   - File upload processing

3. **Next.js Frontend** (port 3000)
   - Server-side rendering
   - Responsive design
   - Real-time authentication state

## Production Deployment

For production deployment:

1. Update environment variables with secure values
2. Use a managed PostgreSQL service
3. Configure proper CORS origins
4. Set up SSL/TLS certificates
5. Use a reverse proxy (nginx/Apache)
6. Implement proper logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.