/**
 * TopBar.jsx — Bloomberg Terminal style header
 *
 * Features:
 *  - Live clock (HH:MM:SS) updating every second
 *  - Animated institution count ticker (counts up on change)
 *  - Filter activity indicator (shows how many filters are active)
 *  - Scanline/terminal aesthetic with inline styles
 *  - Map ↔ Scatter toggle with hover effects
 */

import { useState, useEffect, useRef } from "react";

// ── Live clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, "0");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", color: "#4b5563", fontSize: "11px", letterSpacing: "0.08em" }}>
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
    </span>
  );
}

// ── Animated count — smoothly ticks up/down when value changes ────────────────
function AnimatedCount({ value, color = "#00b4d8" }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = display;
    const end = value;
    const diff = end - start;
    if (diff === 0) return;

    const duration = 400;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span style={{ color, fontWeight: "bold", fontVariantNumeric: "tabular-nums", fontSize: "18px", lineHeight: 1 }}>
      {display.toLocaleString()}
    </span>
  );
}

// ── Blinking cursor ───────────────────────────────────────────────────────────
function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: "#00b4d8", opacity: on ? 1 : 0, transition: "opacity 0.1s" }}>█</span>;
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ label, active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "5px",
      padding: "2px 8px", border: `1px solid ${active ? "#00b4d8" : "#1e3a4a"}`,
      background: active ? "rgba(0,180,216,0.08)" : "transparent",
    }}>
      <span style={{
        width: "5px", height: "5px", borderRadius: "50%",
        background: active ? "#00b4d8" : "#374151",
        boxShadow: active ? "0 0 6px #00b4d8" : "none",
      }} />
      <span style={{ fontSize: "9px", color: active ? "#00b4d8" : "#374151", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

// ── View toggle button ────────────────────────────────────────────────────────
function ViewButton({ label, icon, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isActive || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "6px 14px", fontSize: "10px", fontFamily: "monospace",
        letterSpacing: "0.12em", fontWeight: isActive ? "bold" : "normal",
        cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px",
        background: isActive ? "#00b4d8" : hovered ? "rgba(0,180,216,0.08)" : "transparent",
        color: isActive ? "#070d12" : hovered ? "#00b4d8" : "#4b5563",
        border: `1px solid ${isActive ? "#00b4d8" : hovered ? "#00b4d8" : "#1e3a4a"}`,
      }}
    >
      <span style={{ fontSize: "12px" }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar({ filteredCount, totalCount, activeView, onViewChange, activeFilterCount = 0 }) {
  const pct = totalCount > 0 ? Math.round((filteredCount / totalCount) * 100) : 0;

  return (
    <header style={{
      background: "#040a0f",
      borderBottom: "1px solid #1e3a4a",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      height: "52px",
      flexShrink: 0,
      position: "relative",
      // Subtle scanline overlay
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,216,0.015) 2px, rgba(0,180,216,0.015) 4px)",
    }}>

      {/* ── LEFT: Brand ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Live status dot */}
        <div style={{ position: "relative", width: "8px", height: "8px" }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e",
            animation: "ping 1.5s ease-out infinite", opacity: 0.4,
          }} />
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", position: "relative", boxShadow: "0 0 8px #22c55e" }} />
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{ fontSize: "16px", fontWeight: "900", color: "#00b4d8", letterSpacing: "0.2em", fontFamily: "monospace" }}>
            EDU
          </span>
          <span style={{ fontSize: "16px", fontWeight: "900", color: "#f59e0b", letterSpacing: "0.2em", fontFamily: "monospace" }}>
            SCOPE
          </span>
          <Cursor />
        </div>

        {/* Tagline */}
        <div style={{ borderLeft: "1px solid #1e3a4a", paddingLeft: "12px" }}>
          <p style={{ margin: 0, fontSize: "8px", color: "#374151", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            International Student Analytics
          </p>
          <p style={{ margin: 0, fontSize: "8px", color: "#1e3a4a", letterSpacing: "0.1em" }}>
            US Dept. of Education · College Scorecard
          </p>
        </div>
      </div>

      {/* ── CENTER: Live metrics ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>

        {/* Institution count */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <AnimatedCount value={filteredCount} color="#00b4d8" />
            <span style={{ color: "#1e3a4a", fontSize: "14px" }}>/</span>
            <span style={{ color: "#374151", fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
              {totalCount.toLocaleString()}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "8px", color: "#374151", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Institutions Active
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#1e3a4a" }} />

        {/* Filter coverage bar */}
        <div style={{ textAlign: "center", minWidth: "80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <div style={{ flex: 1, height: "3px", background: "#1e3a4a", position: "relative" }}>
              <div style={{
                position: "absolute", left: 0, top: 0, height: "100%",
                width: `${pct}%`, background: pct > 60 ? "#00b4d8" : pct > 30 ? "#f59e0b" : "#dc2626",
                transition: "width 0.4s ease, background 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: "11px", color: "#6b7280", fontVariantNumeric: "tabular-nums", fontWeight: "bold" }}>
              {pct}%
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "8px", color: "#374151", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Filter Coverage
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#1e3a4a" }} />

        {/* Status pills */}
        <div style={{ display: "flex", gap: "5px" }}>
          <StatusPill label="DB Live" active={totalCount > 0} />
          <StatusPill label={`${activeFilterCount} Filters`} active={activeFilterCount > 0} />
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#1e3a4a" }} />

        {/* Clock */}
        <div style={{ textAlign: "center" }}>
          <LiveClock />
          <p style={{ margin: 0, fontSize: "8px", color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Local Time
          </p>
        </div>
      </div>

      {/* ── RIGHT: View toggle ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "#374151", letterSpacing: "0.1em", marginRight: "6px", textTransform: "uppercase" }}>View:</span>
        <ViewButton label="Macro Map" icon="▦" isActive={activeView === "map"} onClick={() => onViewChange("map")} />
        <ViewButton label="Scatter" icon="◎" isActive={activeView === "scatter"} onClick={() => onViewChange("scatter")} />
      </div>

      {/* ── Ping animation keyframes injected inline ───────────────────────── */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </header>
  );
}