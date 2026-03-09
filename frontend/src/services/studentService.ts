import api from './api'
import type { Student, SemesterRegistration, ModuleRegistration, UnitRegistration, PaginatedResponse } from '../types'

export interface StudentFilters {
    page?: number
    page_size?: number
    search?: string
    programme?: string
    status?: string
    admission_year?: number
}

export const studentService = {
    getStudents: async (filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> => {
        const params = new URLSearchParams()
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.page_size) params.append('page_size', filters.page_size.toString())
        if (filters.search) params.append('search', filters.search)
        if (filters.programme) params.append('programme', filters.programme)
        if (filters.status) params.append('status', filters.status)
        if (filters.admission_year) params.append('admission_year', filters.admission_year.toString())

        const response = await api.get<PaginatedResponse<Student>>(`/students/?${params}`)
        return response.data
    },

    getStudent: async (id: string): Promise<Student> => {
        const response = await api.get<Student>(`/students/${id}/`)
        return response.data
    },

    createStudent: async (data: Partial<Student>): Promise<Student> => {
        const response = await api.post<Student>('/students/', data)
        return response.data
    },

    updateStudent: async (id: string, data: Partial<Student>): Promise<Student> => {
        const response = await api.patch<Student>(`/students/${id}/`, data)
        return response.data
    },

    deleteStudent: async (id: string): Promise<void> => {
        await api.delete(`/students/${id}/`)
    },

    getStudentResults: async (id: string) => {
        const response = await api.get(`/students/${id}/results/`)
        return response.data
    },

    // Registration endpoints
    getSemesterRegistrations: async (studentId?: string): Promise<SemesterRegistration[]> => {
        const params = studentId ? `?student=${studentId}` : ''
        const response = await api.get<PaginatedResponse<SemesterRegistration>>(`/students/semester-registrations/${params}`)
        return response.data.results || response.data
    },

    getModuleRegistrations: async (studentId?: string): Promise<ModuleRegistration[]> => {
        const params = studentId ? `?student=${studentId}` : ''
        const response = await api.get<PaginatedResponse<ModuleRegistration>>(`/students/module-registrations/${params}`)
        return response.data.results || response.data
    },

    getUnitRegistrations: async (studentId?: string): Promise<UnitRegistration[]> => {
        const params = studentId ? `?student=${studentId}` : ''
        const response = await api.get<PaginatedResponse<UnitRegistration>>(`/students/unit-registrations/${params}`)
        return response.data.results || response.data
    },
}
