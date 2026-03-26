import { useState, useCallback } from "react";
import { useTheme } from "../theme";

function SliderRow({ label, sublabel, value, displayValue, min, max, step, onChange, t }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
        <div>
          <span style={{ fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
          {sublabel && <span style={{ fontSize: "9px", color: t.textFaint, marginLeft: "4px" }}>{sublabel}</span>}
        </div>
        <span style={{ fontSize: "13px", color: t.accent, fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>{displayValue}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: t.accent, height: "3px", cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: t.textFaint, marginTop: "1px" }}>
        <span>{min === 0 ? "Any" : min}</span>
        <span>{max === 80000 ? "$80k" : max === 100 ? "100%" : max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function InsightsModal({ selectedState, filteredData, filters, onClose, t }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("applicant");

  const scopeData = selectedState ? filteredData.filter(d => d.state_name === selectedState) : filteredData;
  const top5 = [...scopeData].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0)).slice(0, 5);
  const totalIntl = scopeData.reduce((s, d) => s + (d.intl_count ?? 0), 0);
  const avgTuition = scopeData.length > 0 ? Math.round(scopeData.reduce((s, d) => s + (d.tuition ?? 0), 0) / scopeData.length) : 0;
  const validE = scopeData.filter(d => d.earnings_in_10yrs > 0);
  const avgEarnings = validE.length > 0 ? Math.round(validE.reduce((s, d) => s + d.earnings_in_10yrs, 0) / validE.length) : 0;
  const schoolsText = top5.map(s => `${s.name} (intl:${s.intl_count}, tuition:$${s.tuition?.toLocaleString()}, earnings:$${s.earnings_in_10yrs?.toLocaleString()??'N/A'}, score:${s.valueScore?.toFixed(1)})`).join("; ");

  const buildPrompt = () => {
    const scope = selectedState ?? "all US states";
    const fs = `max tuition $${filters.maxTuition.toLocaleString()}, min intl ${filters.minIntl}, max admit rate ${filters.maxAdmissionRate}%`;
    if (mode === "applicant")
      return `You are an expert education advisor. Filters: ${fs}. Scope: ${scope}. ${scopeData.length} institutions. Total intl: ${totalIntl.toLocaleString()}. Avg tuition: $${avgTuition.toLocaleString()}. Avg 10yr earnings: $${avgEarnings.toLocaleString()}. Top 5 by Value Score: ${schoolsText}. Write 4–5 sentences of sharp, specific advice for an international applicant. Lead with the single best hidden gem school and why. Include specific numbers. End with one concrete next step. Tone: warm but data-driven. No markdown.`;
    return `You are a higher education market analyst. Filters: ${fs}. Scope: ${scope}. ${scopeData.length} institutions. Total intl: ${totalIntl.toLocaleString()}. Avg tuition: $${avgTuition.toLocaleString()}. Top 5 competitors by Value Score: ${schoolsText}. Write 4–5 sentences of strategic insight for a university administrator. Identify biggest competitive threats and opportunities. End with one specific strategic recommendation. Tone: authoritative, Bloomberg-style. No markdown.`;
  };

  const generate = useCallback(async () => {
    if (scopeData.length === 0) { setInsight("No data matches current filters."); return; }
    setLoading(true); setError(null); setInsight("");
    try {
      const res = await fetch("http://127.0.0.1:5001/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: buildPrompt() }) });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsight(data.insight);
    } catch (err) {
      setError(err.message.includes("fetch") ? "Flask server not reachable on port 5001." : err.message);
    } finally { setLoading(false); }
  }, [mode, selectedState, filteredData, filters]);

  const bg = t.name === "light" ? "#ffffff" : "#0c1820";
  const bg2 = t.name === "light" ? "#f5f2eb" : "#080f15";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: bg, border: `1px solid ${t.border}`, width: "560px", maxHeight: "85vh", display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Mono', monospace" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${t.border}` }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: t.accent, fontWeight: "bold", letterSpacing: "0.1em" }}>◈ AI ANALYST INSIGHTS</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: t.textMuted }}>{selectedState?.toUpperCase() ?? "ALL STATES"} · {scopeData.length} institutions</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
        {/* Mode tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.border}` }}>
          {[{ key: "applicant", icon: "🎓", label: "For Applicants", desc: "Find your hidden gem" }, { key: "admin", icon: "📊", label: "For Administrators", desc: "Benchmark & strategy" }].map(({ key, icon, label, desc }) => (
            <button key={key} onClick={() => { setMode(key); setInsight(""); setError(null); }}
              style={{ flex: 1, padding: "10px 12px", background: mode === key ? bg2 : "transparent", border: "none", borderBottom: `2px solid ${mode === key ? t.accent : "transparent"}`, cursor: "pointer", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "11px", color: mode === key ? t.accent : t.textMuted, fontWeight: "bold", fontFamily: "monospace" }}>{icon} {label}</p>
              <p style={{ margin: 0, fontSize: "9px", color: t.textFaint, fontFamily: "monospace" }}>{desc}</p>
            </button>
          ))}
        </div>
        {/* Context */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: "20px" }}>
          {[["Scope", selectedState ?? "All States"], ["Institutions", scopeData.length.toLocaleString()], ["Avg Tuition", `$${avgTuition.toLocaleString()}`], ["Avg 10yr Earn", avgEarnings > 0 ? `$${avgEarnings.toLocaleString()}` : "N/A"]].map(([lbl, val]) => (
            <div key={lbl}>
              <p style={{ margin: 0, fontSize: "9px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em" }}>{lbl}</p>
              <p style={{ margin: 0, fontSize: "12px", color: t.textMuted, fontWeight: "bold" }}>{val}</p>
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {!insight && !loading && !error && <p style={{ color: t.textFaint, fontSize: "11px", lineHeight: 1.7, margin: 0 }}>{mode === "applicant" ? "Claude will analyze filtered schools and identify the best-value option for an international applicant." : "Claude will analyze the competitive landscape and provide strategic recommendations for administrators."}</p>}
          {loading && <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{[0.8, 0.5, 0.9, 0.4].map((w, i) => (<div key={i} style={{ height: "12px", background: t.border, width: `${w * 100}%`, animation: `pulse 1.5s infinite`, animationDelay: `${i * 0.15}s` }} />))}<p style={{ fontSize: "10px", color: t.textFaint, marginTop: "8px", letterSpacing: "0.1em" }}>CLAUDE IS ANALYZING...</p></div>}
          {error && !loading && <div style={{ border: `1px solid ${t.red}`, background: t.name === "light" ? "#fff5f5" : "#1a0a0a", padding: "12px", fontSize: "11px", color: t.red, lineHeight: 1.6 }}><p style={{ margin: "0 0 4px", fontWeight: "bold" }}>⚠ Error</p><p style={{ margin: 0 }}>{error}</p></div>}
          {insight && !loading && <p style={{ margin: 0, fontSize: "13px", color: t.text, lineHeight: 1.8 }}>{insight}</p>}
        </div>
        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "flex", gap: "8px" }}>
          <button onClick={generate} disabled={loading} style={{ flex: 1, padding: "10px", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.1em", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", background: loading ? "transparent" : t.accent, color: loading ? t.textFaint : (t.name === "light" ? "#fff" : "#070d12"), border: `1px solid ${loading ? t.border : t.accent}` }}>
            {loading ? "ANALYZING..." : insight ? "↺ REGENERATE" : "▶ GENERATE INSIGHTS"}
          </button>
          {insight && <button onClick={() => { setInsight(""); setError(null); }} style={{ padding: "10px 12px", fontSize: "11px", fontFamily: "monospace", background: "none", border: `1px solid ${t.border}`, color: t.textMuted, cursor: "pointer" }}>CLEAR</button>}
        </div>
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange, selectedState, filteredData }) {
  const { t } = useTheme();
  const [showInsights, setShowInsights] = useState(false);
  const fmtDollar = v => v === 0 ? "Any" : `$${Number(v).toLocaleString()}`;
  const fmtNum = v => v === 0 ? "Any" : Number(v).toLocaleString();
  const fmtPct = v => `${v}%`;

  return (
    <>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: t.bgSidebar }}>
        {/* Header */}
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: "9px", color: t.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>◈ Filter Parameters</p>
        </div>

        {/* Sliders */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
          <SliderRow label="Max Tuition" sublabel="out-of-state / yr" value={filters.maxTuition} displayValue={fmtDollar(filters.maxTuition)} min={0} max={80000} step={1000} onChange={v => onFilterChange("maxTuition", v)} t={t} />
          <SliderRow label="Min Intl Students" sublabel="per institution" value={filters.minIntl} displayValue={fmtNum(filters.minIntl)} min={0} max={5000} step={50} onChange={v => onFilterChange("minIntl", v)} t={t} />
          <SliderRow label="Min Enrollment" sublabel="total students" value={filters.minEnrollment} displayValue={fmtNum(filters.minEnrollment)} min={0} max={40000} step={500} onChange={v => onFilterChange("minEnrollment", v)} t={t} />
          <SliderRow label="Max Admit Rate" sublabel="selectivity filter" value={filters.maxAdmissionRate} displayValue={fmtPct(filters.maxAdmissionRate)} min={1} max={100} step={1} onChange={v => onFilterChange("maxAdmissionRate", v)} t={t} />

          <div style={{ borderTop: `1px solid ${t.border}`, margin: "8px 0 12px" }} />

          {/* High ROI toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <p style={{ margin: "0 0 1px", fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>High ROI Only</p>
              <p style={{ margin: 0, fontSize: "9px", color: t.textFaint }}>Value Score ≥ 70th pctile</p>
            </div>
            <button onClick={() => onFilterChange("highRoiOnly", !filters.highRoiOnly)}
              style={{ width: "36px", height: "20px", border: `1px solid ${filters.highRoiOnly ? t.accent : t.border}`, background: filters.highRoiOnly ? t.accent : "transparent", cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
              <span style={{ position: "absolute", top: "2px", width: "14px", height: "14px", background: filters.highRoiOnly ? (t.name === "light" ? "#fff" : "#070d12") : t.textFaint, left: filters.highRoiOnly ? "19px" : "2px", transition: "left 0.2s" }} />
            </button>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, margin: "0 0 12px" }} />

          {/* Value Score Legend */}
          <div style={{ border: `1px solid ${t.border}`, padding: "10px", marginBottom: "12px", background: t.bgCard }}>
            <p style={{ margin: "0 0 8px", fontSize: "9px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em" }}>Value Score</p>
            <p style={{ margin: "0 0 8px", fontSize: "9px", color: t.textFaint, lineHeight: 1.5 }}>(Earnings ÷ Tuition) × Intl Density × 100</p>
            {[
              { dot: t.amber, label: "Hidden Gem ★", range: "≥ 70 — best ROI + intl community" },
              { dot: t.accent, label: "Solid Value", range: "40–69 — above average" },
              { dot: t.dotBelow, label: "Below Avg", range: "< 40 — limited value" },
            ].map(({ dot, label, range }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                <span style={{ width: "8px", height: "8px", background: dot, flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "10px", color: t.textMuted, fontWeight: "bold" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "9px", color: t.textFaint }}>{range}</p>
                </div>
              </div>
            ))}
          </div>

          {/* How to use */}
          <div style={{ border: `1px dashed ${t.border}`, padding: "10px", marginBottom: "12px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "9px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em" }}>How to use</p>
            {[["1", "Click a state on the map"], ["2", "Adjust sliders to filter"], ["3", "Click schools in the list"], ["4", "Use AI for personalized picks"]].map(([n, tip]) => (
              <div key={n} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontSize: "9px", color: t.accent, fontWeight: "bold", width: "10px", flexShrink: 0 }}>{n}.</span>
                <span style={{ fontSize: "9px", color: t.textFaint }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI button */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
          <button onClick={() => setShowInsights(true)} style={{ width: "100%", padding: "10px", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: "bold", cursor: "pointer", background: "transparent", color: t.amber, border: `1px solid ${t.amber}`, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = t.amber; e.currentTarget.style.color = t.name === "light" ? "#fff" : "#070d12"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.amber; }}
          >◈ AI INSIGHTS →</button>
          <p style={{ margin: "6px 0 0", fontSize: "9px", color: t.textFaint, textAlign: "center" }}>Powered by Claude · For applicants & admins</p>
        </div>
      </div>

      {showInsights && <InsightsModal selectedState={selectedState} filteredData={filteredData} filters={filters} onClose={() => setShowInsights(false)} t={t} />}
    </>
  );
}