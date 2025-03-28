/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        note: {
          pink: { light: '#ffd6e6', dark: '#4a1528' },
          purple: { light: '#e6d6ff', dark: '#2d1445' },
          blue: { light: '#d6e6ff', dark: '#1a2f4d' },
          green: { light: '#d6ffe6', dark: '#14452d' },
          yellow: { light: '#fff2d6', dark: '#453314' },
          orange: { light: '#ffe6d6', dark: '#45291a' }
        }
      }
    },
  },
  safelist: [
    {
      pattern: /bg-note-(pink|purple|blue|green|yellow|orange)-(light|dark)/,
    },
  ],
  plugins: [],
};