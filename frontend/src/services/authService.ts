import api from './api'
import type { LoginCredentials, AuthResponse, User } from '../types'

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login/', credentials)
        return response.data
    },

    logout: async (refreshToken: string): Promise<void> => {
        await api.post('/auth/logout/', { refresh: refreshToken })
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/auth/users/me/')
        return response.data
    },

    changePassword: async (data: {
        old_password: string
        new_password: string
        new_password_confirm: string
    }): Promise<void> => {
        await api.post('/auth/users/change_password/', data)
    },
}
