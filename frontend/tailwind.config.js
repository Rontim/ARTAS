/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0f7f4',
          100: '#d4edda',
          200: '#a7d4b5',
          300: '#74bb90',
          400: '#4da574',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#1a472a',
          800: '#133521',
          900: '#0a2116',
          950: '#051209',
        },
        gold: {
          100: '#fef3c7',
          200: '#fde68a',
          400: '#f5c842',
          500: '#c8922a',
          600: '#a87820',
          700: '#8a6119',
        },
      },
    },
  },
  plugins: [],
};
