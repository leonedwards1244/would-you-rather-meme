/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Bangers', 'Impact', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: { 950: '#05060f', 900: '#0a0d1f', 800: '#11152e', 700: '#1a2042' },
        neon: { pink: '#ff2e97', green: '#39ff88', cyan: '#22e4ff', yellow: '#ffe14d' },
      },
      boxShadow: {
        'glow-pink': '0 0 24px rgba(255,46,151,.55), 0 0 64px rgba(255,46,151,.25)',
        'glow-cyan': '0 0 24px rgba(34,228,255,.55), 0 0 64px rgba(34,228,255,.25)',
        'glow-green': '0 0 24px rgba(57,255,136,.55), 0 0 64px rgba(57,255,136,.25)',
      },
      keyframes: {
        flip: { '0%,70%': { transform: 'rotateY(0)' }, '85%': { transform: 'rotateY(180deg)' }, '100%': { transform: 'rotateY(360deg)' } },
        floaty: { '0%': { transform: 'translateY(0) rotate(0)' }, '100%': { transform: 'translateY(-120vh) rotate(360deg)' } },
        pulseGlow: { '0%,100%': { opacity: 1 }, '50%': { opacity: .55 } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        flip: 'flip 4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
