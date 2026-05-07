/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        bard: {
          red: '#ff2d55',
          blue: '#0a84ff',
          dark: '#0d0d0f',
          card: '#141418',
          border: '#2a2a35',
          gold: '#ffd60a',
        },
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.4s ease',
      },
      keyframes: {
        'pulse-red': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
