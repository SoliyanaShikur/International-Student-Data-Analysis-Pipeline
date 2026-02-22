/**
 * tailwind.config.js — EduScope Terminal Color System
 *
 * Extends Tailwind's defaults with our custom design tokens.
 * These map to the CSS variables defined in index.css so we can use:
 *   bg-terminal-bg, text-terminal-accent, border-terminal-border, etc.
 *
 * PALETTE RATIONALE:
 *   - terminal-bg (#070d12): Deep navy-black — darker than pure black to
 *     prevent eye strain while maintaining terminal authenticity
 *   - terminal-accent (#00b4d8): Cyan — the classic Bloomberg terminal color,
 *     also used in financial data terminals (Reuters, FactSet)
 *   - terminal-amber (#f59e0b): Amber — "Hidden Gem" highlight, creates
 *     strong contrast against the dark palette without being garish
 *   - terminal-border (#1e3a4a): Desaturated teal — visible borders without
 *     visual noise; complements the cyan accent
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:      "#070d12",   // deepest background
          sidebar: "#080f15",   // sidebar surface
          card:    "#0c1820",   // card / panel surface
          accent:  "#00b4d8",   // cyan interactive / highlight
          amber:   "#f59e0b",   // amber — selected / hidden gem
          border:  "#1e3a4a",   // border / divider
          text:    "#c9d6e0",   // default text
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "Courier New", "monospace"],
      },
      animation: {
        // Slow blinking cursor for the status indicator
        "cursor-blink": "cursor-blink 1.2s step-end infinite",
      },
      keyframes: {
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
