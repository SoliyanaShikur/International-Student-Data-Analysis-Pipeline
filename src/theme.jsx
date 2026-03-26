/**
 * theme.js — Light / Dark theme token system
 *
 * All colors referenced by components come from here.
 * Switching theme = swapping this object. No CSS variables, no Tailwind —
 * pure JS objects passed via React context so every component re-renders.
 *
 * Usage:
 *   import { useTheme } from "../theme";
 *   const { t } = useTheme();
 *   <div style={{ background: t.bg, color: t.text }}>
 */

import { createContext, useContext, useState } from "react";

// ── Light theme — cream/white, ink text, cyan+amber accents ──────────────────
export const LIGHT = {
  name: "light",

  // Backgrounds
  bg:          "#f5f2eb",   // warm cream page background
  bgSidebar:   "#ede9e0",   // slightly darker cream for sidebar
  bgCard:      "#faf8f3",   // near-white card surface
  bgCardAlt:   "#f0ece2",   // alternate card (selected state)
  bgTopbar:    "#ffffff",   // clean white topbar
  bgInput:     "#ffffff",

  // Text
  text:        "#1a1a1a",   // near-black body text
  textMuted:   "#31312b",   // muted labels
  textFaint:   "#a28c21",   // very faint — min/max labels
  textAccent:  "#0097b8",   // cyan (slightly darkened for light bg contrast)

  // Borders
  border:      "#d8d2c4",   // warm grey border
  borderLight: "#e8e4db",   // very subtle divider

  // Accents (same hues, slightly adjusted for light bg)
  accent:      "#0097b8",   // cyan
  amber:       "#d97706",   // amber (darkened for readability)
  green:       "#16a34a",
  red:         "#dc2626",

  // Chart / D3
  gridLine:    "#e0dbd0",
  axisText:    "#8a8779",
  dotBelow:    "#c4bfb0",   // "below avg" dots — visible on light bg
  mapBase:     "#e0dbd0",   // state fill when no data
  mapBorder:   "#c8c2b4",

  // Scatter zone
  gemZoneFill: "rgba(217,119,6,0.05)",
  gemZoneStroke: "rgba(217,119,6,0.2)",
};

// ── Dark theme — deep navy terminal ──────────────────────────────────────────
export const DARK = {
  name: "dark",

  bg:          "#070d12",
  bgSidebar:   "#080f15",
  bgCard:      "#0c1820",
  bgCardAlt:   "#0f2030",
  bgTopbar:    "#040a0f",
  bgInput:     "#0c1820",

  text:        "#c9d6e0",
  textMuted:   "#6b7280",
  textFaint:   "#7381da",
  textAccent:  "#00b4d8",

  border:      "#1e3a4a",
  borderLight: "#111e2a",

  accent:      "#00b4d8",
  amber:       "#f59e0b",
  green:       "#22c55e",
  red:         "#dc2626",

  gridLine:    "#1a2d3d",
  axisText:    "#4b5563",
  dotBelow:    "#374151",
  mapBase:     "#0d1117",
  mapBorder:   "#1e3a4a",

  gemZoneFill: "rgba(245,158,11,0.03)",
  gemZoneStroke: "rgba(245,158,11,0.15)",
};

// ── React context ─────────────────────────────────────────────────────────────
const ThemeContext = createContext({ theme: LIGHT, toggle: () => {} });

export function ThemeProvider({ children }) {
  // Light mode is default
  const [theme, setTheme] = useState(LIGHT);
  const toggle = () => setTheme(t => t.name === "light" ? DARK : LIGHT);
  return (
    <ThemeContext.Provider value={{ t: theme, toggle, isDark: theme.name === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
