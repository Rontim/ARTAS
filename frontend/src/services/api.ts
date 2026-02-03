import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState()
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const { refreshToken, logout, setAuth } = useAuthStore.getState()

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    })

                    const { access } = response.data
                    const { user } = useAuthStore.getState()

                    if (user) {
                        setAuth(user, access, refreshToken)
                    }

                    originalRequest.headers.Authorization = `Bearer ${access}`
                    return api(originalRequest)
                } catch {
                    logout()
                    window.location.href = '/login'
                }
            } else {
                logout()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
