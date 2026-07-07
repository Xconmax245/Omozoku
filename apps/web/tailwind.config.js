/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0A0A0C',
        'bg-surface': '#17171B',
        'bg-elevated': '#1F1F24',
        'border-subtle': '#2A2A2F',
        'text-primary': '#F5F5F7',
        'text-secondary': '#9A9AA2',
        accent: '#FF2D55',
        'score-green': '#3DD68C',
        'score-amber': '#F5B942',
        'score-red': '#C9525F',
      },
      borderRadius: {
        card: '12px',
        pill: '999px',
      },
      fontFamily: {
        body: ['Supreme', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      aspectRatio: {
        poster: '2 / 3',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
