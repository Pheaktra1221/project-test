/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Battambang', 'system-ui', 'sans-serif'],
        moul: ['Moul', 'serif'],
        battambang: ['Battambang', 'sans-serif'],
      }
    },
  },
  plugins: [],
};