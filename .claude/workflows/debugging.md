# ARTAS — Debugging Guide

## Endpoint → File Map

| Endpoint | View | Serializer |
|---|---|---|
| `GET /api/v1/students/` | `students/views.py: StudentViewSet` | `StudentListSerializer` |
| `GET /api/v1/students/{id}/` | `students/views.py: StudentViewSet` | `StudentSerializer` |
| `POST /api/v1/students/` | `students/views.py: StudentViewSet` | `StudentCreateSerializer` |
| `GET /api/v1/students/semester-registrations/` | `students/views.py: SemesterRegistrationViewSet` | `SemesterRegistrationSerializer` |
| `GET /api/v1/students/unit-registrations/` | `students/views.py: UnitRegistrationViewSet` | `UnitRegistrationSerializer` |
| `GET /api/v1/academics/programmes/` | `academics/views.py: ProgrammeViewSet` | `ProgrammeListSerializer` |
| `GET /api/v1/academics/programme-units/` | `academics/views.py: ProgrammeUnitViewSet` | `ProgrammeUnitSerializer` |
| `POST /api/v1/academics/semester-units/bulk_create_from_curriculum/` | `academics/views.py: SemesterUnitViewSet` | — |
| `GET /api/v1/grades/results/` | `grades/views.py: StudentResultViewSet` | `StudentResultSerializer` |
| `POST /api/v1/grades/results/bulk_entry/` | `grades/views.py: StudentResultViewSet` | `BulkMarksEntrySerializer` |
| `POST /api/v1/grades/recompute/` | `grades/views.py: RecomputeGradesView` | — |
| `POST /api/v1/transcripts/generate/` | `transcripts/views.py: TranscriptViewSet` | — |
| `GET /api/v1/dashboard/stats/` | `core/views.py: dashboard_stats` | `DashboardStatsSerializer` |
| `GET /api/v1/dashboard/extended/` | `core/views.py: dashboard_extended` | — |
| `GET /api/v1/activities/` | `core/views.py: ActivityLogViewSet` | `ActivityLogSerializer` |

---

## Common Error Patterns

### `AttributeError: 'Manager' object has no attribute 'filter'` or `'Programme' object has no attribute 'students'`
Programme no longer has a `students` related manager. Use:
```python
Student.objects.filter(enrollments__programme=programme, enrollments__current_status='active').distinct()
```

### `FieldError: Invalid field name(s) given in select_related: 'unit_registration__student'`
`SemesterRegistrationUnit` has no DB FK named `student` — it's a Python property. Use the full ORM path:
```python
select_related('unit_registration__semester_registration__student_enrollment__student')
```

### `FieldError: Cannot resolve keyword 'year_of_study' into field`
`year_of_study` and `semester_number` are now Python properties on `ProgrammeUnit`, not DB columns. Use `recommended_program_year` and `recommended_semester` in ORM filters/ordering.

### `ImproperlyConfigured: Field name 'X' is not valid for model 'Student'`
The `Student` model no longer has direct fields for `programme`, `status`, `admission_year`, `admission_semester`. These are now:
- Properties on `Student` (read-only, not writeable via ORM)
- Actual fields on `StudentEnrollment`

If adding a field to a serializer that maps to `StudentEnrollment`, either traverse it via `source='active_enrollment.field'` or override `create()`/`update()` to handle enrollment separately.

### `TypeError: Object of type Student is not JSON serializable`
A `@property` that returns a model instance was included in a serializer's `fields` list without an explicit declaration. DRF generates a `ReadOnlyField` which passes the instance through raw. Fix: add an explicit `SerializerMethodField` or `UUIDField(source='property.id')`.

---

## Checking System Health

```bash
# Django's built-in system check (catches model/admin/URL issues)
docker exec -it artas_backend_dev python manage.py check

# Health endpoint (checks DB connectivity)
curl http://localhost:8001/api/v1/health/

# Readiness endpoint
curl http://localhost:8001/api/v1/ready/
```

---

## Grading Engine

`grades/engine.py: GradingEngine` is the single place that computes grades. It is called:
- On `StudentResult` create/update (in `grades/views.py: StudentResultViewSet.perform_create/update`)
- Via the `POST /grades/recompute/` endpoint for bulk recomputation
- Via `POST /grades/results/bulk_entry/` after processing each result

The engine traverses: `StudentResult → SemesterRegistrationUnit → SemesterRegistration → StudentEnrollment → Student`.

---

## Transcript PDF

`transcripts/generator.py: TranscriptPDFGenerator` generates PDFs with ReportLab. It reads results via:
```python
StudentResult.objects.filter(
    Q(unit_registration__semester_registration__student_enrollment__student=self.student) |
    Q(unit_registration__module_registration__student=self.student)
)
```

PDF requires `INSTITUTION_NAME` and `VERIFICATION_BASE_URL` from settings/env.

---

## Frontend API Proxy

The frontend Vite dev server proxies `/api` → `http://localhost:8001` (see `frontend/vite.config.ts`). If the frontend shows network errors but `curl localhost:8001/api/v1/health/` works, check CORS settings in `backend/artas/settings.py: CORS_ALLOWED_ORIGINS`.
