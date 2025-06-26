/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        binance: {
          dark: '#0b0e11',
          card: '#1e2329',
          border: '#2b3139',
          yellow: '#f0b90b',
          green: '#0ecb81',
          red: '#f6465d',
          text: '#eaecef',
          muted: '#848e9c'
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}