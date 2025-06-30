# RecruitAI Backend API

A comprehensive FastAPI backend for the RecruitAI platform with PostgreSQL database.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Multi-User Support**: Separate dashboards for recruiters and candidates
- **Job Management**: CRUD operations for job postings with AI-powered descriptions
- **Candidate Assessment**: AI conversation analysis and scoring
- **Waitlist System**: Intelligent candidate management with customizable waitlists
- **Audio Support**: Speech-to-text conversion for voice interviews
- **File Upload**: CV/Resume upload and management
- **Real-time Features**: WebSocket support for live conversations
- **Comprehensive API**: RESTful endpoints with OpenAPI documentation

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: Python SQL toolkit and ORM
- **Alembic**: Database migration tool
- **Redis**: Caching and session storage
- **JWT**: Secure authentication tokens
- **Pydantic**: Data validation using Python type annotations

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start services with Docker**
   ```bash
   docker-compose up -d db redis
   ```

6. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

7. **Create superuser (optional)**
   ```bash
   python scripts/create_superuser.py
   ```

8. **Start the development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once the server is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## Database Schema

### Core Models

#### Users
- **id**: UUID primary key
- **email**: Unique email address
- **name**: Full name
- **role**: 'recruiter' or 'candidate'
- **company**: Company name (for recruiters)
- **avatar_url**: Profile picture URL
- **OAuth fields**: Google/LinkedIn integration

#### Job Postings
- **id**: UUID primary key
- **title**: Job title
- **description**: Detailed job description
- **requirements**: JSON array of requirements
- **skill_weights**: Assessment weights for different skills
- **cutoff_percentage**: Minimum score threshold
- **max_candidates**: Maximum number of candidates
- **waitlist settings**: Waitlist configuration
- **recruiter_id**: Foreign key to users table

#### Candidates
- **id**: UUID primary key
- **personal_info**: Name, email, phone, location
- **scores**: JSON object with assessment scores
- **status**: Application status (pending, selected, rejected, etc.)
- **feedback**: Detailed assessment feedback
- **cv_info**: Resume file information

#### Conversations
- **id**: UUID primary key
- **messages**: Related conversation messages
- **analysis**: AI-generated conversation analysis
- **duration**: Conversation length in seconds

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/refresh` - Refresh access token

### Jobs
- `GET /api/v1/jobs/` - List all active jobs (public)
- `GET /api/v1/jobs/my-jobs` - Get recruiter's jobs
- `POST /api/v1/jobs/` - Create new job posting
- `GET /api/v1/jobs/{job_id}` - Get job details
- `PUT /api/v1/jobs/{job_id}` - Update job posting
- `DELETE /api/v1/jobs/{job_id}` - Delete job posting

### Candidates
- `POST /api/v1/candidates/` - Submit job application
- `GET /api/v1/candidates/job/{job_id}` - Get candidates for job
- `GET /api/v1/candidates/{candidate_id}` - Get candidate details
- `POST /api/v1/candidates/{candidate_id}/select` - Select candidate
- `POST /api/v1/candidates/{candidate_id}/reject` - Reject candidate

### Conversations
- `POST /api/v1/conversations/` - Start new conversation
- `GET /api/v1/conversations/{conversation_id}` - Get conversation
- `POST /api/v1/conversations/{conversation_id}/messages` - Add message
- `POST /api/v1/conversations/{conversation_id}/audio` - Upload audio message

## Role-Based Access Control

### Recruiter Permissions
- Create, read, update, delete their own job postings
- View candidates who applied to their jobs
- Select/reject candidates for their jobs
- Access conversation data for their job applications
- Generate AI-powered job descriptions

### Candidate Permissions
- View all active job postings
- Apply to jobs (once per job)
- Participate in AI conversations
- View their own application status and feedback
- Upload CV/resume files

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Role-Based Access**: Strict permission controls
- **Data Isolation**: Users can only access their own data
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin policies

## Development

### Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

### Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app tests/
```

### Code Quality

Format code:
```bash
black app/
```

Lint code:
```bash
flake8 app/
```

Type checking:
```bash
mypy app/
```

## Deployment

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations in container**
   ```bash
   docker-compose exec api alembic upgrade head
   ```

### Production Considerations

- Set strong `SECRET_KEY` in environment variables
- Use production-grade PostgreSQL instance
- Configure Redis for session storage
- Set up proper logging and monitoring
- Use HTTPS in production
- Configure backup strategies
- Set up CI/CD pipelines

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |
| `SMTP_HOST` | Email server host | Optional |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.