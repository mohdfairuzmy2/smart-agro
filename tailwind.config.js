/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        agro: {
          50: '#f1f8ec',
          100: '#dcefca',
          200: '#bce19c',
          300: '#94cf66',
          400: '#6fb83b',
          500: '#4f9a23',
          600: '#3a7b18',
          700: '#2f5f17',
          800: '#284c18',
          900: '#234019',
        },
        soil: {
          400: '#b08968',
          500: '#9c6644',
          600: '#7f5539',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px -2px rgba(35, 64, 25, 0.12)',
        nav: '0 -2px 16px -4px rgba(35, 64, 25, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
