/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff9ed',
          100: '#fff1d4',
          200: '#ffdfa9',
          300: '#ffc873',
          400: '#ffa735',
          500: '#ff8a05',
          600: '#f06e00',
          700: '#c75302',
          800: '#9e410a',
          900: '#7f370d',
          950: '#451a04',
        },
        spiritual: {
          cream: '#FCFAEE',
          yellow: '#F9E400',
          orange: '#FF8A08',
          red: '#FFA559',
          brown: '#8B4513',
          darkbrown: '#5D2E0C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'elegant': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
