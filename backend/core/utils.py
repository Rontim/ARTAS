"""
Utility functions for ARTAS.
"""
import hashlib
import secrets
import string
from datetime import datetime
from typing import Optional


def generate_verification_code(length: int = 12) -> str:
    """Generate a random verification code."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_transcript_id(student_reg_no: str, timestamp: Optional[datetime] = None) -> str:
    """
    Generate a unique transcript ID based on student registration number and timestamp.
    Format: TRS-{YEAR}-{HASH}
    """
    if timestamp is None:
        timestamp = datetime.now()

    data = f"{student_reg_no}-{timestamp.isoformat()}"
    hash_digest = hashlib.sha256(data.encode()).hexdigest()[:8].upper()
    return f"TRS-{timestamp.year}-{hash_digest}"


def calculate_gpa(total_points: float, total_credits: float) -> float:
    """Calculate GPA from total grade points and credits."""
    if total_credits == 0:
        return 0.0
    return round(total_points / total_credits, 2)


def format_academic_year(year: int) -> str:
    """Format academic year (e.g., 2023 -> '2023/2024')."""
    return f"{year}/{year + 1}"


def get_semester_display(semester_name: str, year: int) -> str:
    """Format semester display name."""
    return f"{semester_name} {year}"
