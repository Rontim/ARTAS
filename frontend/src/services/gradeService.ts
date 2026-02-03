import api from './api'
import type { StudentResult, SemesterAggregate, CumulativeAggregate, PaginatedResponse } from '../types'

export interface ResultFilters {
    page?: number
    student?: string
    unit?: string
    semester?: string
    status?: string
}

export interface BulkMarksEntry {
    unit_id: string
    semester_id: string
    results: {
        reg_no: string
        marks: number
        credit_attempted?: number
        is_repeat?: boolean
        attempt_number?: number
    }[]
}

export const gradeService = {
    // Results
    getResults: async (filters: ResultFilters = {}): Promise<PaginatedResponse<StudentResult>> => {
        const params = new URLSearchParams()
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.student) params.append('student', filters.student)
        if (filters.unit) params.append('unit', filters.unit)
        if (filters.semester) params.append('semester', filters.semester)
        if (filters.status) params.append('status', filters.status)

        const response = await api.get<PaginatedResponse<StudentResult>>(`/grades/results/?${params}`)
        return response.data
    },

    createResult: async (data: {
        student: string
        unit: string
        semester: string
        marks: number
        credit_attempted: number
        is_repeat?: boolean
        attempt_number?: number
    }): Promise<StudentResult> => {
        const response = await api.post<StudentResult>('/grades/results/', data)
        return response.data
    },

    updateResult: async (id: string, data: Partial<StudentResult>): Promise<StudentResult> => {
        const response = await api.patch<StudentResult>(`/grades/results/${id}/`, data)
        return response.data
    },

    bulkEntryMarks: async (data: BulkMarksEntry) => {
        const response = await api.post('/grades/results/bulk_entry/', data)
        return response.data
    },

    approveResults: async (resultIds: string[]) => {
        const response = await api.post('/grades/results/approve_results/', { result_ids: resultIds })
        return response.data
    },

    // Aggregates
    getSemesterAggregates: async (studentId?: string): Promise<SemesterAggregate[]> => {
        const params = studentId ? `?student=${studentId}` : ''
        const response = await api.get<PaginatedResponse<SemesterAggregate>>(`/grades/semester-aggregates/${params}`)
        return response.data.results || response.data
    },

    getCumulativeAggregates: async (studentId?: string): Promise<CumulativeAggregate[]> => {
        const params = studentId ? `?student=${studentId}` : ''
        const response = await api.get<PaginatedResponse<CumulativeAggregate>>(`/grades/cumulative-aggregates/${params}`)
        return response.data.results || response.data
    },

    getStudentCumulative: async (studentId: string): Promise<CumulativeAggregate> => {
        const response = await api.get<PaginatedResponse<CumulativeAggregate>>(`/grades/cumulative-aggregates/?student=${studentId}`)
        return response.data.results[0]
    },

    // Recompute
    recomputeGrades: async (data: {
        student_id?: string
        semester_id?: string
        programme_id?: string
    }) => {
        const response = await api.post('/grades/recompute/', data)
        return response.data
    },

    // Grading Scales
    getGradingScales: async () => {
        const response = await api.get('/grades/scales/')
        return response.data
    },

    getDefaultGradingScale: async () => {
        const response = await api.get('/grades/scales/default/')
        return response.data
    },
}
