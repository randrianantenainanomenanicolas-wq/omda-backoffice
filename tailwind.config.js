/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Palette officielle OMDA, identique à l'application mobile (src/theme/colors.ts)
        omda: {
          green: '#2E7A46', greenDark: '#205C35', forest: '#173D27', ochre: '#C79A3B', ochreDark: '#A87E2C',
          black: '#1A1A1A', white: '#FFFFFF', warmGray: '#F5F4EF', borderGray: '#DDD9CE',
          textGray: '#6B675E', errorRed: '#B3261E', infoBlueGray: '#2E4A66',
        },
      },
      keyframes: {
        progress: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(400%)' } },
      },
      animation: { progress: 'progress 1.1s ease-in-out infinite' },
      boxShadow: {
        card: '0 1px 2px rgba(26, 26, 26, 0.04)',
      },
    },
  },
  plugins: [],
};
