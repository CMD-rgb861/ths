import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    resolve: {
        alias: [
            {
                find: '@/Components',
                replacement: fileURLToPath(new URL('./resources/js/components/ui', import.meta.url)),
            },
            {
                find: '@',
                replacement: fileURLToPath(new URL('./resources/js', import.meta.url)),
            },
        ],
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
