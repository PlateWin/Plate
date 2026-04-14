/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Dream Flow Healing Palette
        aurora: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4c8ff',
          300: '#b49dff',
          400: '#9370ff',
          500: '#7c4dff',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0f7a',
        },
        dawn: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3fe',
          300: '#93d3fd',
          400: '#60bbfa',
          500: '#3b9ff5',
          600: '#2582ea',
          700: '#1d6bd7',
          800: '#1e57ae',
          900: '#1e4a89',
        },
        healing: {
          50:  '#f0fdf8',
          100: '#ccfbeb',
          200: '#9af5d8',
          300: '#5fe8c1',
          400: '#2dd3a8',
          500: '#14b890',
          600: '#099575',
          700: '#087761',
          800: '#095e4e',
          900: '#084d42',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
