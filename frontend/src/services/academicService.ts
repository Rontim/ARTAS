import api from './api'
import type { School, Department, Programme, Unit, Semester, Module, ProgrammeUnit, SemesterUnit, PaginatedResponse } from '../types'

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

    deleteProgramme: async (id: string): Promise<void> => {
        await api.delete(`/academics/programmes/${id}/`)
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

    deleteUnit: async (id: string): Promise<void> => {
        await api.delete(`/academics/units/${id}/`)
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

    updateSemester: async (id: string, data: Partial<Semester>): Promise<Semester> => {
        const response = await api.patch<Semester>(`/academics/semesters/${id}/`, data)
        return response.data
    },

    deleteSemester: async (id: string): Promise<void> => {
        await api.delete(`/academics/semesters/${id}/`)
    },

    // Modules
    getModules: async (programmeId?: string): Promise<Module[]> => {
        const params = programmeId ? `?programme=${programmeId}` : ''
        const response = await api.get<PaginatedResponse<Module>>(`/academics/modules/${params}`)
        return response.data.results || response.data
    },

    createModule: async (data: Partial<Module>): Promise<Module> => {
        const response = await api.post<Module>('/academics/modules/', data)
        return response.data
    },

    updateModule: async (id: string, data: Partial<Module>): Promise<Module> => {
        const response = await api.patch<Module>(`/academics/modules/${id}/`, data)
        return response.data
    },

    deleteModule: async (id: string): Promise<void> => {
        await api.delete(`/academics/modules/${id}/`)
    },

    // Academic Years
    getAcademicYears: async () => {
        const response = await api.get('/academics/academic-years/')
        return response.data.results || response.data
    },

    // Programme Units (curriculum)
    getProgrammeUnits: async (programmeId?: string): Promise<ProgrammeUnit[]> => {
        const params = programmeId ? `?programme=${programmeId}` : ''
        const response = await api.get<PaginatedResponse<ProgrammeUnit>>(`/academics/programme-units/${params}`)
        return response.data.results || response.data
    },

    createProgrammeUnit: async (data: Partial<ProgrammeUnit>): Promise<ProgrammeUnit> => {
        const response = await api.post<ProgrammeUnit>('/academics/programme-units/', data)
        return response.data
    },

    updateProgrammeUnit: async (id: string, data: Partial<ProgrammeUnit>): Promise<ProgrammeUnit> => {
        const response = await api.patch<ProgrammeUnit>(`/academics/programme-units/${id}/`, data)
        return response.data
    },

    deleteProgrammeUnit: async (id: string): Promise<void> => {
        await api.delete(`/academics/programme-units/${id}/`)
    },

    // Semester Units (offerings)
    getSemesterUnits: async (semesterId?: string, programmeId?: string, pageSize = 50): Promise<SemesterUnit[]> => {
        const params = new URLSearchParams()
        if (semesterId) params.append('semester', semesterId)
        if (programmeId) params.append('programme', programmeId)
        params.append('page_size', String(pageSize))
        const response = await api.get<PaginatedResponse<SemesterUnit>>(`/academics/semester-units/?${params}`)
        return response.data.results || response.data
    },

    createSemesterUnit: async (data: Partial<SemesterUnit>): Promise<SemesterUnit> => {
        const response = await api.post<SemesterUnit>('/academics/semester-units/', data)
        return response.data
    },

    deleteSemesterUnit: async (id: string): Promise<void> => {
        await api.delete(`/academics/semester-units/${id}/`)
    },

    bulkCreateSemesterUnits: async (data: {
        semester: string
        programme: string
        year_of_study?: number
        semester_number?: number
    }): Promise<{ message: string; created_count: number; skipped_count: number }> => {
        const response = await api.post('/academics/semester-units/bulk_create_from_curriculum/', data)
        return response.data
    },
}
