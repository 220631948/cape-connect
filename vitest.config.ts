/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        exclude: [
            '**/node_modules/**',
            '**/.next/**',
            '**/.next_*/**',
            '**/.next_build_antigravity/**',
            '**/.gemini/**',
            'src/__tests__/e2e/**',
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
