"""
Logging utilities for ARTAS.

Provides convenient logging functions and utilities for consistent logging across the application.
"""
import logging
import functools
import json
from typing import Any, Callable, Optional
from django.conf import settings


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger with the specified name.

    Args:
        name: Logger name (usually __name__ from calling module)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def log_function_call(logger: Optional[logging.Logger] = None, include_result: bool = False):
    """
    Decorator to log function calls with arguments and results.

    Args:
        logger: Logger instance to use (defaults to module logger)
        include_result: Whether to log the return value

    Example:
        @log_function_call(include_result=True)
        def my_function(x, y):
            return x + y
    """
    def decorator(func: Callable) -> Callable:
        nonlocal logger
        if logger is None:
            logger = get_logger(func.__module__)

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Format arguments for logging
            args_repr = [repr(a) for a in args]
            kwargs_repr = [f"{k}={v!r}" for k, v in kwargs.items()]
            signature = ", ".join(args_repr + kwargs_repr)

            logger.debug(f"Calling {func.__name__}({signature})")

            try:
                result = func(*args, **kwargs)
                if include_result:
                    logger.debug(f"{func.__name__} returned {result!r}")
                return result
            except Exception as e:
                logger.exception(f"Exception in {func.__name__}: {e}")
                raise

        return wrapper
    return decorator


def log_api_request(logger: Optional[logging.Logger] = None):
    """
    Decorator to log API request/response details.

    Args:
        logger: Logger instance to use

    Example:
        @log_api_request()
        def my_view(request):
            ...
    """
    def decorator(func: Callable) -> Callable:
        nonlocal logger
        if logger is None:
            logger = get_logger(func.__module__)

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract request from args (for view functions)
            request = None
            for arg in args:
                if hasattr(arg, 'method') and hasattr(arg, 'path'):
                    request = arg
                    break

            if request:
                logger.info(
                    f"API Request: {request.method} {request.path} "
                    f"from {request.META.get('REMOTE_ADDR', 'unknown')}"
                )

            result = func(*args, **kwargs)

            if request and hasattr(result, 'status_code'):
                logger.info(
                    f"API Response: {result.status_code} from {request.path}")

            return result

        return wrapper
    return decorator


class StructuredLogger:
    """
    Provides structured logging capabilities with JSON format support.
    """

    def __init__(self, name: str):
        """Initialize the structured logger."""
        self.logger = get_logger(name)

    def log_structured(self, level: int, message: str, **extra_fields):
        """
        Log a message with structured data.

        Args:
            level: Logging level (e.g., logging.INFO)
            message: Main log message
            **extra_fields: Additional fields to include in the log
        """
        # Create a structured log entry
        log_data = {
            'message': message,
            **extra_fields
        }
        self.logger.log(level, json.dumps(log_data))

    def debug(self, message: str, **extra_fields):
        """Log a debug message with structured data."""
        self.log_structured(logging.DEBUG, message, **extra_fields)

    def info(self, message: str, **extra_fields):
        """Log an info message with structured data."""
        self.log_structured(logging.INFO, message, **extra_fields)

    def warning(self, message: str, **extra_fields):
        """Log a warning message with structured data."""
        self.log_structured(logging.WARNING, message, **extra_fields)

    def error(self, message: str, **extra_fields):
        """Log an error message with structured data."""
        self.log_structured(logging.ERROR, message, **extra_fields)

    def critical(self, message: str, **extra_fields):
        """Log a critical message with structured data."""
        self.log_structured(logging.CRITICAL, message, **extra_fields)


class APILogger:
    """
    Specialized logger for API operations.
    """

    def __init__(self, name: str = 'api'):
        """Initialize the API logger."""
        self.logger = get_logger(name)

    def log_request(self, method: str, path: str, user: Optional[Any] = None, **extra):
        """
        Log an incoming API request.

        Args:
            method: HTTP method (GET, POST, etc.)
            path: Request path
            user: User object (optional)
            **extra: Additional fields to log
        """
        user_info = f"user={user.id}" if user else "anonymous"
        self.logger.info(f"{method} {path} - {user_info}", extra={
            'method': method,
            'path': path,
            'user_id': user.id if user else None,
            **extra
        })

    def log_response(self, method: str, path: str, status_code: int, **extra):
        """
        Log an API response.

        Args:
            method: HTTP method
            path: Request path
            status_code: HTTP status code
            **extra: Additional fields to log
        """
        level = logging.INFO if 200 <= status_code < 400 else logging.WARNING
        self.logger.log(level, f"{method} {path} - {status_code}", extra={
            'method': method,
            'path': path,
            'status_code': status_code,
            **extra
        })

    def log_error(self, method: str, path: str, error: str, **extra):
        """
        Log an API error.

        Args:
            method: HTTP method
            path: Request path
            error: Error message
            **extra: Additional fields to log
        """
        self.logger.error(f"{method} {path} - ERROR: {error}", extra={
            'method': method,
            'path': path,
            'error': error,
            **extra
        })


class AcademicLogger:
    """
    Specialized logger for academic operations (grades, transcripts, etc.).
    """

    def __init__(self, name: str = 'academic'):
        """Initialize the academic logger."""
        self.logger = get_logger(name)

    def log_grade_calculation(self, student_id: str, course_code: str, score: float, grade: str):
        """
        Log grade calculation.

        Args:
            student_id: Student ID/registration number
            course_code: Course code
            score: Calculated score
            grade: Final grade
        """
        self.logger.info(
            f"Grade calculated: Student={student_id}, Course={course_code}, Score={score}, Grade={grade}"
        )

    def log_transcript_generation(self, student_id: str, academic_year: str, filename: str):
        """
        Log transcript generation.

        Args:
            student_id: Student ID/registration number
            academic_year: Academic year
            filename: Generated transcript filename
        """
        self.logger.info(
            f"Transcript generated: Student={student_id}, Year={academic_year}, File={filename}"
        )

    def log_transcript_verification(self, transcript_id: str, verified: bool):
        """
        Log transcript verification.

        Args:
            transcript_id: Transcript ID
            verified: Whether verification was successful
        """
        status = "verified" if verified else "verification failed"
        self.logger.info(f"Transcript {status}: ID={transcript_id}")


class PerformanceLogger:
    """
    Logger for tracking performance metrics.
    """

    def __init__(self, name: str = 'performance'):
        """Initialize the performance logger."""
        self.logger = get_logger(name)

    def log_query_time(self, query_name: str, duration_ms: float, threshold_ms: float = 1000):
        """
        Log query execution time.

        Args:
            query_name: Name/description of the query
            duration_ms: Execution time in milliseconds
            threshold_ms: Warning threshold in milliseconds
        """
        level = logging.WARNING if duration_ms > threshold_ms else logging.DEBUG
        self.logger.log(
            level,
            f"Query '{query_name}' took {duration_ms:.2f}ms"
        )

    def log_operation_time(self, operation_name: str, duration_ms: float, status: str = 'completed'):
        """
        Log operation execution time.

        Args:
            operation_name: Name of the operation
            duration_ms: Execution time in milliseconds
            status: Operation status
        """
        self.logger.info(
            f"Operation '{operation_name}' {status} in {duration_ms:.2f}ms"
        )


# Convenience functions for quick logging without creating logger instances

def log_info(message: str, module: str = 'app', **extra):
    """Quick info level logging."""
    get_logger(module).info(message, extra=extra)


def log_warning(message: str, module: str = 'app', **extra):
    """Quick warning level logging."""
    get_logger(module).warning(message, extra=extra)


def log_error(message: str, module: str = 'app', **extra):
    """Quick error level logging."""
    get_logger(module).error(message, extra=extra)


def log_debug(message: str, module: str = 'app', **extra):
    """Quick debug level logging."""
    get_logger(module).debug(message, extra=extra)


def log_critical(message: str, module: str = 'app', **extra):
    """Quick critical level logging."""
    get_logger(module).critical(message, extra=extra)
