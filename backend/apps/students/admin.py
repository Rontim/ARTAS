"""
Admin configuration for students app.
"""
from django.contrib import admin
from .models import Student, StudentEnrollment


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['reg_no', 'full_name',
                    'programme', 'admission_year', 'status']
    list_filter = ['status', 'programme',
                   'admission_year', 'current_year_of_study']
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
        ('Academic Information', {
            'fields': ('programme', 'admission_year', 'admission_semester', 'current_year_of_study')
        }),
        ('Status', {
            'fields': ('status', 'graduation_date')
        }),
    )


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'semester',
                    'year_of_study', 'is_repeat', 'enrollment_date']
    list_filter = ['semester', 'year_of_study', 'is_repeat']
    search_fields = ['student__reg_no',
                     'student__first_name', 'student__last_name']
    ordering = ['-enrollment_date']
