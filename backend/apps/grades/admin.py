"""
Admin configuration for grades app.
"""
from django.contrib import admin
from .models import (
    GradingScale, GradeDefinition, StudentResult,
    SemesterAggregate, CumulativeAggregate, MarksUploadBatch
)


class GradeDefinitionInline(admin.TabularInline):
    model = GradeDefinition
    extra = 1


@admin.register(GradingScale)
class GradingScaleAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_default', 'created_at']
    list_filter = ['is_default']
    inlines = [GradeDefinitionInline]


@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'unit', 'semester',
                    'marks', 'grade', 'status', 'is_approved']
    list_filter = ['semester', 'status', 'is_approved', 'grade']
    search_fields = ['student__reg_no', 'student__first_name', 'unit__code']
    ordering = ['-created_at']
    readonly_fields = ['grade', 'grade_points', 'credit_earned', 'status']


@admin.register(SemesterAggregate)
class SemesterAggregateAdmin(admin.ModelAdmin):
    list_display = ['student', 'semester', 'term_average',
                    'gpa', 'units_passed', 'units_failed']
    list_filter = ['semester']
    search_fields = ['student__reg_no']
    readonly_fields = [
        'total_marks', 'units_taken', 'term_average', 'credits_attempted',
        'credits_earned', 'total_grade_points', 'gpa', 'units_passed', 'units_failed'
    ]


@admin.register(CumulativeAggregate)
class CumulativeAggregateAdmin(admin.ModelAdmin):
    list_display = ['student', 'cumulative_average',
                    'cgpa', 'cumulative_grade']
    list_filter = ['cumulative_grade']
    search_fields = ['student__reg_no']
    readonly_fields = [
        'cumulative_marks', 'cumulative_units', 'cumulative_average',
        'cumulative_credits_attempted', 'cumulative_credits_earned',
        'cumulative_grade_points', 'cgpa', 'cumulative_grade',
        'total_units_passed', 'total_units_failed', 'last_semester'
    ]


@admin.register(MarksUploadBatch)
class MarksUploadBatchAdmin(admin.ModelAdmin):
    list_display = ['unit', 'semester', 'uploaded_by',
                    'status', 'total_records', 'successful_records']
    list_filter = ['status', 'semester']
    search_fields = ['unit__code', 'file_name']
    readonly_fields = ['errors']
