"""
Admin configuration for students app.
"""
from django.contrib import admin
from .models import Student, StudentEnrollment, SemesterRegistration, ModuleRegistration, SemesterRegistrationUnit


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['reg_no', 'full_name']
    search_fields = ['reg_no', 'first_name', 'last_name', 'email']
    ordering = ['reg_no']

    fieldsets = (
        ('Basic Information', {
            'fields': ('reg_no', 'first_name', 'middle_name', 'last_name', 'photo')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone_number', 'address')
        }),
        ('Demographics', {
            'fields': ('date_of_birth', 'gender', 'nationality', 'national_id')
        }),
    )


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'programme', 'admission_date', 'cohort', 'current_status']
    list_filter = ['programme', 'current_status', 'cohort']
    search_fields = ['student__reg_no', 'student__first_name', 'student__last_name']
    ordering = ['student__reg_no']


@admin.register(SemesterRegistration)
class SemesterRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student_enrollment', 'semester', 'program_year', 'registration_date', 'status']
    list_filter = ['semester', 'program_year', 'status']
    search_fields = ['student_enrollment__student__reg_no',
                     'student_enrollment__student__first_name', 'student_enrollment__student__last_name']
    ordering = ['-registration_date']


@admin.register(ModuleRegistration)
class ModuleRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'module', 'is_repeat', 'registration_date']
    list_filter = ['module', 'is_repeat']
    search_fields = ['student__reg_no',
                     'student__first_name', 'student__last_name']
    ordering = ['-registration_date']


@admin.register(SemesterRegistrationUnit)
class SemesterRegistrationUnitAdmin(admin.ModelAdmin):
    list_display = ['semester_registration', 'unit', 'unit_status', 'attempt_number']
    list_filter = ['unit_status']
    search_fields = ['semester_registration__student_enrollment__student__reg_no', 'unit__code']
    ordering = ['semester_registration', 'unit']
