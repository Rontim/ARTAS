"""
Views for transcripts app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
import io

from apps.accounts.permissions import IsRegistrarUser, IsStaffUser
from apps.students.models import Student
from .models import Transcript, TranscriptRequest, TranscriptVerification, TranscriptStatus
from .serializers import (
    TranscriptSerializer, TranscriptGenerateSerializer,
    BatchTranscriptGenerateSerializer, TranscriptRequestSerializer,
    TranscriptVerificationSerializer, VerifyTranscriptSerializer,
    TranscriptVerificationResponseSerializer
)
from .generator import TranscriptPDFGenerator


@extend_schema_view(
    list=extend_schema(description='List all transcripts'),
    retrieve=extend_schema(description='Retrieve a specific transcript'),
)
class TranscriptViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transcripts."""
    queryset = Transcript.objects.select_related(
        'student', 'generated_by', 'from_semester', 'to_semester'
    ).all()
    serializer_class = TranscriptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['student', 'transcript_type', 'status']
    search_fields = ['transcript_id', 'verification_code', 'student__reg_no']
    ordering_fields = ['created_at', 'generated_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate', 'batch_generate']:
            return [IsAuthenticated(), IsRegistrarUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    @transaction.atomic
    def generate(self, request):
        """Generate a transcript for a student."""
        serializer = TranscriptGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            student = Student.objects.get(
                id=serializer.validated_data['student_id'])
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        # Create transcript record
        transcript = Transcript.objects.create(
            student=student,
            transcript_type=serializer.validated_data['transcript_type'],
            from_semester_id=serializer.validated_data.get('from_semester_id'),
            to_semester_id=serializer.validated_data.get('to_semester_id'),
            generated_by=request.user,
            generated_at=timezone.now(),
            notes=serializer.validated_data.get('notes', ''),
            status=TranscriptStatus.GENERATED,
        )

        # Generate PDF
        generator = TranscriptPDFGenerator(student, transcript)
        pdf_bytes = generator.generate()

        # Save PDF to transcript
        from django.core.files.base import ContentFile
        transcript.pdf_file.save(
            f"{transcript.transcript_id}.pdf",
            ContentFile(pdf_bytes)
        )

        # Snapshot the data
        transcript.data_snapshot = self._create_data_snapshot(student)
        transcript.save()

        return Response(TranscriptSerializer(transcript).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    @transaction.atomic
    def batch_generate(self, request):
        """Generate transcripts for multiple students."""
        serializer = BatchTranscriptGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_ids = serializer.validated_data['student_ids']
        transcript_type = serializer.validated_data['transcript_type']

        generated = []
        errors = []

        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id)

                transcript = Transcript.objects.create(
                    student=student,
                    transcript_type=transcript_type,
                    generated_by=request.user,
                    generated_at=timezone.now(),
                    status=TranscriptStatus.GENERATED,
                )

                generator = TranscriptPDFGenerator(student, transcript)
                pdf_bytes = generator.generate()

                from django.core.files.base import ContentFile
                transcript.pdf_file.save(
                    f"{transcript.transcript_id}.pdf",
                    ContentFile(pdf_bytes)
                )

                transcript.data_snapshot = self._create_data_snapshot(student)
                transcript.save()

                generated.append(transcript.transcript_id)

            except Student.DoesNotExist:
                errors.append({'student_id': str(student_id),
                              'error': 'Student not found'})
            except Exception as e:
                errors.append({'student_id': str(student_id), 'error': str(e)})

        return Response({
            'message': f'Generated {len(generated)} transcripts',
            'generated': generated,
            'errors': errors
        })

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the transcript PDF."""
        transcript = self.get_object()

        if not transcript.pdf_file:
            return Response(
                {'error': 'PDF not yet generated'},
                status=status.HTTP_404_NOT_FOUND
            )

        return FileResponse(
            transcript.pdf_file.open('rb'),
            as_attachment=True,
            filename=f"{transcript.transcript_id}.pdf"
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    def issue(self, request, pk=None):
        """Mark a transcript as issued."""
        transcript = self.get_object()

        if transcript.status != TranscriptStatus.GENERATED:
            return Response(
                {'error': 'Transcript must be in generated status to issue'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transcript.status = TranscriptStatus.ISSUED
        transcript.issued_by = request.user
        transcript.issued_at = timezone.now()
        transcript.save()

        return Response(TranscriptSerializer(transcript).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    def revoke(self, request, pk=None):
        """Revoke a transcript."""
        transcript = self.get_object()
        reason = request.data.get('reason', '')

        transcript.status = TranscriptStatus.REVOKED
        transcript.notes = f"{transcript.notes}\nRevoked: {reason}"
        transcript.save()

        return Response(TranscriptSerializer(transcript).data)

    def _create_data_snapshot(self, student) -> dict:
        """Create a snapshot of student data at the time of transcript generation."""
        from django.db.models import Q
        from apps.grades.models import StudentResult, CumulativeAggregate

        results = StudentResult.objects.filter(
            Q(unit_registration__semester_registration__student_enrollment__student=student) |
            Q(unit_registration__module_registration__student=student),
            is_deleted=False
        ).select_related(
            'unit_registration__unit',
            'unit_registration__semester_registration__semester',
            'unit_registration__module_registration__module',
        )

        try:
            cumulative = CumulativeAggregate.objects.get(student=student)
            cumulative_data = {
                'cgpa': str(cumulative.cgpa),
                'cumulative_average': str(cumulative.cumulative_average),
                'cumulative_grade': cumulative.cumulative_grade,
                'total_credits_earned': str(cumulative.cumulative_credits_earned),
            }
        except CumulativeAggregate.DoesNotExist:
            cumulative_data = {}

        snapshot_results = []
        for r in results:
            ur = r.unit_registration
            if ur.semester_registration:
                period = ur.semester_registration.semester.name
            elif ur.module_registration:
                period = ur.module_registration.module.name
            else:
                period = ''
            snapshot_results.append({
                'unit_code': ur.unit.code,
                'unit_name': ur.unit.name,
                'period': period,
                'marks': str(r.marks),
                'grade': r.grade,
                'credits': str(r.credit_attempted),
            })

        return {
            'student': {
                'reg_no': student.reg_no,
                'full_name': student.full_name,
                'programme': student.programme.name,
                'department': student.department.name if student.department else '',
            },
            'results': snapshot_results,
            'cumulative': cumulative_data,
            'generated_at': timezone.now().isoformat(),
        }


class VerifyTranscriptView(APIView):
    """Public endpoint for verifying transcripts."""
    permission_classes = [AllowAny]

    @extend_schema(
        request=VerifyTranscriptSerializer,
        responses={200: TranscriptVerificationResponseSerializer}
    )
    def post(self, request):
        """Verify a transcript by verification code or transcript ID."""
        serializer = VerifyTranscriptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']

        # Try to find transcript by verification code or transcript ID
        transcript = Transcript.objects.filter(
            verification_code=code,
            status__in=[TranscriptStatus.GENERATED, TranscriptStatus.ISSUED]
        ).first()

        if not transcript:
            transcript = Transcript.objects.filter(
                transcript_id=code,
                status__in=[TranscriptStatus.GENERATED,
                            TranscriptStatus.ISSUED]
            ).first()

        # Log verification attempt
        if transcript:
            TranscriptVerification.objects.create(
                transcript=transcript,
                verification_method='code',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                is_valid=True,
            )

            return Response({
                'is_valid': True,
                'message': 'Transcript is valid',
                'transcript_info': {
                    'transcript_id': transcript.transcript_id,
                    'student_name': transcript.student.full_name,
                    'student_reg_no': transcript.student.reg_no,
                    'programme': transcript.student.programme.name,
                    'transcript_type': transcript.get_transcript_type_display(),
                    'status': transcript.get_status_display(),
                    'issued_at': transcript.issued_at.isoformat() if transcript.issued_at else None,
                }
            })

        return Response({
            'is_valid': False,
            'message': 'Transcript not found or has been revoked',
        }, status=status.HTTP_404_NOT_FOUND)

    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


@extend_schema_view(
    list=extend_schema(description='List transcript requests'),
    retrieve=extend_schema(description='Retrieve a specific request'),
    create=extend_schema(description='Create a new request'),
)
class TranscriptRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transcript requests."""
    queryset = TranscriptRequest.objects.select_related(
        'student', 'processed_by', 'transcript').all()
    serializer_class = TranscriptRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'transcript_type', 'status']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    def approve(self, request, pk=None):
        """Approve a transcript request."""
        req = self.get_object()

        if req.status != 'pending':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )

        req.status = 'approved'
        req.processed_by = request.user
        req.processed_at = timezone.now()
        req.save()

        return Response(TranscriptRequestSerializer(req).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsRegistrarUser])
    def reject(self, request, pk=None):
        """Reject a transcript request."""
        req = self.get_object()
        reason = request.data.get('reason', '')

        if req.status != 'pending':
            return Response(
                {'error': 'Request is not pending'},
                status=status.HTTP_400_BAD_REQUEST
            )

        req.status = 'rejected'
        req.rejection_reason = reason
        req.processed_by = request.user
        req.processed_at = timezone.now()
        req.save()

        return Response(TranscriptRequestSerializer(req).data)
