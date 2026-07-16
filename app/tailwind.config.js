/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0E1420',
        panel: '#16202F',
        panel2: '#1C2C42',
        border: 'rgba(255,255,255,0.08)',
        muted: '#7E93AC',
        accent: '#4C8FE0',
        teal: '#4FB2A0',
        coral: '#E2665A',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
