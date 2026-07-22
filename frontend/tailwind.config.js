/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          bg: '#0A0A0A',
          panel: '#141414',
          border: '#262626',
          text: '#FAFAFA',
          muted: '#A1A1AA',
          accent: '#22C55E',       // green for safe/active
          danger: '#EF4444',       // freeze / danger
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
