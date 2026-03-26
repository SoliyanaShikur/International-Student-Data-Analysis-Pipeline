import { useState, useEffect, useRef } from "react";
import { useTheme } from "../theme";

function LiveClock({ t }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const pad = n => String(n).padStart(2, "0");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", color: t.textFaint, fontSize: "11px", letterSpacing: "0.08em" }}>
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
    </span>
  );
}

function AnimatedCount({ value, color }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  useEffect(() => {
    const start = display, end = value, diff = end - start;
    if (diff === 0) return;
    const duration = 400, startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * e));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <span style={{ color, fontWeight: "bold", fontVariantNumeric: "tabular-nums", fontSize: "18px", lineHeight: 1 }}>{display.toLocaleString()}</span>;
}

function Cursor({ t }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const i = setInterval(() => setOn(v => !v), 530); return () => clearInterval(i); }, []);
  return <span style={{ color: t.accent, opacity: on ? 1 : 0, transition: "opacity 0.1s" }}>█</span>;
}

function StatusPill({ label, active, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 8px", border: `1px solid ${active ? t.accent : t.border}`, background: active ? (t.name === "light" ? "rgba(0,151,184,0.08)" : "rgba(0,180,216,0.08)") : "transparent" }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: active ? t.accent : t.textFaint, boxShadow: active ? `0 0 6px ${t.accent}` : "none" }} />
      <span style={{ fontSize: "9px", color: active ? t.accent : t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function ViewButton({ label, icon, isActive, onClick, t }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "6px 14px", fontSize: "10px", fontFamily: "monospace", letterSpacing: "0.12em",
        fontWeight: isActive ? "bold" : "normal", cursor: "pointer", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: "6px",
        background: isActive ? t.accent : hov ? (t.name === "light" ? "rgba(0,151,184,0.08)" : "rgba(0,180,216,0.08)") : "transparent",
        color: isActive ? (t.name === "light" ? "#fff" : "#070d12") : hov ? t.accent : t.textMuted,
        border: `1px solid ${isActive ? t.accent : hov ? t.accent : t.border}`,
      }}>
      <span style={{ fontSize: "12px" }}>{icon}</span>{label}
    </button>
  );
}

// ── Theme toggle button ───────────────────────────────────────────────────────
function ThemeToggle({ t, toggle, isDark }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "5px 10px", fontSize: "10px", fontFamily: "monospace",
        letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s",
        background: hov ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") : "transparent",
        border: `1px solid ${hov ? t.accent : t.border}`,
        color: hov ? t.accent : t.textMuted,
      }}
    >
      {/* Sun / Moon icon */}
      <span style={{ fontSize: "13px" }}>{isDark ? "☀" : "☾"}</span>
      <span>{isDark ? "LIGHT" : "DARK"}</span>
    </button>
  );
}

export default function TopBar({ filteredCount, totalCount, activeView, onViewChange, activeFilterCount = 0, onHome }) {
  const { t, toggle, isDark } = useTheme();
  const pct = totalCount > 0 ? Math.round((filteredCount / totalCount) * 100) : 0;

  return (
    <header style={{
      background: t.bgTopbar,
      borderBottom: `1px solid ${t.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", height: "52px", flexShrink: 0, position: "relative",
      backgroundImage: isDark
        ? "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,216,0.012) 2px, rgba(0,180,216,0.012) 4px)"
        : "none",
      boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
    }}>

      {/* ── LEFT ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {onHome && (
          <button onClick={onHome} style={{ background: "none", border: `1px solid ${t.border}`, color: t.textMuted, fontSize: "10px", fontFamily: "monospace", padding: "4px 10px", cursor: "pointer", letterSpacing: "0.08em", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
          >← HOME</button>
        )}

        {/* Status dot */}
        <div style={{ position: "relative", width: "8px", height: "8px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", animation: "ping 1.5s ease-out infinite", opacity: 0.4 }} />
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", position: "relative", boxShadow: "0 0 8px #22c55e" }} />
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{ fontSize: "16px", fontWeight: "900", color: t.accent, letterSpacing: "0.2em", fontFamily: "monospace" }}>EDU</span>
          <span style={{ fontSize: "16px", fontWeight: "900", color: t.amber, letterSpacing: "0.2em", fontFamily: "monospace" }}>SCOPE</span>
          <Cursor t={t} />
        </div>

        {/* Tagline */}
        <div style={{ borderLeft: `1px solid ${t.border}`, paddingLeft: "12px" }}>
          <p style={{ margin: 0, fontSize: "8px", color: t.textMuted, letterSpacing: "0.15em", textTransform: "uppercase" }}>International Student Analytics</p>
          <p style={{ margin: 0, fontSize: "8px", color: t.textFaint, letterSpacing: "0.1em" }}>US Dept. of Education · College Scorecard</p>
        </div>
      </div>

      {/* ── CENTER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>

        {/* Count */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <AnimatedCount value={filteredCount} color={t.accent} />
            <span style={{ color: t.border, fontSize: "14px" }}>/</span>
            <span style={{ color: t.textMuted, fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>{totalCount.toLocaleString()}</span>
          </div>
          <p style={{ margin: 0, fontSize: "8px", color: t.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>Institutions Active</p>
        </div>

        <div style={{ width: "1px", height: "28px", background: t.border }} />

        {/* Coverage bar */}
        <div style={{ textAlign: "center", minWidth: "80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <div style={{ flex: 1, height: "3px", background: t.border, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: pct > 60 ? t.accent : pct > 30 ? t.amber : t.red, transition: "width 0.4s ease, background 0.4s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: t.textMuted, fontVariantNumeric: "tabular-nums", fontWeight: "bold" }}>{pct}%</span>
          </div>
          <p style={{ margin: 0, fontSize: "8px", color: t.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>Filter Coverage</p>
        </div>

        <div style={{ width: "1px", height: "28px", background: t.border }} />

        {/* Status pills */}
        <div style={{ display: "flex", gap: "5px" }}>
          <StatusPill label="DB Live" active={totalCount > 0} t={t} />
          <StatusPill label={`${activeFilterCount} Filters`} active={activeFilterCount > 0} t={t} />
        </div>

        <div style={{ width: "1px", height: "28px", background: t.border }} />

        {/* Clock */}
        <div style={{ textAlign: "center" }}>
          <LiveClock t={t} />
          <p style={{ margin: 0, fontSize: "8px", color: t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Local Time</p>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <ThemeToggle t={t} toggle={toggle} isDark={isDark} />
        <div style={{ width: "1px", height: "20px", background: t.border }} />
        <span style={{ fontSize: "9px", color: t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>View:</span>
        <ViewButton label="Macro Map" icon="▦" isActive={activeView === "map"} onClick={() => onViewChange("map")} t={t} />
        <ViewButton label="Scatter" icon="◎" isActive={activeView === "scatter"} onClick={() => onViewChange("scatter")} t={t} />
      </div>

      <style>{`@keyframes ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }`}</style>
    </header>
  );
}