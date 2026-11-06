import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

const BACKEND = process.env.BACKEND || 'http://localhost:8080'
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'icons/**/*.png'],
            manifest: {
                name: 'Door Controller',
                short_name: 'Door Control',
                description: 'Control configured doors from your home server.',
                theme_color: '#111318',
                background_color: '#111318',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                lang: 'en',
                icons: [
                    {
                        src: '/icons/android/launchericon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/android/launchericon-192x192-maskable.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/icons/android/launchericon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/android/launchericon-512x512-maskable.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
        }),
    ],
    server: {
        port: 3000,
        proxy: {
            "/doors": BACKEND,
            "/trigger": BACKEND,
            "/auth": BACKEND,
            "/admin": {
                target: BACKEND,
                bypass: (req) => (
                    req.method === "GET" &&
                    (req.url === "/admin" || req.url === "/admin/" || req.url === "/admin/login")
                        ? req.url
                        : undefined
                ),
            },
            "/logout": BACKEND,
            "/login": { target: BACKEND, bypass: (req) => (req.method === "GET" ? req.url : undefined) },
        },
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',

        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/assets/**',
                'src/**/*.css',
                'src/tests/**',
                'src/**/*.d.ts',
                'src/types/**',
                'src/main.tsx',
                'src/App.tsx',
                'src/contexts/Providers.tsx',
                'src/setupTests.ts',
            ],
        },
    },
})
