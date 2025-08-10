import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "resources/ts"),
        },
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            clientPort: 5173,
            host: 'localhost',
        }
    },
    plugins: [
        tailwindcss(),
        react(),
        laravel({
            input: [
                'resources/ts/main.tsx',
                'resources/ts/globals.css',
            ],
            refresh: true,
        }),
    ],
});
