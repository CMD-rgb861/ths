/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        background: "#f8fafc",
        border: "#e5e7eb",

        text: {
          primary: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
        },

        brand: {
          primary: "#1e40af",
          soft: "#dbeafe",
        },

        status: {
          pending: "#f59e0b",
          ongoing: "#3b82f6",
          completed: "#16a34a",
          cancelled: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
