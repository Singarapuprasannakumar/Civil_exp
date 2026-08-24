/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#0F172A',
          border: '#1E293B',
          hover: '#1E293B',
          active: '#2563EB',
          text: '#94A3B8'
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          border: '#BFDBFE'
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          text: '#059669'
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          text: '#D97706'
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          text: '#DC2626'
        },
        purple: {
          DEFAULT: '#7C3AED',
          light: '#F3E8FF',
          text: '#6D28D9'
        },
        teal: {
          DEFAULT: '#14B8A6',
          light: '#CCFBF1',
          text: '#0D9488'
        },
        bgmain: '#F8FAFC',
        surface: '#FFFFFF',
        bordercol: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#64748B'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 12px 30px -4px rgba(37, 99, 235, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
