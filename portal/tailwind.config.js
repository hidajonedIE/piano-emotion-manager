/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#003a8c',
          600: '#00398c',
          700: '#002d6b',
          800: '#00214a',
          900: '#001529',
          950: '#000d14',
        },
        accent: {
          50: '#fef5f1',
          100: '#fde9e0',
          200: '#fbd3c1',
          300: '#f8b8a2',
          400: '#f59d83',
          500: '#e07a5f',
          600: '#d1704f',
          700: '#b85c3f',
          800: '#9f4830',
          900: '#863420',
          950: '#6d2010',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Arkhip', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    'font-serif',
    'font-sans',
  ],
}
