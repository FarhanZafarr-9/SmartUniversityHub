/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode palette
        light: {
          DEFAULT: '#F9FAFB',
          'light-card': '#FFFFFF',
          'glassy': '#F3F4F6',
          'semi-light': '#F3F4F6',
          'accent': '#6366F1',
          'hover': '#E5E7EB',
          'text': '#111827',
          'border': '#D1D5DB',
        },

        // Dark mode palette
        dark: {
          DEFAULT: '#121212',
          'dark-card': '#161616',
          'glassy':'#282828',
          'semi-dark': '#212121',
          'accent': '#fff',
          'accent-light': '#dcdcdc',
          'hover': '#3B3B3B',
          'text': '#F9FAFB',
          'border': '#4B5563',
        },
        customGray: '#222222',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.rounded-tbr-3xl': {
          'border-top-right-radius': '1.5rem',
          'border-bottom-right-radius': '1.5rem',
        }
      }, ['responsive', 'hover']);
    },
    require('tailwindcss/nesting'),
    require('autoprefixer'),
  ],
}

