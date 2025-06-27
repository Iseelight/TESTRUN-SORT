/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'navy-blue': '#0a2463',
      },
      animation: {
        'bounce': 'bounce 1.4s infinite',
      }
    },
  },
  plugins: [],
};