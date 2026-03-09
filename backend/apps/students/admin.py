"""
Admin configuration for students app.
"""
from django.contrib import admin
from .models import Student, SemesterRegistration, ModuleRegistration, UnitRegistration


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['reg_no', 'full_name',
                    'programme', 'admission_year', 'status']
    list_filter = ['status', 'programme', 'admission_year']
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
            'fields': ('programme', 'admission_year', 'admission_semester')
        }),
        ('Status', {
            'fields': ('status', 'graduation_date')
        }),
    )


@admin.register(SemesterRegistration)
class SemesterRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'semester',
                    'year_of_study', 'is_repeat', 'registration_date']
    list_filter = ['semester', 'year_of_study', 'is_repeat']
    search_fields = ['student__reg_no',
                     'student__first_name', 'student__last_name']
    ordering = ['-registration_date']


@admin.register(ModuleRegistration)
class ModuleRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'module', 'is_repeat', 'registration_date']
    list_filter = ['module', 'is_repeat']
    search_fields = ['student__reg_no',
                     'student__first_name', 'student__last_name']
    ordering = ['-registration_date']


@admin.register(UnitRegistration)
class UnitRegistrationAdmin(admin.ModelAdmin):
    list_display = ['student', 'unit', 'semester_registration',
                    'module_registration', 'status']
    list_filter = ['status']
    search_fields = ['student__reg_no', 'unit__code']
    ordering = ['student', 'unit']
