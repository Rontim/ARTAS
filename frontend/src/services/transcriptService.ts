import api from './api'
import type { Transcript, PaginatedResponse } from '../types'

export interface TranscriptFilters {
    page?: number
    student?: string
    transcript_type?: string
    status?: string
}

export const transcriptService = {
    getTranscripts: async (filters: TranscriptFilters = {}): Promise<PaginatedResponse<Transcript>> => {
        const params = new URLSearchParams()
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.student) params.append('student', filters.student)
        if (filters.transcript_type) params.append('transcript_type', filters.transcript_type)
        if (filters.status) params.append('status', filters.status)

        const response = await api.get<PaginatedResponse<Transcript>>(`/transcripts/?${params}`)
        return response.data
    },

    getTranscript: async (id: string): Promise<Transcript> => {
        const response = await api.get<Transcript>(`/transcripts/${id}/`)
        return response.data
    },

    generateTranscript: async (data: {
        student_id: string
        transcript_type: 'official' | 'unofficial' | 'provisional'
        from_semester_id?: string
        to_semester_id?: string
        notes?: string
    }): Promise<Transcript> => {
        const response = await api.post<Transcript>('/transcripts/generate/', data)
        return response.data
    },

    batchGenerateTranscripts: async (data: {
        student_ids: string[]
        transcript_type: 'official' | 'unofficial' | 'provisional'
    }) => {
        const response = await api.post('/transcripts/batch_generate/', data)
        return response.data
    },

    downloadTranscript: async (id: string): Promise<Blob> => {
        const response = await api.get(`/transcripts/${id}/download/`, {
            responseType: 'blob',
        })
        return response.data
    },

    issueTranscript: async (id: string): Promise<Transcript> => {
        const response = await api.post<Transcript>(`/transcripts/${id}/issue/`)
        return response.data
    },

    revokeTranscript: async (id: string, reason: string): Promise<Transcript> => {
        const response = await api.post<Transcript>(`/transcripts/${id}/revoke/`, { reason })
        return response.data
    },

    verifyTranscript: async (code: string) => {
        const response = await api.post('/transcripts/verify/', { code })
        return response.data
    },
}
