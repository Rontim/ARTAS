import api from './api'
import type { School, Department, Programme, Unit, Semester, PaginatedResponse } from '../types'

export const academicService = {
    // Schools
    getSchools: async (): Promise<School[]> => {
        const response = await api.get<PaginatedResponse<School>>('/academics/schools/')
        return response.data.results || response.data
    },

    getSchool: async (id: string): Promise<School> => {
        const response = await api.get<School>(`/academics/schools/${id}/`)
        return response.data
    },

    createSchool: async (data: Partial<School>): Promise<School> => {
        const response = await api.post<School>('/academics/schools/', data)
        return response.data
    },

    // Departments
    getDepartments: async (schoolId?: string): Promise<Department[]> => {
        const params = schoolId ? `?school=${schoolId}` : ''
        const response = await api.get<PaginatedResponse<Department>>(`/academics/departments/${params}`)
        return response.data.results || response.data
    },

    getDepartment: async (id: string): Promise<Department> => {
        const response = await api.get<Department>(`/academics/departments/${id}/`)
        return response.data
    },

    // Programmes
    getProgrammes: async (departmentId?: string): Promise<Programme[]> => {
        const params = departmentId ? `?department=${departmentId}` : ''
        const response = await api.get<PaginatedResponse<Programme>>(`/academics/programmes/${params}`)
        return response.data.results || response.data
    },

    getProgramme: async (id: string): Promise<Programme> => {
        const response = await api.get<Programme>(`/academics/programmes/${id}/`)
        return response.data
    },

    createProgramme: async (data: Partial<Programme>): Promise<Programme> => {
        const response = await api.post<Programme>('/academics/programmes/', data)
        return response.data
    },

    updateProgramme: async (id: string, data: Partial<Programme>): Promise<Programme> => {
        const response = await api.patch<Programme>(`/academics/programmes/${id}/`, data)
        return response.data
    },

    getProgrammeCurriculum: async (id: string) => {
        const response = await api.get(`/academics/programmes/${id}/curriculum/`)
        return response.data
    },

    // Units
    getUnits: async (): Promise<Unit[]> => {
        const response = await api.get<PaginatedResponse<Unit>>('/academics/units/')
        return response.data.results || response.data
    },

    getUnit: async (id: string): Promise<Unit> => {
        const response = await api.get<Unit>(`/academics/units/${id}/`)
        return response.data
    },

    createUnit: async (data: Partial<Unit>): Promise<Unit> => {
        const response = await api.post<Unit>('/academics/units/', data)
        return response.data
    },

    updateUnit: async (id: string, data: Partial<Unit>): Promise<Unit> => {
        const response = await api.patch<Unit>(`/academics/units/${id}/`, data)
        return response.data
    },

    // Semesters
    getSemesters: async (): Promise<Semester[]> => {
        const response = await api.get<PaginatedResponse<Semester>>('/academics/semesters/')
        return response.data.results || response.data
    },

    getSemester: async (id: string): Promise<Semester> => {
        const response = await api.get<Semester>(`/academics/semesters/${id}/`)
        return response.data
    },

    getCurrentSemester: async (): Promise<Semester> => {
        const response = await api.get<Semester>('/academics/semesters/current/')
        return response.data
    },

    createSemester: async (data: Partial<Semester>): Promise<Semester> => {
        const response = await api.post<Semester>('/academics/semesters/', data)
        return response.data
    },
}
