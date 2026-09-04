/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        command: {
          bg: "#070a12",
          surface: "#0d1322",
          card: "#121a2d",
          border: "#1e2942",
          subtle: "#182238"
        },
        tier1: {
          DEFAULT: "#38bdf8",
          glow: "rgba(56, 189, 248, 0.25)",
          text: "#7dd3fc"
        },
        tier2: {
          DEFAULT: "#10b981",
          glow: "rgba(16, 185, 129, 0.25)",
          text: "#6ee7b7"
        },
        primary: {
          DEFAULT: "#38bdf8",
          foreground: "#070a12",
        },
        secondary: {
          DEFAULT: "#818cf8",
          foreground: "#070a12",
        },
        card: {
          DEFAULT: "#0d1322",
          foreground: "#f8fafc",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        }
      },
      fontFamily: {
        sans: ['Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', 'Geneva', 'Verdana', 'sans-serif'],
        outfit: ['Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', 'sans-serif'],
        display: ['Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', 'Geneva', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(56, 189, 248, 0.15)',
        'glow-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
}
