/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1E40AF',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
        },
        navy: {
          DEFAULT: '#0F172A',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        surface: '#FFFFFF',
        border: '#E2E8F0',
      },
      fontFamily: {
        arabic: ['Cairo-Regular', 'sans-serif'],
        'cairo-semibold': ['Cairo-SemiBold', 'sans-serif'],
        'cairo-bold': ['Cairo-Bold', 'sans-serif'],
        'cairo-black': ['Cairo-Black', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
