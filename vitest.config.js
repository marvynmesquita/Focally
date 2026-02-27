import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./tests/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.config.js',
                'src/main.jsx',
                'src/components/InstallPrompt.jsx'
            ],
            thresholds: {
                statements: 80,
                branches: 75,
                functions: 80,
                lines: 80
            }
        }
    }
})
