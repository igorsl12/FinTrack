import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        income: { light: '#EAF3DE', DEFAULT: '#639922', dark: '#3B6D11' },
        expense: { light: '#FCEBEB', DEFAULT: '#E24B4A', dark: '#A32D2D' },
        balance: { light: '#E6F1FB', DEFAULT: '#378ADD', dark: '#185FA5' },
        warning: { light: '#FAEEDA', DEFAULT: '#EF9F27', dark: '#854F0B' },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        app: '0 0 30px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
