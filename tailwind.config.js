/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Chakra Petch', 'sans-serif'],
        display: ['Russo One', 'sans-serif'],
      },
      colors: {
        anime: {
          bg: 'var(--ui-bg)',
          primary: 'var(--ui-primary)',
          secondary: 'var(--ui-secondary)',
          cta: 'var(--ui-accent-strong)',
          text: 'var(--ui-text)',
          surface: 'var(--ui-surface)',
          'surface-muted': 'var(--ui-surface-muted)',
          border: 'var(--ui-border)',
        }
      },
      boxShadow: {
        'neon-primary': '0 0 10px rgba(220, 38, 38, 0.5), 0 0 20px rgba(220, 38, 38, 0.3)',
        'neon-secondary': '0 0 10px rgba(234, 179, 8, 0.5), 0 0 20px rgba(234, 179, 8, 0.3)',
      }
    },
  },
  plugins: [],
}
