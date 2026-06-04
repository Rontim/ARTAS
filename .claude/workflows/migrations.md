# ARTAS — Migration History & Safety Rules

## Migration History Summary

### students app
| Migration | Description |
|---|---|
| `0001_initial` | Initial schema: Student, SemesterRegistration, ModuleRegistration, UnitRegistration |
| `0002_remove_unitregistration_...` | Adds new models as nullable columns (safe schema change) |
| `0003_data_migration` | **Data migration**: creates StudentEnrollment records, migrates UnitRegistration → SemesterRegistrationUnit (preserving UUIDs) |
| `0004_cleanup` | Drops deprecated columns (Student.programme, Student.status, etc.) and enforces NOT NULL |

### academics app
| Migration | Description |
|---|---|
| `0001_initial` | Initial schema |
| `0002_alter_programmeunit_...` | Renames `year_of_study` → `recommended_program_year`, `semester_number` → `recommended_semester` on ProgrammeUnit; adds `is_active` to AcademicYear |

### grades app
| Migration | Description |
|---|---|
| `0001_initial` | Initial schema |
| `0002_alter_studentresult_options` | Updates ordering on StudentResult |
| `0003_alter_studentresult_unit_registration` | Redirects StudentResult.unit_registration FK to `SemesterRegistrationUnit` |

---

## Current Schema State (post-migration)

The DB schema matches the current model definitions. All migrations are applied. The models are the source of truth.

Key tables:
- `students` — core student demographics only
- `student_enrollments` — student-to-programme mapping (new)
- `semester_registrations` — links to `student_enrollments` (not `students`)
- `semester_registration_units` — renamed from `unit_registrations`
- `student_results` — FK points to `semester_registration_units`

---

## Safe Migration Pattern for Future Changes

The pattern used in the 0002-0004 migration sequence is the safest approach for breaking schema changes:

1. **Schema migration (nullable first)**: Add new columns as nullable so existing rows don't violate constraints.
2. **Data migration**: Populate new columns from old data. Preserve primary keys where FK references exist downstream.
3. **Enforce constraints**: After data is migrated, make columns non-null and drop old columns.

```python
# Example data migration skeleton
from django.db import migrations

def migrate_forward(apps, schema_editor):
    OldModel = apps.get_model('app', 'OldModel')
    NewModel = apps.get_model('app', 'NewModel')
    for old in OldModel.objects.all():
        NewModel.objects.create(...)

class Migration(migrations.Migration):
    dependencies = [('app', '0002_...')]
    operations = [
        migrations.RunPython(migrate_forward, migrations.RunPython.noop),
    ]
```

**Never** rename a column that has FK references without first migrating those FKs in a prior step. Preserve primary key values when downstream tables reference them.

---

## Running Migrations Safely

```bash
# Always check first — catches model errors before touching the DB
docker exec -it artas_backend_dev python manage.py check

# Preview SQL without running
docker exec -it artas_backend_dev python manage.py sqlmigrate <app> <migration>

# Apply
docker exec -it artas_backend_dev python manage.py migrate
```
