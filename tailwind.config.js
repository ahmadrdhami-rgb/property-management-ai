/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0f1117',
          800: '#1a1d27',
          700: '#1e2130',
          600: '#2a2d3a',
        }
      }
    },
  },
  plugins: [],
}
