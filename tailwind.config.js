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
        campus: {
          bg: '#020B1A',
          sidebar: '#061329',
          card: '#071B35',
          cardHover: '#0A2445',
          border: '#17365C',
          borderHover: '#00D9FF',
          cyan: '#00D9FF',
          blue: '#087BFF',
          violet: '#713CFF',
          magenta: '#F02E91',
          teal: '#00D6B5',
          amber: '#F59E0B',
          text: '#F4F7FF',
          textMuted: '#9BAFCB',
          surface: '#0B2144',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -4px rgba(0, 217, 255, 0.35)',
        'glow-blue': '0 0 25px -4px rgba(8, 123, 255, 0.35)',
        'glow-violet': '0 0 25px -4px rgba(113, 60, 255, 0.35)',
        'glow-magenta': '0 0 25px -4px rgba(240, 46, 145, 0.35)',
        'glow-teal': '0 0 25px -4px rgba(0, 214, 181, 0.35)',
        'active-nav': '0 0 20px 0 rgba(8, 123, 255, 0.45)',
        'card-glow': '0 8px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
