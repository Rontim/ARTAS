"""
Admin configuration for academics app.
"""
from django.contrib import admin
from .models import (
    School, Department, Programme, Unit, ProgrammeUnit,
    AcademicYear, Semester, SemesterUnit
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'dean']
    search_fields = ['name', 'code']
    ordering = ['name']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'school', 'head_of_department']
    list_filter = ['school']
    search_fields = ['name', 'code']
    ordering = ['school', 'name']


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department',
                    'programme_type', 'duration_years', 'is_active']
    list_filter = ['department', 'programme_type', 'is_active']
    search_fields = ['name', 'code']
    ordering = ['code']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'credit_hours', 'unit_type', 'is_active']
    list_filter = ['unit_type', 'is_active', 'recommended_year']
    search_fields = ['code', 'name']
    ordering = ['code']
    filter_horizontal = ['prerequisites']


@admin.register(ProgrammeUnit)
class ProgrammeUnitAdmin(admin.ModelAdmin):
    list_display = ['programme', 'unit', 'year_of_study',
                    'semester_number', 'is_mandatory']
    list_filter = ['programme', 'year_of_study',
                   'semester_number', 'is_mandatory']
    search_fields = ['programme__code', 'unit__code']
    ordering = ['programme', 'year_of_study', 'semester_number']


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current']
    ordering = ['-year']


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'semester_type',
                    'start_date', 'end_date', 'is_active']
    list_filter = ['academic_year', 'semester_type', 'is_active']
    search_fields = ['name']
    ordering = ['-year', '-start_date']


@admin.register(SemesterUnit)
class SemesterUnitAdmin(admin.ModelAdmin):
    list_display = ['semester', 'unit', 'programme', 'lecturer']
    list_filter = ['semester', 'programme']
    search_fields = ['unit__code', 'unit__name', 'lecturer']
