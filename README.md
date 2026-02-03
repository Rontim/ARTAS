# ARTAS - Academic Records & Transcript Automation System

A full-stack system for automating academic transcript generation with centralized student and academic records management, automated grading, GPA calculation, and PDF transcript generation with digital verification.

## Features

- **Student Management**: Registration, enrollment tracking, and status management
- **Academic Structure**: Schools, Departments, Programmes, Units with hierarchical organization
- **Marks Entry**: Individual and bulk marks upload with validation
- **Grading Engine**: Configurable grading scales with automatic grade calculation
- **GPA Calculation**: Semester GPA and Cumulative GPA with institutional standards
- **Transcript Generation**: PDF transcripts with QR code verification
- **Digital Verification**: Public verification endpoint for transcript authenticity
- **Role-Based Access**: Admin, Registrar, Staff, and Viewer roles
- **Audit Logging**: Track all sensitive operations

## Tech Stack

### Backend

- Python 3.11+
- Django 5.0
- Django REST Framework
- PostgreSQL
- ReportLab (PDF generation)
- Simple JWT (authentication)

### Frontend

- Vite + React 18
- TypeScript
- Tailwind CSS
- TanStack Query
- React Router v6
- Zustand (state management)

## Project Structure

```
ARTAS/
├── backend/                 # Django REST Framework API
│   ├── artas/              # Django project settings
│   ├── apps/
│   │   ├── accounts/       # User authentication & roles
│   │   ├── students/       # Student management
│   │   ├── academics/      # Programs, units, semesters
│   │   ├── grades/         # Marks, grading engine
│   │   └── transcripts/    # Transcript generation
│   ├── core/               # Shared utilities
│   └── requirements/       # Python dependencies
├── frontend/               # Vite React TypeScript app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── stores/         # Zustand state stores
│   │   └── types/          # TypeScript interfaces
│   └── public/
└── docs/                   # Documentation
```

## Getting Started

### Quick Start with Docker (Recommended)

#### Development Environment

```bash
# Clone and navigate to project
cd ARTAS

# Copy environment file
cp .env.example .env

# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or use the PowerShell script (Windows)
.\scripts\docker-dev.ps1 start
```

Access the application:

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8000>
- **pgAdmin**: <http://localhost:5050> (<admin@artas.local> / admin123)

Default superuser: `admin@artas.local` / `admin123`

#### Production Environment

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d --build

# Or use the PowerShell script (Windows)
.\scripts\docker-prod.ps1 start
```

Access the application at <http://localhost>

### Docker Commands Reference

Using Makefile (Linux/Mac):

```bash
make dev          # Start development
make dev-down     # Stop development
make dev-logs     # View logs
make dev-shell    # Shell into backend
make prod         # Start production
make prod-down    # Stop production
make clean        # Remove everything
```

Using PowerShell (Windows):

```powershell
.\scripts\docker-dev.ps1 start    # Start development
.\scripts\docker-dev.ps1 stop     # Stop development
.\scripts\docker-dev.ps1 logs     # View logs
.\scripts\docker-dev.ps1 shell    # Shell into backend
.\scripts\docker-prod.ps1 start   # Start production
```

---

### Manual Setup (Without Docker)

#### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

#### Backend Setup

1. Navigate to backend directory:

   ```bash
   cd backend
   ```

2. Create virtual environment:

   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements/dev.txt
   ```

4. Copy environment file and configure:

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. Run migrations:

   ```bash
   python manage.py migrate
   ```

6. Create superuser:

   ```bash
   python manage.py createsuperuser
   ```

7. Start development server:

   ```bash
   python manage.py runserver
   ```

The API will be available at <http://localhost:8000>

### Frontend Setup

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment file:

   ```bash
   cp .env.example .env
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

The frontend will be available at <http://localhost:5173>

## API Endpoints

### Authentication

- `POST /api/v1/accounts/auth/login/` - User login
- `POST /api/v1/accounts/auth/refresh/` - Refresh JWT token
- `GET /api/v1/accounts/users/me/` - Current user profile

### Students

- `GET /api/v1/students/students/` - List students
- `POST /api/v1/students/students/` - Create student
- `GET /api/v1/students/students/{id}/` - Get student details
- `GET /api/v1/students/students/{id}/results/` - Student results

### Academics

- `GET /api/v1/academics/schools/` - List schools
- `GET /api/v1/academics/departments/` - List departments
- `GET /api/v1/academics/programmes/` - List programmes
- `GET /api/v1/academics/units/` - List units
- `GET /api/v1/academics/semesters/` - List semesters

### Grades

- `GET /api/v1/grades/results/` - List results
- `POST /api/v1/grades/results/` - Create result
- `POST /api/v1/grades/results/bulk_upload/` - Bulk upload marks
- `GET /api/v1/grades/cumulative/{student_id}/` - Cumulative aggregate

### Transcripts

- `GET /api/v1/transcripts/transcripts/` - List transcripts
- `POST /api/v1/transcripts/transcripts/generate/` - Generate transcript
- `GET /api/v1/transcripts/transcripts/{id}/download/` - Download PDF
- `GET /api/v1/transcripts/verify/{code}/` - Verify transcript (public)

## Configuration

### Grading Scale

Default grading scale (configurable in Django admin):

| Grade | Min Score | Max Score | Grade Points |
|-------|-----------|-----------|--------------|
| A     | 70        | 100       | 4.0          |
| B     | 60        | 69        | 3.0          |
| C     | 50        | 59        | 2.0          |
| D     | 40        | 49        | 1.0          |
| F     | 0         | 39        | 0.0          |

### Environment Variables

#### Backend (.env)

```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@localhost/artas
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (.env)

```
VITE_API_BASE_URL=/api/v1
```

## Development

### Running Tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run test
```

### Code Formatting

```bash
# Backend
black .
isort .

# Frontend
npm run lint
npm run format
```

## Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX (Port 80)                       │
│    - Reverse proxy for API and frontend                     │
│    - Static file serving                                    │
│    - Rate limiting and caching                              │
└─────────────────────┬───────────────────────┬───────────────┘
                      │                       │
          ┌───────────▼───────────┐ ┌────────▼────────┐
          │   Backend (Gunicorn)   │ │    Frontend     │
          │   Django REST API      │ │   React/Vite    │
          │   Port 8000            │ │   Port 5173     │
          └───────────┬────────────┘ └─────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐
│ PostgreSQL │  │    Redis    │  │   Media   │
│  Database  │  │    Cache    │  │  Storage  │
│  Port 5432 │  │  Port 6379  │  │  Volume   │
└────────────┘  └─────────────┘  └───────────┘
```

## License

MIT License - see LICENSE file for details.
