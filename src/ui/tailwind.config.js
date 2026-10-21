/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html'
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
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beam-flow': 'beamFlow 1.2s ease-in-out infinite',
      },
      keyframes: {
        beamFlow: {
          '0%': { transform: 'translateX(-100%)', opacity: '0.2' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0.2' }
        }
      }
    },
  },
  plugins: [],
}
