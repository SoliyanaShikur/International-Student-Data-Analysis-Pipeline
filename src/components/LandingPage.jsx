/**
 * LandingPage.jsx — EduScope marketing homepage
 *
 * Design: Editorial/brutalist contrast — cream/off-white background with
 * a precise ink-grid, black serif headlines, cyan + amber accent punches.
 * Feels like a premium data publication (think The Economist meets Bloomberg).
 *
 * Sections:
 *  1. Nav bar
 *  2. Hero — headline + animated stats counter
 *  3. What is EduScope — explanation for two audiences
 *  4. Feature showcase — 3 key capabilities
 *  5. Live stats strip — pulled from Flask API
 *  6. How it works — 4-step process
 *  7. CTA strip — go to dashboard / contact
 *  8. Footer
 */

import { useState, useEffect, useRef } from "react";

const API_BASE = "http://127.0.0.1:5001/api/colleges";

// ── Animated number counter ───────────────────────────────────────────────────
function CountUp({ target, prefix = "", suffix = "", duration = 2000 }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || target === 0) return;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(253,251,245,0.97)" : "transparent",
      borderBottom: scrolled ? "1px solid #d4c9a8" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(8px)" : "none",
      transition: "all 0.3s ease",
      padding: "0 48px", height: "60px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "1px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: "900", color: "#0a0a0a", letterSpacing: "-0.02em" }}>Edu</span>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: "900", color: "#00b4d8", letterSpacing: "-0.02em" }}>Scope</span>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
        {[["Features", "#features"], ["How It Works", "#how"], ["Data", "#stats"]].map(([label, href]) => (
          <a key={label} href={href} style={{ fontSize: "13px", color: "#4a4a4a", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em", transition: "color 0.15s" }}
            onMouseEnter={e => e.target.style.color = "#00b4d8"}
            onMouseLeave={e => e.target.style.color = "#4a4a4a"}
          >{label}</a>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => onNavigate("contact")} style={{
          padding: "7px 16px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
          background: "transparent", border: "1px solid #0a0a0a", color: "#0a0a0a", cursor: "pointer",
          letterSpacing: "0.08em", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#0a0a0a"; e.currentTarget.style.color = "#fdfbf5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0a0a0a"; }}
        >CONTACT</button>
        <button onClick={() => onNavigate("dashboard")} style={{
          padding: "7px 16px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
          background: "#00b4d8", border: "1px solid #00b4d8", color: "#fdfbf5", cursor: "pointer",
          letterSpacing: "0.08em", fontWeight: "bold", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#0097b8"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#00b4d8"; }}
        >OPEN DASHBOARD →</button>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onNavigate, stats }) {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      background: "#fdfbf5",
      backgroundImage: `
        linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
      position: "relative", overflow: "hidden",
      paddingTop: "60px",
    }}>
      {/* Accent corner marks */}
      {[["top:60px", "left:0", "borderTop:2px solid #00b4d8", "borderLeft:2px solid #00b4d8"],
        ["top:60px", "right:0", "borderTop:2px solid #f59e0b", "borderRight:2px solid #f59e0b"],
        ["bottom:0", "left:0", "borderBottom:2px solid #f59e0b", "borderLeft:2px solid #f59e0b"],
        ["bottom:0", "right:0", "borderBottom:2px solid #00b4d8", "borderRight:2px solid #00b4d8"],
      ].map((corners, i) => {
        const style = { position: "absolute", width: "40px", height: "40px" };
        corners.forEach(s => { const [k, v] = s.split(":"); style[k] = v; });
        return <div key={i} style={style} />;
      })}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 48px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>

          {/* Left: Text */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <div style={{ width: "32px", height: "1px", background: "#00b4d8" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#00b4d8", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Education Intelligence Platform
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(36px, 5vw, 58px)", fontWeight: "900",
              color: "#0a0a0a", lineHeight: 1.05, margin: "0 0 24px",
              letterSpacing: "-0.03em",
            }}>
              The Data Terminal for<br />
              <span style={{ color: "#00b4d8" }}>International</span>{" "}
              <span style={{ position: "relative", display: "inline-block" }}>
                Education
                {/* <span style={{ position: "absolute", bottom: "4px", left: 0, right: 0, height: "3px", background: "#f59e0b" }} /> */}
              </span>
            </h1>

            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: "#5a5a5a",
              lineHeight: 1.8, margin: "0 0 36px", maxWidth: "460px",
            }}>
              Real-time analytics on 7,000+ US institutions — built for university administrators benchmarking market share and international students hunting hidden gems.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("dashboard")} style={{
                padding: "14px 28px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: "bold", letterSpacing: "0.12em", cursor: "pointer",
                background: "#0a0a0a", color: "#fdfbf5", border: "2px solid #0a0a0a",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#00b4d8"; e.currentTarget.style.borderColor = "#00b4d8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0a0a0a"; e.currentTarget.style.borderColor = "#0a0a0a"; }}
              >▶ EXPLORE DASHBOARD</button>

              <button onClick={() => onNavigate("contact")} style={{
                padding: "14px 28px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.12em", cursor: "pointer",
                background: "transparent", color: "#0a0a0a", border: "2px solid #d4c9a8",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#0a0a0a"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#d4c9a8"; }}
              >REQUEST CUSTOM INSIGHTS</button>
            </div>
          </div>

          {/* Right: Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { value: stats.totalInstitutions, prefix: "", suffix: "+", label: "Institutions Tracked", color: "#00b4d8", size: "36px" },
              { value: stats.totalIntl, prefix: "", suffix: "+", label: "International Students", color: "#f59e0b", size: "36px" },
              { value: stats.stateCount, prefix: "", suffix: " States", label: "Full Coverage", color: "#0a0a0a", size: "36px" },
              { value: stats.avgEarnings, prefix: "$", suffix: "", label: "Avg 10yr Earnings", color: "#22c55e", size: "32px" },
            ].map(({ value, prefix, suffix, label, color, size }, i) => (
              <div key={label} style={{
                background: "#fdfbf5", border: "1px solid #d4c9a8",
                padding: "24px 20px",
                position: "relative", overflow: "hidden",
                animation: `fadeUp 0.6s ease ${i * 0.1 + 0.3}s both`,
              }}>
                {/* Corner accent */}
                <div style={{ position: "absolute", top: 0, right: 0, width: "20px", height: "20px", borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
                <p style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', Georgia, serif", fontSize: size, fontWeight: "900", color, lineHeight: 1 }}>
                  <CountUp target={value} prefix={prefix} suffix={suffix} />
                </p>
                <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Audience section ──────────────────────────────────────────────────────────
function AudienceSection() {
  return (
    <section style={{ background: "#0d1117", padding: "80px 48px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          <div style={{ width: "32px", height: "1px", background: "#f59e0b" }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#f59e0b", letterSpacing: "0.2em", textTransform: "uppercase" }}>Built for two audiences</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
          {[
            {
              // icon: "🎓",
              audience: "International Applicants",
              headline: "Find Your Hidden Gem",
              body: "Stop overpaying for prestige. EduScope's Value Score algorithm ranks schools by (Earnings ÷ Tuition) × International Density — surfacing affordable schools with thriving international communities and strong post-grad outcomes.",
              bullets: ["Filter by max tuition + min international students", "Compare 10-year earnings across schools", "Identify low-cost, high-ROI institutions", "View full school details + website links"],
              accent: "#00b4d8",
            },
            {
              // icon: "📊",
              audience: "University Administrators",
              headline: "Benchmark Your Market Share",
              body: "Understand where your institution sits in the competitive landscape. Track international student density, compare tuition positioning, and identify which competitors are capturing your prospective student market.",
              bullets: ["State-by-state competitive analysis", "International enrollment benchmarking", "Tuition vs. outcomes correlation maps", "AI-generated strategic recommendations"],
              accent: "#f59e0b",
            },
          ].map(({ icon, audience, headline, body, bullets, accent }) => (
            <div key={audience} style={{ background: "#111", border: `1px solid #1e1e1e`, padding: "48px 40px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>{icon}</div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: accent, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 8px" }}>{audience}</p>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "28px", fontWeight: "900", color: "#fdfbf5", margin: "0 0 16px", lineHeight: 1.1 }}>{headline}</h3>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#aba8a8", lineHeight: 1.8, margin: "0 0 24px" }}>{body}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {bullets.map(b => (
                  <div key={b} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ color: accent, fontSize: "10px", marginTop: "3px", flexShrink: 0 }}>▸</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#9a9a9a", lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function FeaturesSection({ onNavigate }) {
  const features = [
    {
      number: "01",
      title: "Choropleth Map",
      desc: "Interactive US map showing international student density by state. Click any state to drill down. Double-click to zoom in. Color-encoded by student volume.",
      tag: "MACRO VIEW",
      color: "#00b4d8",
    },
    {
      number: "02",
      title: "Scatter Analysis",
      desc: "Plot every institution on Tuition vs International Enrollment axes. Bubble size = total enrollment. Hidden Gem zone highlights the best-value quadrant.",
      tag: "CORRELATION",
      color: "#f59e0b",
    },
    {
      number: "03",
      title: "Value Score Algorithm",
      desc: "(Earnings ÷ Tuition) × International Density × 100. Log-normalized so one elite school doesn't crush the entire distribution. Updated live as you filter.",
      tag: "ALGORITHM",
      color: "#22c55e",
    },
    {
      number: "04",
      title: "AI Insights",
      desc: "Claude AI generates context-aware analysis — tailored narratives for applicants (hidden gems) or administrators (competitive strategy) based on your filters.",
      tag: "AI POWERED",
      color: "#a855f7",
    },
    {
      number: "05",
      title: "Advanced Filtering",
      desc: "Slice by max tuition, min international students, enrollment size, admission rate, and High ROI toggle. All filtering is instant — no page reloads.",
      tag: "FILTERS",
      color: "#f59e0b",
    },
    {
      number: "06",
      title: "Full Institution List",
      desc: "View all institutions in any state sorted by international count, value score, or tuition. Clickable school websites. Drill into 8 metrics per institution.",
      tag: "DRILL-DOWN",
      color: "#00b4d8",
    },
  ];

  return (
    <section id="features" style={{
      background: "#fdfbf5",
      backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
      padding: "100px 48px",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "32px", height: "1px", background: "#00b4d8" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#00b4d8", letterSpacing: "0.2em", textTransform: "uppercase" }}>Platform Capabilities</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "42px", fontWeight: "900", color: "#0a0a0a", margin: 0, letterSpacing: "-0.02em" }}>
            Six Tools. One Terminal.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
          {features.map(({ number, title, desc, tag, color }) => (
            <div key={title} style={{ background: "#fdfbf5", border: "1px solid #e8e0cc", padding: "32px 28px", position: "relative", transition: "border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = "#fff8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e0cc"; e.currentTarget.style.background = "#fdfbf5"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "48px", fontWeight: "900", color: "#e8e0cc", lineHeight: 1 }}>{number}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color, border: `1px solid ${color}`, padding: "2px 7px", letterSpacing: "0.1em" }}>{tag}</span>
              </div>
              <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: "700", color: "#0a0a0a", margin: "0 0 10px" }}>{title}</h4>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#5a5a5a", lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <button onClick={() => onNavigate("dashboard")} style={{
            padding: "14px 36px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: "bold", letterSpacing: "0.12em", cursor: "pointer",
            background: "#0a0a0a", color: "#fdfbf5", border: "2px solid #0a0a0a",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#00b4d8"; e.currentTarget.style.borderColor = "#00b4d8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#0a0a0a"; e.currentTarget.style.borderColor = "#0a0a0a"; }}
          >OPEN THE TERMINAL →</button>
        </div>
      </div>
    </section>
  );
}

// ── Live stats strip ──────────────────────────────────────────────────────────
function StatsStrip({ stats }) {
  return (
    <section id="stats" style={{ background: "#0a0a0a", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Institutions in Database", value: stats.totalInstitutions, prefix: "", suffix: "", color: "#00b4d8" },
          { label: "International Students", value: stats.totalIntl, prefix: "", suffix: "+", color: "#f59e0b" },
          { label: "States + DC Covered", value: stats.stateCount, prefix: "", suffix: "/51", color: "#22c55e" },
          { label: "Avg Out-of-State Tuition", value: stats.avgTuition, prefix: "$", suffix: "", color: "#a855f7" },
        ].map(({ label, value, prefix, suffix, color }, i) => (
          <div key={label} style={{
            padding: "40px 32px", borderRight: i < 3 ? "1px solid #1e1e1e" : "none",
            textAlign: "center",
          }}>
            <p style={{ margin: "0 0 6px", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "40px", fontWeight: "900", color, lineHeight: 1 }}>
              <CountUp target={value} prefix={prefix} suffix={suffix} />
            </p>
            <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks({ onNavigate }) {
  const steps = [
    { n: "1", title: "Select a State", desc: "Click any state on the choropleth map. The drill-down panel instantly populates with institutions, stats, and rankings." },
    { n: "2", title: "Apply Filters", desc: "Adjust tuition ceiling, minimum international enrollment, admission rate, and toggle High ROI to narrow your dataset." },
    { n: "3", title: "Explore Schools", desc: "View the top 10 list or open the full modal. Click any school for 8 metrics including completion rate, earnings, and website." },
    { n: "4", title: "Get AI Analysis", desc: "Hit 'AI Insights' for a Claude-generated narrative — customized for your profile as an applicant or administrator." },
  ];

  return (
    <section id="how" style={{
      background: "#fdfbf5",
      backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
      padding: "100px 48px",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: "32px", height: "1px", background: "#f59e0b" }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#f59e0b", letterSpacing: "0.2em", textTransform: "uppercase" }}>Workflow</span>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "42px", fontWeight: "900", color: "#0a0a0a", margin: "0 0 60px", letterSpacing: "-0.02em" }}>
          From data to decision<br />in four steps.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", position: "relative" }}>
          {/* Connecting line */}
          <div style={{ position: "absolute", top: "28px", left: "12.5%", right: "12.5%", height: "1px", background: "#d4c9a8", zIndex: 0 }} />

          {steps.map(({ n, title, desc }, i) => (
            <div key={n} style={{ padding: "0 20px", position: "relative", zIndex: 1 }}>
              {/* Step number */}
              <div style={{
                width: "56px", height: "56px", background: i === 0 ? "#0a0a0a" : "#fdfbf5",
                border: `2px solid ${i === 0 ? "#0a0a0a" : "#d4c9a8"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "900",
                color: i === 0 ? "#fdfbf5" : "#0a0a0a", marginBottom: "24px",
              }}>{n}</div>
              <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "18px", fontWeight: "700", color: "#0a0a0a", margin: "0 0 10px" }}>{title}</h4>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#5a5a5a", lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────────────────
function CTASection({ onNavigate }) {
  return (
    <section style={{ background: "#0a0a0a", padding: "100px 48px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#00b4d8", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Ready to explore?
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "48px", fontWeight: "900", color: "#fdfbf5", margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          The data is live.<br />
          <span style={{ color: "#00b4d8" }}>The terminal is open.</span>
        </h2>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#6b6b6b", lineHeight: 1.8, margin: "0 0 40px" }}>
          Need a custom dashboard for your institution? A specific analysis?<br />Reach out — custom insights are available.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button onClick={() => onNavigate("dashboard")} style={{
            padding: "16px 36px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: "bold", letterSpacing: "0.12em", cursor: "pointer",
            background: "#00b4d8", color: "#0a0a0a", border: "2px solid #00b4d8", transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#0097b8"}
            onMouseLeave={e => e.currentTarget.style.background = "#00b4d8"}
          >▶ OPEN DASHBOARD</button>
          <button onClick={() => onNavigate("contact")} style={{
            padding: "16px 36px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.12em", cursor: "pointer",
            background: "transparent", color: "#fdfbf5", border: "2px solid #333", transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#fdfbf5"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#333"}
          >REQUEST CUSTOM INSIGHTS</button>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ onNavigate }) {
  return (
    <footer style={{ background: "#040404", borderTop: "1px solid #1a1a1a", padding: "40px 48px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1px", marginBottom: "6px" }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "16px", fontWeight: "900", color: "#fdfbf5" }}>Edu</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "16px", fontWeight: "900", color: "#00b4d8" }}>Scope</span>
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#374151", margin: 0 }}>
            Data: US Dept. of Education College Scorecard · Built with React, D3, Flask, PostgreSQL
          </p>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[["Dashboard", "dashboard"], ["Contact", "contact"]].map(([label, page]) => (
            <button key={label} onClick={() => onNavigate(page)} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#4b5563",
              background: "none", border: "none", cursor: "pointer", transition: "color 0.15s",
            }}
              onMouseEnter={e => e.target.style.color = "#00b4d8"}
              onMouseLeave={e => e.target.style.color = "#4b5563"}
            >{label}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage({ onNavigate }) {
  const [stats, setStats] = useState({ totalInstitutions: 0, totalIntl: 0, stateCount: 0, avgTuition: 0, avgEarnings: 0 });

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Mono:wght@400;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Fetch live stats from Flask
    fetch(`${API_BASE}?max_tuition=80000&min_intl=0&min_enrollment=0`)
      .then(r => r.json())
      .then(data => {
        const totalIntl = data.reduce((s, d) => s + (d.intl_count ?? 0), 0);
        const states = new Set(data.map(d => d.state_name).filter(Boolean));
        const avgTuition = data.filter(d => d.tuition > 0).length > 0
          ? Math.round(data.filter(d => d.tuition > 0).reduce((s, d) => s + d.tuition, 0) / data.filter(d => d.tuition > 0).length) : 0;
        const validEarnings = data.filter(d => d.earnings_in_10yrs > 0);
        const avgEarnings = validEarnings.length > 0
          ? Math.round(validEarnings.reduce((s, d) => s + d.earnings_in_10yrs, 0) / validEarnings.length) : 0;
        setStats({ totalInstitutions: data.length, totalIntl, stateCount: states.size, avgTuition, avgEarnings });
      })
      .catch(() => {
        // Fallback stats if Flask not running
        setStats({ totalInstitutions: 6900, totalIntl: 520000, stateCount: 51, avgTuition: 24800, avgEarnings: 38400 });
      });
  }, []);

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
      <Nav onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} stats={stats} />
      <AudienceSection />
      <FeaturesSection onNavigate={onNavigate} />
      <StatsStrip stats={stats} />
      <HowItWorks onNavigate={onNavigate} />
      <CTASection onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}