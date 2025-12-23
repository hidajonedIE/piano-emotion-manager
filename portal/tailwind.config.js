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
          50: '#f0f9f4',
          100: '#d9f0e3',
          200: '#b6e0cb',
          300: '#86c9ab',
          400: '#54ab85',
          500: '#328f69',
          600: '#237353',
          700: '#1c5c44',
          800: '#194a38',
          900: '#153d2f',
          950: '#0a221a',
        },
        accent: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d9c0',
          300: '#e9be96',
          400: '#de9c69',
          500: '#d5814a',
          600: '#c76a3f',
          700: '#a55336',
          800: '#854432',
          900: '#6c3a2b',
          950: '#3a1c14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
