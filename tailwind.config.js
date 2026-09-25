/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        astemo: {
          red: '#B70014',
          'red-dark': '#8A000F',
          green: '#00A854',
          'green-light': '#EAF8F1',
          'green-dark': '#008C45',
          dark: '#1E232F',
          gray: '#667085',
          border: '#E4E7EC',
          bg: '#F8F9FC',
          card: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
