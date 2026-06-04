import api from './api'
import type { StudentResult, SemesterAggregate, ModuleAggregate, CumulativeAggregate, PaginatedResponse } from '../types'

export interface ResultFilters {
    page?: number
    student?: string
    unit?: string
    semester?: string
    status?: string
}

export interface BulkMarksEntry {
    unit_id: string
    semester_id?: string
    module_id?: string
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
        unit_registration: string
        marks: number
        credit_attempted: number
        is_repeat?: boolean
        attempt_number?: number
        force_aggregate?: boolean
    }): Promise<StudentResult> => {
        const response = await api.post<StudentResult>('/grades/results/', data)
        return response.data
    },

    updateResult: async (id: string, data: Partial<StudentResult> & { force_aggregate?: boolean }): Promise<StudentResult> => {
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

    getModuleAggregates: async (studentId?: string): Promise<ModuleAggregate[]> => {
        const params = studentId ? `?student=${studentId}` : ''
        const response = await api.get<PaginatedResponse<ModuleAggregate>>(`/grades/module-aggregates/${params}`)
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

    getStudentSemesterAggregate: async (studentId: string, semesterId: string): Promise<SemesterAggregate | null> => {
        const response = await api.get<PaginatedResponse<SemesterAggregate>>(
            `/grades/semester-aggregates/?student=${studentId}&semester=${semesterId}`
        )
        const results = response.data.results || response.data
        return results[0] || null
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
