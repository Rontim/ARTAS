import api from './api'
import type { DashboardStats, ActivityLog, DashboardExtended, PaginatedResponse } from '../types'

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get<DashboardStats>('/dashboard/stats/')
        return response.data
    },

    getExtendedStats: async (): Promise<DashboardExtended> => {
        const response = await api.get<DashboardExtended>('/dashboard/extended/')
        return response.data
    },

    getActivities: async (params: {
        page?: number
        page_size?: number
        action?: string
        entity_type?: string
    } = {}): Promise<PaginatedResponse<ActivityLog>> => {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.append('page', params.page.toString())
        if (params.page_size) searchParams.append('page_size', params.page_size.toString())
        if (params.action) searchParams.append('action', params.action)
        if (params.entity_type) searchParams.append('entity_type', params.entity_type)

        const response = await api.get<PaginatedResponse<ActivityLog>>(
            `/activities/?${searchParams}`
        )
        return response.data
    },
}
