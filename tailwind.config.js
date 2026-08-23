/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sidebar-bg': '#0B2A4A',
        'sidebar-active': '#1B4B82',
        'sidebar-text': '#C9D6E5',
        'sidebar-text-active': '#FFFFFF',
        primary: {
          DEFAULT: 'var(--color-primary, #123C73)',
          hover: 'var(--color-primary-hover, #0e2f5c)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #1B4B82)',
        },
        'page-bg': '#F4F6F9',
        'card-bg': '#FFFFFF',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        purple: '#8B5CF6',
        neutralDot: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
