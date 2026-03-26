import { useState } from "react";
import { useTheme } from "../theme";

function getScoreTier(score, t) {
  if (score >= 70) return { label: "Hidden Gem ★", color: t.amber };
  if (score >= 40) return { label: "Solid Value", color: t.accent };
  return { label: "Below Avg", color: t.dotBelow };
}

function StatCard({ label, value, t }) {
  return (
    <div style={{ border: `1px solid ${t.border}`, padding: "6px 8px", background: t.bgCard }}>
      <p style={{ margin: "0 0 2px", fontSize: "9px", color: t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "15px", color: t.accent, fontWeight: "bold" }}>{value}</p>
    </div>
  );
}

function SchoolRow({ school, rank, isSelected, onClick, t }) {
  const { color } = getScoreTier(school.valueScore, t);
  return (
    <li onClick={() => onClick(school)}
      style={{ padding: "8px 12px", borderBottom: `1px solid ${t.borderLight}`, cursor: "pointer", background: isSelected ? (t.name === "light" ? "rgba(217,119,6,0.07)" : "rgba(245,158,11,0.07)") : "transparent", borderLeft: isSelected ? `2px solid ${t.amber}` : "2px solid transparent" }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.name === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = isSelected ? (t.name === "light" ? "rgba(217,119,6,0.07)" : "rgba(245,158,11,0.07)") : "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <span style={{ color: t.textFaint, fontSize: "10px", width: "16px", flexShrink: 0 }}>{rank}.</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: "11px", color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{school.name}</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "10px", color: t.textFaint }}>Intl: <b style={{ color: t.textMuted }}>{school.intl_count?.toLocaleString()}</b></span>
            <span style={{ fontSize: "10px", color: t.textFaint }}>Tuition: <b style={{ color: t.textMuted }}>${school.tuition?.toLocaleString()}</b></span>
          </div>
        </div>
        <span style={{ fontSize: "11px", fontWeight: "bold", color, flexShrink: 0 }}>{school.valueScore?.toFixed(0)}</span>
      </div>
    </li>
  );
}

function SchoolDetailCard({ school, onClose, t }) {
  const { label, color } = getScoreTier(school.valueScore, t);
  const url = school.school_url ? (school.school_url.startsWith("http") ? school.school_url : `https://${school.school_url}`) : null;
  const metrics = [
    ["Intl Students", school.intl_count?.toLocaleString() ?? "N/A"],
    ["Enrollment", school.enrollment_size?.toLocaleString() ?? "N/A"],
    ["Tuition (OOS)", school.tuition ? `$${school.tuition.toLocaleString()}` : "N/A"],
    ["Admit Rate", school.admission_rate ? `${(school.admission_rate * 100).toFixed(1)}%` : "N/A"],
    ["Completion", school.completion_rate ? `${(school.completion_rate * 100).toFixed(1)}%` : "N/A"],
    ["10yr Earnings", school.earnings_in_10yrs ? `$${school.earnings_in_10yrs.toLocaleString()}` : "N/A"],
    ["Instruct. Spend", school.instructional_spend ? `$${school.instructional_spend.toLocaleString()}` : "N/A"],
    ["Value Score", school.valueScore?.toFixed(1) ?? "N/A"],
  ];
  return (
    <div style={{ margin: "0 8px 8px", border: `1px solid ${t.border}`, padding: "10px", background: t.bgCardAlt, position: "relative", flexShrink: 0 }}>
      <button onClick={onClose} style={{ position: "absolute", top: "6px", right: "8px", background: "none", border: "none", color: t.textFaint, cursor: "pointer", fontSize: "14px", lineHeight: 1 }}>✕</button>
      <p style={{ margin: "0 20px 2px 0", fontSize: "12px", color: t.text, fontWeight: "bold", lineHeight: 1.3 }}>{school.name}</p>
      <span style={{ fontSize: "10px", fontWeight: "bold", color, display: "block", marginBottom: "8px" }}>{label}</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginBottom: "8px" }}>
        {metrics.map(([lbl, val]) => (
          <div key={lbl} style={{ border: `1px solid ${t.border}`, padding: "4px 6px", background: t.bgCard }}>
            <p style={{ margin: "0 0 1px", fontSize: "9px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.05em" }}>{lbl}</p>
            <p style={{ margin: 0, fontSize: "11px", color: t.text, fontWeight: "bold" }}>{val}</p>
          </div>
        ))}
      </div>
      {url
        ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: t.accent, textDecoration: "underline", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>↗ {school.school_url}</a>
        : <span style={{ fontSize: "10px", color: t.textFaint }}>No website available</span>}
    </div>
  );
}

function FullListModal({ stateData, sortKey, selectedState, onClose, onSchoolClick, t }) {
  const sorted = [...stateData].sort((a, b) => {
    if (sortKey === "intl") return (b.intl_count ?? 0) - (a.intl_count ?? 0);
    if (sortKey === "value") return (b.valueScore ?? 0) - (a.valueScore ?? 0);
    if (sortKey === "tuition") return (a.tuition ?? 0) - (b.tuition ?? 0);
    return 0;
  });
  const bg = t.name === "light" ? "#ffffff" : "#0c1820";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: bg, border: `1px solid ${t.border}`, width: "620px", maxHeight: "80vh", display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Mono', monospace" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: "12px", color: t.accent, fontWeight: "bold", letterSpacing: "0.08em" }}>{selectedState?.toUpperCase()} — ALL {sorted.length} INSTITUTIONS</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 80px 55px", gap: "8px", padding: "6px 16px", borderBottom: `1px solid ${t.border}`, fontSize: "9px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>#</span><span>School</span><span>Intl</span><span>Tuition</span><span>Score</span>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {sorted.map((school, i) => {
            const { color } = getScoreTier(school.valueScore, t);
            const url = school.school_url ? (school.school_url.startsWith("http") ? school.school_url : `https://${school.school_url}`) : null;
            return (
              <div key={school.name} style={{ display: "grid", gridTemplateColumns: "32px 1fr 70px 80px 55px", gap: "8px", padding: "7px 16px", borderBottom: `1px solid ${t.borderLight}`, alignItems: "center", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = t.name === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                onClick={() => { onSchoolClick(school); onClose(); }}>
                <span style={{ fontSize: "10px", color: t.textFaint }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "11px", color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{school.name}</p>
                  {url && <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "9px", color: t.accent, textDecoration: "underline" }}>↗ {school.school_url}</a>}
                </div>
                <span style={{ fontSize: "11px", color: t.textMuted }}>{school.intl_count?.toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: t.textMuted }}>${school.tuition?.toLocaleString()}</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", color }}>{school.valueScore?.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "8px 16px", borderTop: `1px solid ${t.border}`, fontSize: "10px", color: t.textFaint }}>Click a school to view details · Click outside to close</div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [{ key: "intl", label: "Intl ▾" }, { key: "value", label: "Score ▾" }, { key: "tuition", label: "Tuition ▴" }];

export default function DrillDownPanel({ selectedState, selectedSchool, stateData, onSchoolClick }) {
  const { t } = useTheme();
  const [sortKey, setSortKey] = useState("intl");
  const [showModal, setShowModal] = useState(false);
  const [expandedSchool, setExpandedSchool] = useState(null);

  const handleSchoolClick = (school) => { setExpandedSchool(school); onSchoolClick(school); };

  const totalInst = stateData.length;
  const totalStudents = stateData.reduce((s, d) => s + (d.enrollment_size ?? 0), 0);
  const totalIntl = stateData.reduce((s, d) => s + (d.intl_count ?? 0), 0);
  const avgTuition = totalInst > 0 ? Math.round(stateData.reduce((s, d) => s + (d.tuition ?? 0), 0) / totalInst) : 0;

  const top10 = [...stateData].sort((a, b) => {
    if (sortKey === "intl") return (b.intl_count ?? 0) - (a.intl_count ?? 0);
    if (sortKey === "value") return (b.valueScore ?? 0) - (a.valueScore ?? 0);
    if (sortKey === "tuition") return (a.tuition ?? 0) - (b.tuition ?? 0);
    return 0;
  }).slice(0, 10);

  if (!selectedState) {
    return (
      <div style={{ height: "100%", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: t.bgCard }}>
        <div style={{ textAlign: "center", color: t.textFaint, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          <p style={{ fontSize: "24px", margin: "0 0 8px" }}>▦</p>
          <p style={{ margin: 0 }}>Click a state on the</p>
          <p style={{ margin: 0 }}>map to drill down</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ height: "100%", border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", overflow: "hidden", background: t.bgCard }}>
        {/* Header */}
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: "9px", color: t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>▶ State Detail</p>
          <p style={{ margin: 0, fontSize: "14px", color: t.accent, fontWeight: "bold", letterSpacing: "0.08em" }}>{selectedState.toUpperCase()}</p>
        </div>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", padding: "8px", flexShrink: 0 }}>
          <StatCard label="Institutions" value={totalInst.toLocaleString()} t={t} />
          <StatCard label="Total Students" value={totalStudents.toLocaleString()} t={t} />
          <StatCard label="Intl Students" value={totalIntl.toLocaleString()} t={t} />
          <StatCard label="Avg Tuition" value={`$${avgTuition.toLocaleString()}`} t={t} />
        </div>
        {/* School detail */}
        {expandedSchool && expandedSchool.state_name === selectedState && (
          <SchoolDetailCard school={expandedSchool} onClose={() => setExpandedSchool(null)} t={t} />
        )}
        {/* Sort + View All */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 8px", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: "10px", color: t.textFaint, marginRight: "2px" }}>Sort:</span>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setSortKey(key)} style={{ padding: "2px 8px", fontSize: "10px", background: "none", cursor: "pointer", border: `1px solid ${sortKey === key ? t.accent : t.border}`, color: sortKey === key ? t.accent : t.textFaint }}>{label}</button>
          ))}
          <button onClick={() => setShowModal(true)} style={{ marginLeft: "auto", padding: "2px 8px", fontSize: "10px", border: `1px solid ${t.amber}`, color: t.amber, background: "none", cursor: "pointer" }}>All {totalInst} ↗</button>
        </div>
        {/* Top 10 */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <p style={{ margin: "6px 12px 2px", fontSize: "9px", color: t.textFaint, letterSpacing: "0.08em", textTransform: "uppercase" }}>Top 10</p>
          {top10.length === 0
            ? <p style={{ fontSize: "11px", color: t.textFaint, textAlign: "center", padding: "16px" }}>No schools match filters</p>
            : <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {top10.map((school, i) => <SchoolRow key={school.name} school={school} rank={i + 1} isSelected={expandedSchool?.name === school.name} onClick={handleSchoolClick} t={t} />)}
              </ul>
          }
        </div>
      </div>
      {showModal && <FullListModal stateData={stateData} sortKey={sortKey} selectedState={selectedState} onClose={() => setShowModal(false)} onSchoolClick={handleSchoolClick} t={t} />}
    </>
  );
}