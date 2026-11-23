/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F7FC',
          100: '#E6EAF2',
          500: '#6B7FEA',
          600: '#3157D5',
          700: '#2545B8',
          dark: '#20263A',
          muted: '#758096'
        }
      }
    },
  },
  plugins: [],
}
