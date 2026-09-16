/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        chat: {
          dark: {
            bg: '#0a0814',
            surface: '#120f22',
            card: '#1a162f',
            border: '#2a2249',
            bubbleSelf: '#9333ea',
            bubbleOther: '#19152b',
            text: '#f3f4f6',
            muted: '#94a3b8',
          },
          light: {
            bg: '#faf8fd',
            surface: '#ffffff',
            card: '#f4effa',
            border: '#e8e0f3',
            bubbleSelf: '#9333ea',
            bubbleOther: '#f3eef9',
            text: '#0f172a',
            muted: '#64748b',
          }
        }
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' }
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 1.2s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
