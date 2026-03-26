/**
 * ContactPage.jsx — Custom insights request page
 *
 * Self-marketing page for requesting custom dashboards/analysis.
 * Same cream + grid aesthetic as landing page.
 * Form fields: name, email, role (applicant/admin/researcher/other),
 * institution, message, type of insight needed.
 */

import { useState } from "react";

function Nav({ onNavigate }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(253,251,245,0.97)", borderBottom: "1px solid #d4c9a8",
      backdropFilter: "blur(8px)", padding: "0 48px", height: "60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "1px", cursor: "pointer" }} onClick={() => onNavigate("home")}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: "900", color: "#0a0a0a" }}>Edu</span>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: "900", color: "#00b4d8" }}>Scope</span>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => onNavigate("home")} style={{ padding: "7px 16px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", background: "transparent", border: "1px solid #d4c9a8", color: "#0a0a0a", cursor: "pointer", letterSpacing: "0.08em" }}>← HOME</button>
        <button onClick={() => onNavigate("dashboard")} style={{ padding: "7px 16px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", background: "#00b4d8", border: "1px solid #00b4d8", color: "#fdfbf5", cursor: "pointer", letterSpacing: "0.08em", fontWeight: "bold" }}>DASHBOARD →</button>
      </div>
    </nav>
  );
}

export default function ContactPage({ onNavigate }) {
  const [form, setForm] = useState({ name: "", email: "", role: "", institution: "", insightType: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputStyle = (field) => ({
    width: "100%", padding: "12px 14px",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px",
    background: "#fdfbf5", color: "#0a0a0a",
    border: `1px solid ${focused === field ? "#00b4d8" : "#d4c9a8"}`,
    outline: "none", transition: "border-color 0.15s",
    boxSizing: "border-box",
  });

  const labelStyle = {
    display: "block", fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px", color: "#6b6b6b", letterSpacing: "0.12em",
    textTransform: "uppercase", marginBottom: "6px",
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fdfbf5",
      backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet" />

      <Nav onNavigate={onNavigate} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 48px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>

          {/* ── Left: Copy ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "32px", height: "1px", background: "#f59e0b" }} />
              <span style={{ fontSize: "10px", color: "#f59e0b", letterSpacing: "0.2em", textTransform: "uppercase" }}>Custom Intelligence</span>
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "48px", fontWeight: "900", color: "#0a0a0a", margin: "0 0 20px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              Need a custom<br />
              <span style={{ color: "#00b4d8" }}>insight?</span>
            </h1>

            <p style={{ fontSize: "12px", color: "#5a5a5a", lineHeight: 1.8, margin: "0 0 40px" }}>
              EduScope is built on a live pipeline of 7,000+ institutions. Beyond the public dashboard, custom analyses, filtered exports, and tailored dashboards are available on request.
            </p>

            {/* What I offer */}
            <div style={{ marginBottom: "40px" }}>
              <p style={{ fontSize: "10px", color: "#0a0a0a", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 16px", fontWeight: "bold" }}>What's available:</p>
              {[
                ["*", "Custom State/Region Analysis", "Deep-dive reports for specific states, comparing international enrollment, tuition, and ROI across all institutions."],
                ["*", "Competitor Benchmarking", "For university admissions teams — see exactly where competitors are gaining international students and at what price point."],
                ["*", "Hidden Gem Shortlists", "Curated lists of best-value schools for specific student profiles (budget range, field of study, state preference)."],
                ["*", "Trend Dashboards", "Custom-built dashboards with your branding, filtered to your institution's competitive set."],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: "flex", gap: "16px", marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #e8e0cc" }}>
                  <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>{icon}</span>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#0a0a0a", fontWeight: "bold" }}>{title}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#6b6b6b", lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial-style quote box */}
            <div style={{ border: "1px solid #d4c9a8", padding: "24px", background: "#fff8f0", position: "relative" }}>
              <div style={{ position: "absolute", top: "-1px", left: "20px", width: "40px", height: "2px", background: "#f59e0b" }} />
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#0a0a0a", lineHeight: 1.7, margin: "0 0 12px", fontStyle: "italic" }}>
                "Built on the US Department of Education's College Scorecard — the same data used by policy researchers and institutional planners."
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "#6b6b6b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Data Source · Updated Annually
              </p>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div>
            {submitted ? (
              // Success state
              <div style={{ border: "1px solid #d4c9a8", padding: "60px 40px", textAlign: "center", background: "#fdfbf5" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>✓</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: "900", color: "#0a0a0a", margin: "0 0 12px" }}>Request received.</h3>
                <p style={{ fontSize: "12px", color: "#5a5a5a", lineHeight: 1.7, margin: "0 0 32px" }}>
                  Thanks {form.name.split(" ")[0]}. I'll review your request and follow up within 24–48 hours.
                </p>
                <button onClick={() => onNavigate("dashboard")} style={{
                  padding: "12px 28px", fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: "bold", letterSpacing: "0.1em", cursor: "pointer",
                  background: "#0a0a0a", color: "#fdfbf5", border: "2px solid #0a0a0a",
                }}>EXPLORE THE DASHBOARD →</button>
              </div>
            ) : (
              <div style={{ border: "1px solid #d4c9a8", padding: "40px", background: "#fdfbf5" }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "700", color: "#0a0a0a", margin: "0 0 28px" }}>
                  Request Custom Analysis
                </p>

                {/* Name + Email */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input value={form.name} onChange={e => set("name", e.target.value)}
                      onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                      placeholder="Your name" style={inputStyle("name")} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                      onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      placeholder="your@email.com" style={inputStyle("email")} />
                  </div>
                </div>

                {/* Role */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Your Role</label>
                  <select value={form.role} onChange={e => set("role", e.target.value)}
                    onFocus={() => setFocused("role")} onBlur={() => setFocused(null)}
                    style={{ ...inputStyle("role"), appearance: "none", cursor: "pointer" }}>
                    <option value="">Select your role...</option>
                    <option value="applicant">International Student / Applicant</option>
                    <option value="parent">Parent / Family</option>
                    <option value="admin">University Administrator</option>
                    <option value="admissions">Admissions Officer</option>
                    <option value="researcher">Researcher / Analyst</option>
                    <option value="consultant">Education Consultant</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Institution */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Institution / Organization</label>
                  <input value={form.institution} onChange={e => set("institution", e.target.value)}
                    onFocus={() => setFocused("institution")} onBlur={() => setFocused(null)}
                    placeholder="University, company, or N/A" style={inputStyle("institution")} />
                </div>

                {/* Type of insight */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Type of Insight Needed</label>
                  <select value={form.insightType} onChange={e => set("insightType", e.target.value)}
                    onFocus={() => setFocused("insightType")} onBlur={() => setFocused(null)}
                    style={{ ...inputStyle("insightType"), appearance: "none", cursor: "pointer" }}>
                    <option value="">Select type...</option>
                    <option value="shortlist">School Shortlist (applicant)</option>
                    <option value="benchmark">Competitor Benchmarking</option>
                    <option value="state">State / Region Analysis</option>
                    <option value="dashboard">Custom Dashboard</option>
                    <option value="export">Data Export</option>
                    <option value="other">Other / Not sure</option>
                  </select>
                </div>

                {/* Message */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>Tell me what you need *</label>
                  <textarea value={form.message} onChange={e => set("message", e.target.value)}
                    onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
                    placeholder="Describe your situation — budget constraints, target schools, competitive set, timeline, etc."
                    rows={5}
                    style={{ ...inputStyle("message"), resize: "vertical", minHeight: "120px" }} />
                </div>

                {/* Submit */}
                <button onClick={handleSubmit}
                  disabled={!form.name || !form.email || !form.message}
                  style={{
                    width: "100%", padding: "14px", fontSize: "12px",
                    fontFamily: "'IBM Plex Mono', monospace", fontWeight: "bold",
                    letterSpacing: "0.12em", cursor: (!form.name || !form.email || !form.message) ? "not-allowed" : "pointer",
                    background: (!form.name || !form.email || !form.message) ? "#e8e0cc" : "#0a0a0a",
                    color: (!form.name || !form.email || !form.message) ? "#9a9a9a" : "#fdfbf5",
                    border: "2px solid transparent", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { if (form.name && form.email && form.message) e.currentTarget.style.background = "#00b4d8"; }}
                  onMouseLeave={e => { if (form.name && form.email && form.message) e.currentTarget.style.background = "#0a0a0a"; }}
                >
                  SEND REQUEST →
                </button>

                <p style={{ fontSize: "10px", color: "#9a9a9a", textAlign: "center", margin: "12px 0 0" }}>
                  * Required fields. Response within 24–48 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}