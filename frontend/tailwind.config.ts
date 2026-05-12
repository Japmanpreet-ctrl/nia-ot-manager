import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          dark: '#0F766E'
        }
      },
      boxShadow: {
        clinical: '0 20px 50px -24px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
} satisfies Config;
