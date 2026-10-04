import type { Config } from 'tailwindcss';

/** Palette lifted from the Nbryo / Cattlytics reference screens. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2F9461',
          dark: '#247A4E',
          light: '#EAF4EE',
        },
        ink: {
          DEFAULT: '#1B2430',
          soft: '#5F6B7A',
          muted: '#9AA3AF',
        },
        canvas: '#F3F5FB',
        line: '#E7EAF1',
        zebra: '#FAFBFE',
        head: '#F6F8FC',
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        menu: '0 8px 24px rgba(16, 24, 40, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
