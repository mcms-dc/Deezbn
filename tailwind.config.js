/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deriv: {
          bg: '#0e1117',
          card: '#1a1d26',
          accent: '#ff444f', // Deriv Red
          success: '#00c853',
          text: '#ffffff',
          muted: '#9ca3af',
        }
      }
    },
  },
  plugins: [],
}
