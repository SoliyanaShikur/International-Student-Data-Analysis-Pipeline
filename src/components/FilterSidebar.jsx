/**
 * FilterSidebar.jsx — Compact filter panel with AI Insights popup
 *
 * Layout:
 *  - Each filter is a tight 3-line block: label | live value | slider
 *  - High ROI toggle inline
 *  - Value Score legend compact
 *  - "AI Insights" button at bottom → opens modal popup with Claude analysis
 */

import { useState, useCallback } from "react";

// ── Compact slider row ────────────────────────────────────────────────────────
function SliderRow({ label, sublabel, value, displayValue, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Top row: label + live value */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
        <div>
          <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
          {sublabel && <span style={{ fontSize: "9px", color: "#4b5563", marginLeft: "4px" }}>{sublabel}</span>}
        </div>
        <span style={{ fontSize: "13px", color: "#00b4d8", fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>
          {displayValue}
        </span>
      </div>
      {/* Slider */}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#00b4d8", height: "3px", cursor: "pointer" }}
      />
      {/* Min/max labels */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#374151", marginTop: "1px" }}>
        <span>{min === 0 ? "Any" : min}</span>
        <span>{max === 80000 ? "$80k" : max === 100 ? "100%" : max.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── AI Insights Modal ─────────────────────────────────────────────────────────
function InsightsModal({ selectedState, filteredData, filters, onClose }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("applicant"); // "applicant" | "admin"

  const scopeData = selectedState
    ? filteredData.filter(d => d.state_name === selectedState)
    : filteredData;

  const top5 = [...scopeData]
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, 5);

  const totalIntl = scopeData.reduce((s, d) => s + (d.intl_count ?? 0), 0);
  const avgTuition = scopeData.length > 0
    ? Math.round(scopeData.reduce((s, d) => s + (d.tuition ?? 0), 0) / scopeData.length) : 0;
  const avgEarnings = (() => {
    const valid = scopeData.filter(d => d.earnings_in_10yrs > 0);
    return valid.length > 0 ? Math.round(valid.reduce((s, d) => s + d.earnings_in_10yrs, 0) / valid.length) : 0;
  })();

  const schoolsText = top5.map(s =>
    `${s.name} (intl: ${s.intl_count}, tuition: $${s.tuition?.toLocaleString()}, 10yr earnings: $${s.earnings_in_10yrs?.toLocaleString() ?? "N/A"}, score: ${s.valueScore?.toFixed(1)})`
  ).join("; ");

  const buildPrompt = () => {
    const scope = selectedState ?? "all US states";
    const filterSummary = `max tuition $${filters.maxTuition.toLocaleString()}, min intl ${filters.minIntl}, max admit rate ${filters.maxAdmissionRate}%`;

    if (mode === "applicant") {
      return `You are an expert education advisor helping an international student find the best-value US university. ` +
        `Current filters: ${filterSummary}. Scope: ${scope}. ${scopeData.length} institutions match. ` +
        `Total intl students in scope: ${totalIntl.toLocaleString()}. Avg tuition: $${avgTuition.toLocaleString()}. Avg 10yr earnings: $${avgEarnings.toLocaleString()}. ` +
        `Top 5 by Value Score: ${schoolsText}. ` +
        `\n\nWrite 4–5 sentences of sharp, specific advice for an international applicant. ` +
        `Lead with the single best "hidden gem" school and why. Include specific numbers. ` +
        `End with one concrete next step (e.g. "Apply by X, visit Y website"). ` +
        `Tone: warm but data-driven, like a knowledgeable advisor. No markdown headers or bullet points.`;
    } else {
      return `You are a higher education market analyst advising a university administrator on international student recruitment strategy. ` +
        `Current filters: ${filterSummary}. Scope: ${scope}. ${scopeData.length} institutions in competitive set. ` +
        `Total intl students in scope: ${totalIntl.toLocaleString()}. Avg tuition: $${avgTuition.toLocaleString()}. ` +
        `Top 5 competitors by Value Score: ${schoolsText}. ` +
        `\n\nWrite 4–5 sentences of strategic insight for a university administrator. ` +
        `Identify the biggest competitive threats and opportunities in this market. ` +
        `End with one specific strategic recommendation (pricing, recruiting, program). ` +
        `Tone: authoritative, Bloomberg-style. No markdown headers or bullet points.`;
    }
  };

  const generate = useCallback(async () => {
    if (scopeData.length === 0) { setInsight("No data matches current filters."); return; }
    setLoading(true); setError(null); setInsight("");
    try {
      const res = await fetch("http://127.0.0.1:5001/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt() }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInsight(data.insight);
    } catch (err) {
      setError(err.message.includes("fetch") ? "Flask server not reachable on port 5001." : err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedState, filteredData, filters]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0c1820", border: "1px solid #1e3a4a", width: "580px", maxHeight: "85vh", display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Mono', monospace" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #1e3a4a" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#00b4d8", fontWeight: "bold", letterSpacing: "0.1em" }}>◈ AI ANALYST INSIGHTS</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#4b5563" }}>
              {selectedState ? selectedState.toUpperCase() : "ALL STATES"} · {scopeData.length} institutions
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #1e3a4a" }}>
          {[
            { key: "applicant", icon: "🎓", label: "For Applicants", desc: "Find your hidden gem school" },
            { key: "admin", icon: "📊", label: "For Administrators", desc: "Benchmark & strategy" },
          ].map(({ key, icon, label, desc }) => (
            <button key={key} onClick={() => { setMode(key); setInsight(""); setError(null); }}
              style={{
                flex: 1, padding: "10px 12px", background: mode === key ? "#0f2030" : "transparent",
                border: "none", borderBottom: mode === key ? "2px solid #00b4d8" : "2px solid transparent",
                cursor: "pointer", textAlign: "left",
              }}>
              <p style={{ margin: 0, fontSize: "11px", color: mode === key ? "#00b4d8" : "#6b7280", fontWeight: "bold", fontFamily: "monospace" }}>{icon} {label}</p>
              <p style={{ margin: 0, fontSize: "9px", color: "#4b5563", fontFamily: "monospace" }}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Context summary */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e3a4a", display: "flex", gap: "16px" }}>
          {[
            ["Scope", selectedState ?? "All States"],
            ["Institutions", scopeData.length.toLocaleString()],
            ["Avg Tuition", `$${avgTuition.toLocaleString()}`],
            ["Avg 10yr Earn", avgEarnings > 0 ? `$${avgEarnings.toLocaleString()}` : "N/A"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <p style={{ margin: 0, fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lbl}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontWeight: "bold" }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Insight area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {!insight && !loading && !error && (
            <div style={{ color: "#4b5563", fontSize: "11px", lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 12px", color: "#6b7280" }}>
                {mode === "applicant"
                  ? "Claude will analyze the filtered schools and identify the best-value option for an international applicant — factoring in tuition cost, international community size, and post-graduation earnings."
                  : "Claude will analyze the competitive landscape for university administrators — identifying threats, opportunities, and a specific strategic recommendation for international student recruitment."}
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "#374151" }}>
                💡 Tip: Filter by state first for more targeted advice. Set your max tuition to see which schools offer the best ROI in your budget.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[0.3, 0.6, 0.9, 0.5].map((w, i) => (
                <div key={i} style={{ height: "12px", background: "#1e3a4a", borderRadius: "2px", width: `${w * 100}%`, animation: "pulse 1.5s infinite", animationDelay: `${i * 0.15}s` }} />
              ))}
              <p style={{ fontSize: "10px", color: "#4b5563", marginTop: "8px", letterSpacing: "0.1em" }}>CLAUDE IS ANALYZING...</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ border: "1px solid #7f1d1d", background: "#1a0a0a", padding: "12px", fontSize: "11px", color: "#fca5a5", lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>⚠ Error</p>
              <p style={{ margin: 0 }}>{error}</p>
              {error.includes("5001") && <p style={{ margin: "8px 0 0", color: "#6b7280" }}>Make sure Flask is running: <code style={{ color: "#f59e0b" }}>python app.py</code></p>}
            </div>
          )}

          {insight && !loading && (
            <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", lineHeight: 1.8 }}>{insight}</p>
          )}
        </div>

        {/* Footer: generate button */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e3a4a", display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={generate} disabled={loading} style={{
            flex: 1, padding: "10px", fontSize: "11px", fontFamily: "monospace",
            letterSpacing: "0.1em", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "transparent" : "#00b4d8", color: loading ? "#4b5563" : "#070d12",
            border: `1px solid ${loading ? "#1e3a4a" : "#00b4d8"}`, transition: "all 0.15s",
          }}>
            {loading ? "ANALYZING..." : insight ? "↺ REGENERATE" : "▶ GENERATE INSIGHTS"}
          </button>
          {insight && (
            <button onClick={() => { setInsight(""); setError(null); }} style={{ padding: "10px 12px", fontSize: "11px", fontFamily: "monospace", background: "none", border: "1px solid #1e3a4a", color: "#6b7280", cursor: "pointer" }}>
              CLEAR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function FilterSidebar({ filters, onFilterChange, selectedState, filteredData }) {
  const [showInsights, setShowInsights] = useState(false);

  const fmtDollar = v => v === 0 ? "Any" : `$${Number(v).toLocaleString()}`;
  const fmtNum = v => v === 0 ? "Any" : Number(v).toLocaleString();
  const fmtPct = v => `${v}%`;

  return (
    <>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#080f15" }}>

        {/* ── Header ── */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e3a4a", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: "9px", color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase" }}>◈ Filter Parameters</p>
        </div>

        {/* ── Sliders ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>

          <SliderRow
            label="Max Tuition" sublabel="out-of-state / yr"
            value={filters.maxTuition} displayValue={fmtDollar(filters.maxTuition)}
            min={0} max={80000} step={1000}
            onChange={v => onFilterChange("maxTuition", v)}
          />

          <SliderRow
            label="Min Intl Students" sublabel="per institution"
            value={filters.minIntl} displayValue={fmtNum(filters.minIntl)}
            min={0} max={5000} step={50}
            onChange={v => onFilterChange("minIntl", v)}
          />

          <SliderRow
            label="Min Enrollment" sublabel="total students"
            value={filters.minEnrollment} displayValue={fmtNum(filters.minEnrollment)}
            min={0} max={40000} step={500}
            onChange={v => onFilterChange("minEnrollment", v)}
          />

          <SliderRow
            label="Max Admit Rate" sublabel="selectivity filter"
            value={filters.maxAdmissionRate} displayValue={fmtPct(filters.maxAdmissionRate)}
            min={1} max={100} step={1}
            onChange={v => onFilterChange("maxAdmissionRate", v)}
          />

          {/* ── Divider ── */}
          <div style={{ borderTop: "1px solid #1e3a4a", margin: "8px 0 12px" }} />

          {/* ── High ROI Toggle ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <p style={{ margin: "0 0 1px", fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>High ROI Only</p>
              <p style={{ margin: 0, fontSize: "9px", color: "#4b5563" }}>Value Score ≥ 70th pctile</p>
            </div>
            <button
              onClick={() => onFilterChange("highRoiOnly", !filters.highRoiOnly)}
              style={{
                width: "36px", height: "20px", border: `1px solid ${filters.highRoiOnly ? "#00b4d8" : "#374151"}`,
                background: filters.highRoiOnly ? "#00b4d8" : "transparent",
                cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: "2px", width: "14px", height: "14px",
                background: filters.highRoiOnly ? "#070d12" : "#374151",
                left: filters.highRoiOnly ? "19px" : "2px", transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: "1px solid #1e3a4a", margin: "0 0 12px" }} />

          {/* ── Value Score Legend ── */}
          <div style={{ border: "1px solid #1e3a4a", padding: "10px", marginBottom: "12px" }}>
            <p style={{ margin: "0 0 8px", fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em" }}>Value Score</p>
            <p style={{ margin: "0 0 6px", fontSize: "9px", color: "#374151", lineHeight: 1.5 }}>
              (Earnings ÷ Tuition) × Intl Density × 100
            </p>
            {[
              { dot: "#f59e0b", label: "Hidden Gem ★", range: "≥ 70 — best ROI + intl community" },
              { dot: "#06b6d4", label: "Solid Value", range: "40–69 — above average" },
              { dot: "#374151", label: "Below Avg", range: "< 40 — limited data or value" },
            ].map(({ dot, label, range }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                <span style={{ width: "8px", height: "8px", background: dot, flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: "bold" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "9px", color: "#4b5563" }}>{range}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── How to use ── */}
          <div style={{ border: "1px dashed #1e3a4a", padding: "10px", marginBottom: "12px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>How to use</p>
            {[
              ["1", "Click a state on the map"],
              ["2", "Adjust sliders to filter"],
              ["3", "Click schools in the list"],
              ["4", "Use AI for personalized picks"],
            ].map(([n, tip]) => (
              <div key={n} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontSize: "9px", color: "#00b4d8", fontWeight: "bold", width: "10px", flexShrink: 0 }}>{n}.</span>
                <span style={{ fontSize: "9px", color: "#6b7280" }}>{tip}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ── AI Insights Button — pinned to bottom ── */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid #1e3a4a", flexShrink: 0 }}>
          <button
            onClick={() => setShowInsights(true)}
            style={{
              width: "100%", padding: "10px", fontSize: "11px", fontFamily: "monospace",
              letterSpacing: "0.08em", fontWeight: "bold", cursor: "pointer",
              background: "transparent", color: "#f59e0b",
              border: "1px solid #f59e0b", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f59e0b"; e.currentTarget.style.color = "#070d12"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#f59e0b"; }}
          >
            ◈ AI INSIGHTS →
          </button>
          <p style={{ margin: "6px 0 0", fontSize: "9px", color: "#374151", textAlign: "center" }}>
            Powered by Claude · For applicants & admins
          </p>
        </div>

      </div>

      {/* AI Insights Modal */}
      {showInsights && (
        <InsightsModal
          selectedState={selectedState}
          filteredData={filteredData}
          filters={filters}
          onClose={() => setShowInsights(false)}
        />
      )}
    </>
  );
}