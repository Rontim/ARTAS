// User Types
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: 'admin' | 'registrar' | 'staff' | 'viewer';
    phone_number?: string;
    department?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

// Student Types
export interface Student {
    id: string;
    reg_no: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    full_name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    national_id?: string;
    programme: string;
    programme_name: string;
    department_name?: string;
    school_name?: string;
    admission_year: number;
    current_year_of_study: number;
    status: 'active' | 'graduated' | 'suspended' | 'withdrawn' | 'deferred';
    graduation_date?: string;
    photo?: string;
    created_at: string;
    updated_at: string;
}

// Academic Types
export interface School {
    id: string;
    name: string;
    code: string;
    description?: string;
    dean?: string;
    department_count: number;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    school: string;
    school_name: string;
    head_of_department?: string;
    description?: string;
    programme_count: number;
    created_at: string;
}

export interface Programme {
    id: string;
    name: string;
    code: string;
    department: string;
    department_name: string;
    school_name?: string;
    programme_type: 'certificate' | 'diploma' | 'bachelors' | 'masters' | 'phd';
    duration_years: number;
    total_credits_required: number;
    description?: string;
    is_active: boolean;
    student_count: number;
    created_at: string;
}

export interface Unit {
    id: string;
    code: string;
    name: string;
    description?: string;
    credit_hours: number;
    unit_type: 'core' | 'elective' | 'common';
    prerequisites?: Unit[];
    recommended_year: number;
    recommended_semester: number;
    is_active: boolean;
    created_at: string;
}

export interface Semester {
    id: string;
    academic_year: string;
    academic_year_name: string;
    name: string;
    semester_type: 'first' | 'second' | 'third' | 'supplementary';
    year: number;
    start_date: string;
    end_date: string;
    registration_deadline?: string;
    marks_submission_deadline?: string;
    is_active: boolean;
    created_at: string;
}

// Grade Types
export interface StudentResult {
    id: string;
    student: string;
    student_name: string;
    student_reg_no: string;
    unit: string;
    unit_code: string;
    unit_name: string;
    semester: string;
    semester_name: string;
    marks: number;
    grade: string;
    grade_points: number;
    credit_attempted: number;
    credit_earned: number;
    status: 'pass' | 'fail' | 'supplementary' | 'incomplete' | 'exempted' | 'withdrawn';
    is_approved: boolean;
    is_repeat: boolean;
    attempt_number: number;
    created_at: string;
    updated_at: string;
}

export interface SemesterAggregate {
    id: string;
    student: string;
    student_name: string;
    student_reg_no: string;
    semester: string;
    semester_name: string;
    total_marks: number;
    units_taken: number;
    term_average: number;
    credits_attempted: number;
    credits_earned: number;
    total_grade_points: number;
    gpa: number;
    units_passed: number;
    units_failed: number;
    created_at: string;
}

export interface CumulativeAggregate {
    id: string;
    student: string;
    student_name: string;
    student_reg_no: string;
    cumulative_marks: number;
    cumulative_units: number;
    cumulative_average: number;
    cumulative_credits_attempted: number;
    cumulative_credits_earned: number;
    cumulative_grade_points: number;
    cgpa: number;
    cumulative_grade: string;
    total_units_passed: number;
    total_units_failed: number;
    created_at: string;
}

// Transcript Types
export interface Transcript {
    id: string;
    transcript_id: string;
    verification_code: string;
    student: string;
    student_name: string;
    student_reg_no: string;
    transcript_type: 'official' | 'unofficial' | 'provisional';
    status: 'draft' | 'generated' | 'issued' | 'revoked';
    from_semester?: string;
    to_semester?: string;
    generated_by?: string;
    generated_by_name?: string;
    generated_at?: string;
    issued_by?: string;
    issued_at?: string;
    pdf_file?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
    count: number;
    total_pages: number;
    current_page: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Dashboard Stats
export interface DashboardStats {
    total_students: number;
    active_students: number;
    total_programmes: number;
    total_units: number;
    transcripts_generated: number;
    pending_requests: number;
}
