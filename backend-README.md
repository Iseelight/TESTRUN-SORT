# RecruitAI Backend API

A comprehensive FastAPI backend for the RecruitAI platform with PostgreSQL database, JWT authentication, and AI-powered features.

## 🚀 Features

- **FastAPI Framework** with automatic OpenAPI documentation
- **PostgreSQL Database** with SQLAlchemy ORM
- **JWT Authentication** with refresh token support
- **Role-based Access Control** for recruiters and candidates
- **AI Integration** ready for OpenAI and speech-to-text services
- **File Upload Support** for CV/resume management
- **Email Notifications** with SMTP configuration
- **Redis Caching** for session management
- **Comprehensive API** with full CRUD operations

## 📁 Project Structure

```
app/
├── api/                # API routes and endpoints
│   ├── v1/            # API version 1
│   │   └── endpoints/ # Individual endpoint modules
│   └── deps.py        # Dependency injection
├── core/              # Core functionality
│   ├── config.py      # Configuration settings
│   ├── database.py    # Database connection
│   └── security.py    # Security utilities
├── models/            # SQLAlchemy models
├── schemas/           # Pydantic schemas
├── services/          # Business logic
└── main.py           # FastAPI application
```

## 🛠 Installation & Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <backend-repository-url>
   cd recruitai-backend
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

4. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://recruitai_user:recruitai_password@localhost:5432/recruitai_db
   
   # JWT
   SECRET_KEY=your-secret-key-here-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   
   # API
   API_V1_STR=/api/v1
   PROJECT_NAME=RecruitAI API
   VERSION=1.0.0
   
   # CORS - Add your frontend URLs
   BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173", "https://your-frontend-domain.com"]
   
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # Email (optional)
   SMTP_TLS=true
   SMTP_PORT=587
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAILS_FROM_EMAIL=your-email@gmail.com
   EMAILS_FROM_NAME=RecruitAI
   
   # File Upload
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   
   # AI/ML Services (optional)
   OPENAI_API_KEY=your-openai-api-key
   SPEECH_TO_TEXT_API_KEY=your-speech-to-text-api-key
   ```

### Database Setup

1. **Start PostgreSQL** (using Docker or local installation)
   ```bash
   # Using Docker
   docker run --name recruitai-postgres -e POSTGRES_USER=recruitai_user -e POSTGRES_PASSWORD=recruitai_password -e POSTGRES_DB=recruitai_db -p 5432:5432 -d postgres:15
   
   # Or using Docker Compose
   docker-compose up -d db
   ```

2. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

3. **Create superuser** (optional)
   ```bash
   python scripts/create_superuser.py
   ```

### Development

1. **Start the development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   The API will be available at `http://localhost:8000`

2. **API Documentation**
   - Interactive docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
   - OpenAPI JSON: `http://localhost:8000/api/v1/openapi.json`

## 🗄 Database Schema

### Core Models

- **Users**: Authentication and profile information
- **Job Postings**: Job details with AI assessment configuration
- **Candidates**: Application data with AI scoring
- **Conversations**: AI interview chat history
- **Applications**: Job application tracking

### Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth
- `POST /api/v1/auth/refresh` - Refresh access token

### Jobs (Recruiters)
- `GET /api/v1/jobs/my-jobs` - Get recruiter's jobs
- `POST /api/v1/jobs/` - Create job posting
- `PUT /api/v1/jobs/{job_id}` - Update job posting
- `DELETE /api/v1/jobs/{job_id}` - Delete job posting

### Jobs (Public)
- `GET /api/v1/jobs/` - List active jobs
- `GET /api/v1/jobs/{job_id}` - Get job details

### Candidates
- `POST /api/v1/candidates/` - Submit application
- `GET /api/v1/candidates/job/{job_id}` - Get job candidates (recruiter)
- `POST /api/v1/candidates/{candidate_id}/select` - Select candidate
- `POST /api/v1/candidates/{candidate_id}/reject` - Reject candidate

### Conversations
- `POST /api/v1/conversations/` - Start conversation
- `POST /api/v1/conversations/{id}/messages` - Add message
- `POST /api/v1/conversations/{id}/audio` - Upload audio
- `POST /api/v1/conversations/{id}/end` - End conversation

## 🚀 Deployment

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run migrations in container**
   ```bash
   docker-compose exec api alembic upgrade head
   ```

### Production Deployment

#### Railway/Render/Heroku

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use managed PostgreSQL service
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### AWS/GCP/Azure

1. **Container Deployment**: Use Docker image
2. **Database**: Use managed database service
3. **Load Balancer**: Configure for high availability
4. **Environment**: Set production environment variables

### Environment Variables for Production

```env
# Database (use managed service URL)
DATABASE_URL=postgresql://user:password@your-db-host:5432/dbname

# Security (generate strong secret)
SECRET_KEY=your-production-secret-key-here

# CORS (add your frontend domains)
BACKEND_CORS_ORIGINS=["https://your-frontend-domain.com", "https://www.your-frontend-domain.com"]

# Optional services
REDIS_URL=redis://your-redis-host:6379
OPENAI_API_KEY=your-openai-api-key
```

## 🔒 Security

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **Input Validation** with Pydantic schemas
- **SQL Injection Protection** via SQLAlchemy ORM
- **CORS Configuration** for cross-origin requests
- **Rate Limiting** (can be added with slowapi)

## 📊 Monitoring & Logging

```python
# Add to main.py for production logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 📈 Performance

- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for session and data caching
- **Async Operations**: FastAPI async support

## 🔧 Development Tools

```bash
# Code formatting
black app/

# Linting
flake8 app/

# Type checking
mypy app/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `pytest`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.