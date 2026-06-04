# ARTAS — Architecture Reference

## Stack

| Layer | Tech |
|---|---|
| Backend | Django 5, Django REST Framework, PostgreSQL 15 |
| Auth | JWT via `djangorestframework-simplejwt` |
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| State | Zustand (auth), TanStack Query (server state) |
| PDF generation | ReportLab |
| API docs | drf-spectacular (OpenAPI) |
| Containerization | Docker + docker-compose |

---

## Backend App Boundaries

```
backend/
├── artas/            ← Django project (settings, root urls, wsgi/asgi)
├── core/             ← Shared base models, middleware, pagination, utils, logging
└── apps/
    ├── accounts/     ← Custom User model (email-based, UUID PK), roles, AuditLog
    ├── students/     ← Student, StudentEnrollment, SemesterRegistration, SemesterRegistrationUnit
    ├── academics/    ← School, Department, Programme, Unit, Module, ProgrammeUnit, Semester, SemesterUnit
    ├── grades/       ← GradingScale, StudentResult, SemesterAggregate, CumulativeAggregate
    └── transcripts/  ← Transcript, TranscriptRequest, TranscriptVerification
```

---

## Domain Model (Key Relationships)

### Academic Structure
```
School (1)─── Department (N)─── Programme (N)
                                    │
                              ProgrammeUnit ───── Unit
                              (curriculum)
                                    │
                                Module (for module-based programmes)
                                    │
                              SemesterUnit (units offered in a specific semester)
```

### Student Enrollment (CRITICAL — introduced in migration 0002-0004)
```
Student ──────────── StudentEnrollment ──── Programme
                           │
                   SemesterRegistration ──── Semester ──── AcademicYear
                           │
                  SemesterRegistrationUnit ──── Unit
                           │
                      StudentResult  (grades/models.py)
```

**Key rule**: `Student` no longer has direct FK to `Programme`, `status`, `admission_year`.  
These are now properties that traverse through `Student.active_enrollment` (→ `StudentEnrollment`).

`StudentResult.unit_registration` points to `SemesterRegistrationUnit` (NOT old `UnitRegistration`).

### For module-based programmes
```
Student ─── ModuleRegistration ─── Module
                │
         SemesterRegistrationUnit (module_registration FK, nullable)
```

---

## ORM Traversal Patterns

The most common cross-model lookups after the migration:

```python
# Student → results
StudentResult.objects.filter(
    unit_registration__semester_registration__student_enrollment__student=student
)

# Programme → enrolled active students
Student.objects.filter(
    enrollments__programme=programme,
    enrollments__current_status='active'
).distinct()

# Semester registrations for a student
SemesterRegistration.objects.filter(
    student_enrollment__student=student
)

# Unit registrations for a student
SemesterRegistrationUnit.objects.filter(
    semester_registration__student_enrollment__student=student
)
```

---

## Key Field Renames (migration 0002)

| Old name | New name | Model |
|---|---|---|
| `UnitRegistration` | `SemesterRegistrationUnit` | students app |
| `ProgrammeUnit.year_of_study` | `ProgrammeUnit.recommended_program_year` | academics app |
| `ProgrammeUnit.semester_number` | `ProgrammeUnit.recommended_semester` | academics app |
| `SemesterRegistration.year_of_study` | `SemesterRegistration.program_year` | students app |
| `UnitRegistration.status` | `SemesterRegistrationUnit.unit_status` | students app |

Backward-compat `@property` getters/setters exist for the old names on the models, but they are **not usable in ORM filter/ordering — use the new DB field names there**.

---

## Serializer Backward Compatibility

| Frontend field | Backend source |
|---|---|
| `student.admission_year` | `Student.admission_year` property → enrollment |
| `student.status` | `Student.status` property → enrollment |
| `student.programme` | `Student.programme` property → enrollment |
| `semester_registration.year_of_study` | mapped via `source='program_year'` |
| `unit_registration.status` | mapped via `source='unit_status'` |
| `programme_unit.year_of_study` | mapped via `source='recommended_program_year'` |
| `programme_unit.semester_number` | mapped via `source='recommended_semester'` |

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access, user management |
| `registrar` | Write access to students, registrations, transcripts |
| `staff` | Grade entry |
| `viewer` | Read-only |

Permission classes: `IsAdminUser`, `IsRegistrarUser`, `IsStaffUser`, `IsAdminOrReadOnly` — defined in `apps/accounts/permissions.py`.

---

## API Base Path

All endpoints under `/api/v1/`. Proxied from frontend dev server (`localhost:5173`) to backend (`localhost:8001`).

| Prefix | App |
|---|---|
| `/api/v1/auth/` | accounts |
| `/api/v1/students/` | students |
| `/api/v1/academics/` | academics |
| `/api/v1/grades/` | grades |
| `/api/v1/transcripts/` | transcripts |
| `/api/v1/health/` | core |
