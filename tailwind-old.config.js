// tailwind.config.js
const colors = require('tailwindcss/colors')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        violet: {
          50:  '#F0EEFF',
          100: '#DDD8FA',
          200: '#BEB5F5',
          400: '#7B6EE8',
          600: '#4B3FC0',
          800: '#2E1F7A',
          900: '#1A1148',
          DEFAULT: '#7B6EE8',
        },
        neutral: {
          50:  '#FAFAF8',  // nieve
          100: '#F3F2EE',  // crema
          200: '#E5E3DC',  // niebla
          400: '#8C8B85',  // humo
          900: '#3B3B38',  // carbón
          dark: {
            50:  '#191918',
            100: '#222220',
            200: '#333330',
            400: '#706F6A',
            900: '#E5E3DC',
          },
        },
        lavanda: {
          light: '#EBE9FB',
          DEFAULT: '#4B3FA0',
          dark: '#2A2450',
        },
        durazno: {
          light: '#FAE9E2',
          DEFAULT: '#8B3A20',
          dark: '#3D1E12',
        },
        menta: {
          light: '#E3F5EC',
          DEFAULT: '#1A5E3A',
          dark: '#102A1D',
        },
        rosa: {
          light: '#FAECF2',
          DEFAULT: '#8B2B55',
          dark: '#391222',
        },
        celeste: {
          light: '#E4F0FB',
          DEFAULT: '#1A4A7A',
          dark: '#0F2540',
        },
        ambar: {
          light: '#FDF0DC',
          DEFAULT: '#7A4A10',
          dark: '#3A250A',
        },
      },
    },
  },
  plugins: [],
}