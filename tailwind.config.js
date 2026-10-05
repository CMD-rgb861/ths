import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            keyframes: {
            rowIn: {
                '0%':   { backgroundColor: 'rgb(254 249 195)', opacity: '0.35', transform: 'translateY(-6px)' },
                '40%':  { backgroundColor: 'rgb(254 249 195)', opacity: '1',    transform: 'translateY(0)' },
                '100%': { backgroundColor: 'transparent',      opacity: '1',    transform: 'translateY(0)' },
            },
            },
            animation: {
            'row-in': 'rowIn 1.8s ease-out',
            },
        },
    },

    plugins: [forms],
};
