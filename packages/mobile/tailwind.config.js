/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary - Sky blue
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0ea5e9',
        },
        // Accent - Indigo (for foreign words)
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#6366f1',
        },
        // Secondary - Violet
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#8b5cf6',
        },
        // Neutral - Slate
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          DEFAULT: '#22c55e',
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#eab308',
          600: '#ca8a04',
          DEFAULT: '#eab308',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          DEFAULT: '#ef4444',
        },
        // Foreign word highlighting
        foreign: {
          text: '#6366f1',
          bg: '#eef2ff',
          border: '#c7d2fe',
          'text-dark': '#818cf8',
          'bg-dark': '#312e81',
        },
        // Sepia theme colors
        sepia: {
          50: '#fefce8',
          100: '#fef3c7',
          200: '#fde68a',
          bg: '#f8f4e9',
          text: '#433422',
          accent: '#b45309',
        },
      },
      fontFamily: {
        // Sans-serif for UI
        sans: ['Inter', 'System', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Serif for reading
        serif: ['Merriweather', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        // Monospace for code
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'reader-xs': ['14px', {lineHeight: '22px'}],
        'reader-sm': ['16px', {lineHeight: '26px'}],
        'reader-base': ['18px', {lineHeight: '30px'}],
        'reader-lg': ['20px', {lineHeight: '34px'}],
        'reader-xl': ['22px', {lineHeight: '36px'}],
        'reader-2xl': ['24px', {lineHeight: '40px'}],
      },
      spacing: {
        'reader-narrow': '16px',
        'reader-normal': '24px',
        'reader-wide': '40px',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
