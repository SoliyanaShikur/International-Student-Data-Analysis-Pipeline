/**
 * TutorialOverlay.jsx
 *
 * Step-by-step interactive guide that highlights different parts of the dashboard.
 * Shows on first visit (localStorage) and when user clicks "? GUIDE" in TopBar.
 *
 * Steps walk through: map → filters → drill-down → scatter → AI insights → value score
 */

import { useState, useEffect } from "react";
import { useTheme } from "../theme.jsx";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to EduScope",
    icon: "🎓",
    description: "EduScope is an analytics terminal for exploring international student data across 6,275 US institutions. Whether you're an international student finding the best-value school, or a university administrator benchmarking competitors — this guide will show you how.",
    highlight: null,
    position: "center",
  },
  {
    id: "map",
    title: "The Choropleth Map",
    icon: "▦",
    description: "The main map shows international student density by state. Darker = fewer students, brighter cyan = more. Click any state to drill into its institutions. Scroll to zoom in, double-click to focus on a state.",
    highlight: "map",
    position: "right",
    tip: "Try clicking California or New York first — they have the most international students.",
  },
  {
    id: "drilldown",
    title: "State Drill-Down Panel",
    icon: "▶",
    description: "After clicking a state, this panel shows the top institutions ranked by international enrollment, value score, or tuition. Click any school to see 8 detailed metrics. Hit 'All N ↗' to see every institution in the state.",
    highlight: "drilldown",
    position: "left",
    tip: "Sort by 'Score ▾' to find the best value schools in any state.",
  },
  {
    id: "filters",
    title: "Filter Sidebar",
    icon: "◈",
    description: "Use the sliders to narrow your search. Set a max tuition, minimum international students, enrollment size, and admission rate. Toggle 'High ROI Only' to show only top-value schools. All filtering happens instantly.",
    highlight: "filters",
    position: "right",
    tip: "Set Max Tuition to $25,000 and toggle High ROI to find affordable hidden gems.",
  },
  {
    id: "scatter",
    title: "Scatter Plot View",
    icon: "◎",
    description: "Switch to Scatter view (top right) to see all schools plotted by Tuition vs International Enrollment. Bubble size = total enrollment. The amber zone marks 'Hidden Gems' — low tuition, high international community. Hover any dot for details.",
    highlight: "scatter",
    position: "center",
    tip: "Click any dot to select that school and see it in the drill-down panel.",
  },
  {
    id: "valuescore",
    title: "The Value Score",
    icon: "★",
    description: "Every school gets a Value Score: (10yr Earnings ÷ Tuition) × International Density × 100, log-normalized so one elite school doesn't skew the whole dataset. Scores ≥70 are Hidden Gems, 40–69 are Solid Value, below 40 is Below Average.",
    highlight: null,
    position: "center",
    tip: "A high Value Score means strong post-grad earnings relative to cost, with a thriving international community.",
  },
  {
    id: "ai",
    title: "AI Analyst Insights",
    icon: "◈",
    description: "Click '◈ AI INSIGHTS →' at the bottom of the filter sidebar. Claude AI generates a personalized analysis based on your current filters and selected state — either finding your best hidden gem as an applicant, or strategic competitive analysis for administrators.",
    highlight: "filters",
    position: "right",
    tip: "Switch between 'For Applicants' and 'For Administrators' tabs for different perspectives.",
  },
  {
    id: "done",
    title: "You're ready to explore",
    icon: "✓",
    description: "That's everything. Start by clicking a state on the map, adjust the filters to match your budget and preferences, and use AI Insights for personalized recommendations. Click '? GUIDE' in the top bar anytime to see this again.",
    highlight: null,
    position: "center",
  },
];

// Highlight overlay positions — approximate bounding boxes for each section
const HIGHLIGHTS = {
  map: { top: "52px", left: "260px", right: "35%", bottom: "0" },
  drilldown: { top: "52px", right: "0", width: "35%", bottom: "0" },
  filters: { top: "52px", left: "0", width: "260px", bottom: "0" },
  scatter: { top: "52px", left: "260px", right: "35%", bottom: "0" },
};

export default function TutorialOverlay({ onClose }) {
  const { t, isDark } = useTheme();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const goTo = (next) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 200);
  };

  const bg = isDark ? "#0c1820" : "#ffffff";
  const overlay = isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.55)";

  // Card position based on step
  const cardStyle = {
    position: "fixed",
    zIndex: 3000,
    width: "420px",
    background: bg,
    border: `1px solid ${t.border}`,
    fontFamily: "'IBM Plex Mono', monospace",
    boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
    opacity: animating ? 0 : 1,
    transform: animating ? "translateY(8px)" : "translateY(0)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
    ...(current.position === "center" ? {
      top: "50%", left: "50%", transform: animating ? "translate(-50%, calc(-50% + 8px))" : "translate(-50%, -50%)",
    } : current.position === "right" ? {
      top: "50%", left: "320px", transform: animating ? "translateY(calc(-50% + 8px))" : "translateY(-50%)",
    } : {
      top: "50%", right: "calc(35% + 20px)", transform: animating ? "translateY(calc(-50% + 8px))" : "translateY(-50%)",
    }),
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2999 }}>
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: overlay }} onClick={onClose} />

      {/* Highlight cutout — brightens the relevant panel */}
      {current.highlight && HIGHLIGHTS[current.highlight] && (
        <div style={{
          position: "absolute",
          ...HIGHLIGHTS[current.highlight],
          border: `2px solid ${t.accent}`,
          boxShadow: `0 0 0 4px ${isDark ? "rgba(0,180,216,0.15)" : "rgba(0,151,184,0.15)"}`,
          pointerEvents: "none",
          zIndex: 3000,
          animation: "pulse-border 2s infinite",
        }} />
      )}

      {/* Tutorial card */}
      <div style={cardStyle}>
        {/* Progress bar */}
        <div style={{ height: "3px", background: t.border }}>
          <div style={{ height: "100%", background: t.accent, width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 0.3s ease" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>{current.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: t.text }}>{current.title}</p>
            <p style={{ margin: 0, fontSize: "9px", color: t.textFaint, letterSpacing: "0.1em" }}>
              STEP {step + 1} OF {STEPS.length}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textFaint, cursor: "pointer", fontSize: "16px", padding: "4px" }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: t.text, lineHeight: 1.8 }}>
            {current.description}
          </p>

          {current.tip && (
            <div style={{ background: isDark ? "rgba(0,180,216,0.06)" : "rgba(0,151,184,0.06)", border: `1px solid ${t.accent}`, padding: "10px 12px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "11px", color: t.accent, lineHeight: 1.6 }}>
                <span style={{ fontWeight: "bold" }}>💡 Tip: </span>{current.tip}
              </p>
            </div>
          )}

          {/* Step dots */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "16px" }}>
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i === step ? "20px" : "6px", height: "6px",
                background: i === step ? t.accent : i < step ? t.textMuted : t.border,
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.2s ease",
              }} />
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: "8px" }}>
            {!isFirst && (
              <button onClick={() => goTo(step - 1)} style={{
                flex: 1, padding: "10px", fontSize: "11px", fontFamily: "monospace",
                letterSpacing: "0.08em", cursor: "pointer",
                background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted,
              }}>← BACK</button>
            )}
            <button onClick={() => isLast ? onClose() : goTo(step + 1)} style={{
              flex: 2, padding: "10px", fontSize: "11px", fontFamily: "monospace",
              letterSpacing: "0.08em", fontWeight: "bold", cursor: "pointer",
              background: isLast ? t.accent : t.accent,
              color: t.name === "light" ? "#fff" : "#070d12",
              border: `1px solid ${t.accent}`,
            }}>
              {isLast ? "START EXPLORING →" : "NEXT →"}
            </button>
          </div>

          {!isLast && (
            <button onClick={onClose} style={{ width: "100%", marginTop: "8px", padding: "6px", fontSize: "10px", fontFamily: "monospace", background: "none", border: "none", color: t.textFaint, cursor: "pointer", letterSpacing: "0.08em" }}>
              SKIP TUTORIAL
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 4px rgba(0,180,216,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(0,180,216,0.25); }
        }
      `}</style>
    </div>
  );
}
