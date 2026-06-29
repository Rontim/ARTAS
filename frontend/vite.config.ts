import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        watch: {
            usePolling: true,
            ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.pnpm-store/**'],
        },
        proxy: {
            '/api': {
                target: process.env.VITE_API_TARGET || 'http://localhost:8001',
                changeOrigin: true,
            },
        },
    },
})