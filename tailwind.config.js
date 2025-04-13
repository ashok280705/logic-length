/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float-slow': 'float-slow 15s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'rotate': 'rotate 4s linear infinite',
        'tilt': 'tilt 10s infinite linear',
        'gradient-x': 'gradient-x 3s ease infinite',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.4' },
          '25%': { transform: 'translateY(-30px) translateX(15px)', opacity: '0.8' },
          '50%': { transform: 'translateY(-15px) translateX(30px)', opacity: '0.6' },
          '75%': { transform: 'translateY(-25px) translateX(-15px)', opacity: '0.7' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          'from': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.3), 0 0 10px rgba(139, 92, 246, 0.3)' },
          'to': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.4)' },
        },
        'rotate': {
          '100%': { transform: 'rotate(1turn)' },
        },
        'tilt': {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(0.5deg)',
          },
          '75%': {
            transform: 'rotate(-0.5deg)',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      }
    },
  },
  plugins: [],
} 