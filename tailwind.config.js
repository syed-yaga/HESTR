/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/ui/**/*.{js,ts,jsx,tsx}',
    './src/ui/index.html'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#090d16',
        'obsidian-light': '#0f172a',
        'obsidian-card': '#111827',
        'hud-cyan': '#38bdf8',
        'hud-amber': '#f59e0b',
        'hud-red': '#ef4444',
        'hud-green': '#22c55e',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
