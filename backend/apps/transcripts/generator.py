"""
PDF Generator for academic transcripts.
"""
import io
import os
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

import qrcode
from io import BytesIO


class TranscriptPDFGenerator:
    """
    PDF generator for academic transcripts.
    Uses ReportLab for PDF creation.
    """

    def __init__(self, student, transcript):
        self.student = student
        self.transcript = transcript
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='Title',
            parent=self.styles['Heading1'],
            fontSize=16,
            alignment=TA_CENTER,
            spaceAfter=20,
        ))

        self.styles.add(ParagraphStyle(
            name='InstitutionName',
            parent=self.styles['Heading1'],
            fontSize=18,
            alignment=TA_CENTER,
            spaceAfter=5,
            textColor=colors.darkblue,
        ))

        self.styles.add(ParagraphStyle(
            name='SubTitle',
            parent=self.styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER,
            spaceAfter=10,
        ))

        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=11,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.darkblue,
        ))

        self.styles.add(ParagraphStyle(
            name='FieldLabel',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.grey,
        ))

        self.styles.add(ParagraphStyle(
            name='FieldValue',
            parent=self.styles['Normal'],
            fontSize=10,
        ))

        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
        ))

    def generate(self) -> bytes:
        """Generate the transcript PDF and return as bytes."""
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm,
        )

        story = []

        # Build the document
        story.extend(self._build_header())
        story.extend(self._build_student_info())
        story.extend(self._build_results_section())
        story.extend(self._build_summary_section())
        story.extend(self._build_footer())

        doc.build(story)

        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    def _build_header(self) -> List:
        """Build the transcript header with institution info."""
        elements = []

        # Institution name
        institution_name = getattr(
            settings, 'INSTITUTION_NAME', 'University Name')
        elements.append(Paragraph(institution_name.upper(),
                        self.styles['InstitutionName']))
        elements.append(Paragraph('ACADEMIC TRANSCRIPT', self.styles['Title']))
        elements.append(Spacer(1, 10))

        # Transcript info line
        info_text = f"Transcript ID: {self.transcript.transcript_id} | Type: {self.transcript.get_transcript_type_display()}"
        elements.append(Paragraph(info_text, self.styles['SubTitle']))
        elements.append(Spacer(1, 20))

        return elements

    def _build_student_info(self) -> List:
        """Build the student information section."""
        elements = []

        elements.append(Paragraph('STUDENT INFORMATION',
                        self.styles['SectionHeader']))

        # Student details table
        data = [
            ['Registration No:', self.student.reg_no,
                'Programme:', self.student.programme.name],
            ['Name:', self.student.full_name, 'Department:',
                self.student.department.name if self.student.department else ''],
            ['Admission Year:', str(self.student.admission_year), 'School:',
             self.student.school.name if self.student.school else ''],
        ]

        table = Table(data, colWidths=[2.5*cm, 6*cm, 2.5*cm, 6*cm])
        table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.grey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 20))

        return elements

    def _build_results_section(self) -> List:
        """Build the academic results section organized by semester."""
        elements = []

        elements.append(Paragraph('ACADEMIC RECORD',
                        self.styles['SectionHeader']))

        # Get results grouped by semester
        from apps.grades.models import StudentResult, SemesterAggregate

        results = StudentResult.objects.filter(
            student=self.student,
            is_deleted=False
        ).select_related('unit', 'semester').order_by(
            'semester__year', 'semester__start_date', 'unit__code'
        )

        # Group by semester
        semesters = {}
        for result in results:
            sem_id = result.semester.id
            if sem_id not in semesters:
                semesters[sem_id] = {
                    'semester': result.semester,
                    'results': []
                }
            semesters[sem_id]['results'].append(result)

        # Build table for each semester
        for sem_id, sem_data in semesters.items():
            semester = sem_data['semester']
            sem_results = sem_data['results']

            # Semester header
            elements.append(Paragraph(
                f"<b>{semester.name}</b>",
                self.styles['FieldValue']
            ))
            elements.append(Spacer(1, 5))

            # Results table
            table_data = [['Code', 'Unit Title', 'Credits', 'Marks', 'Grade']]

            for result in sem_results:
                table_data.append([
                    result.unit.code,
                    result.unit.name[:40] +
                    ('...' if len(result.unit.name) > 40 else ''),
                    f"{result.credit_attempted:.2f}",
                    f"{result.marks:.2f}",
                    result.grade,
                ])

            table = Table(table_data, colWidths=[2*cm, 9*cm, 2*cm, 2*cm, 2*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))

            elements.append(table)

            # Semester totals
            try:
                aggregate = SemesterAggregate.objects.get(
                    student=self.student,
                    semester=semester
                )

                summary_data = [[
                    f"Term Average: {aggregate.term_average:.2f}",
                    f"Credits Attempted: {aggregate.credits_attempted:.2f}",
                    f"Credits Earned: {aggregate.credits_earned:.2f}",
                    f"GPA: {aggregate.gpa:.2f}",
                ]]

                summary_table = Table(summary_data, colWidths=[
                                      4.25*cm, 4.25*cm, 4.25*cm, 4.25*cm])
                summary_table.setStyle(TableStyle([
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                    ('BACKGROUND', (0, 0), (-1, -1),
                     colors.Color(0.95, 0.95, 0.95)),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                ]))

                elements.append(summary_table)
            except SemesterAggregate.DoesNotExist:
                pass

            elements.append(Spacer(1, 15))

        return elements

    def _build_summary_section(self) -> List:
        """Build the cumulative summary section."""
        elements = []

        elements.append(Paragraph('CUMULATIVE SUMMARY',
                        self.styles['SectionHeader']))

        from apps.grades.models import CumulativeAggregate

        try:
            cumulative = CumulativeAggregate.objects.get(student=self.student)

            data = [
                ['Cumulative Average:', f"{cumulative.cumulative_average:.2f}",
                 'CGPA:', f"{cumulative.cgpa:.2f}"],
                ['Total Credits Attempted:', f"{cumulative.cumulative_credits_attempted:.2f}",
                 'Total Credits Earned:', f"{cumulative.cumulative_credits_earned:.2f}"],
                ['Units Passed:', str(cumulative.total_units_passed),
                 'Units Failed:', str(cumulative.total_units_failed)],
                ['Overall Classification:', cumulative.cumulative_grade, '', ''],
            ]

            table = Table(data, colWidths=[4.25*cm, 4.25*cm, 4.25*cm, 4.25*cm])
            table.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 0), (-1, -1), colors.Color(0.9, 0.95, 1.0)),
                ('BOX', (0, 0), (-1, -1), 1, colors.darkblue),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))

            elements.append(table)

        except CumulativeAggregate.DoesNotExist:
            elements.append(
                Paragraph('No cumulative data available.', self.styles['FieldValue']))

        elements.append(Spacer(1, 20))

        return elements

    def _build_footer(self) -> List:
        """Build the transcript footer with verification info."""
        elements = []

        # QR Code
        qr_data = f"{settings.VERIFICATION_BASE_URL}/{self.transcript.verification_code}"
        qr = qrcode.QRCode(version=1, box_size=3, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")

        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)

        # Verification section
        elements.append(
            Paragraph('VERIFICATION', self.styles['SectionHeader']))

        verification_data = [[
            Image(qr_buffer, width=2*cm, height=2*cm),
            Paragraph(
                f"<b>Verification Code:</b> {self.transcript.verification_code}<br/>"
                f"<b>Issued Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
                f"<b>Verify at:</b> {qr_data}",
                self.styles['SmallText']
            ),
        ]]

        ver_table = Table(verification_data, colWidths=[3*cm, 14*cm])
        ver_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        elements.append(ver_table)
        elements.append(Spacer(1, 30))

        # Signature lines
        sig_data = [[
            '_' * 30 + '\nRegistrar',
            '_' * 30 + '\nDate',
            '_' * 30 + '\nSeal',
        ]]

        sig_table = Table(sig_data, colWidths=[5.67*cm, 5.67*cm, 5.67*cm])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 20),
        ]))

        elements.append(sig_table)

        # Disclaimer
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(
            "This is an official document. Any alteration renders it invalid. "
            "Verify authenticity using the QR code or verification code above.",
            self.styles['SmallText']
        ))

        return elements
