/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'xl': '1rem', // 16px
        '2xl': '1.5rem', // 24px - as per GEMINI.md requirement
        '3xl': '2rem',
      },
      colors: {
        // Có thể thêm màu custom ở đây sau
      }
    },
  },
  plugins: [],
}
