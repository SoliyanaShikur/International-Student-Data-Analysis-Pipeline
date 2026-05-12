/**
 * App.jsx — Root with simple client-side routing
 *
 * Pages:
 *   "home"      → LandingPage
 *   "dashboard" → Dashboard (map, scatter, filters, drilldown)
 *   "contact"   → ContactPage
 *
 * No React Router needed — simple useState page switcher.
 * URL hash is updated so browser back button works.
 */

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "./theme";
import LandingPage from "./components/LandingPage";
import ContactPage from "./components/ContactPage";
import TopBar from "./components/TopBar";
import FilterSidebar from "./components/FilterSidebar";
import ChoroplethMap from "./components/ChoroplethMap";
import ScatterPlot from "./components/ScatterPlot";
import DrillDownPanel from "./components/DrillDownPanel";
import { computeValueScore } from "./utils/valueScore";
import TutorialOverlay from "./components/TutorialOverlay";

const API_BASE = import.meta.env.VITE_API_BASE || "https://international-student-data-analysis.onrender.com/api/colleges";
function Dashboard({ onNavigate }) {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    maxTuition: 80000, minIntl: 0, minEnrollment: 0,
    maxAdmissionRate: 100, highRoiOnly: false,
  });
  const [selectedState, setSelectedState] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [activeView, setActiveView] = useState("map");

  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem("eduscope_tutorial_done"); }
    catch { return true; }
  });
 
  const closeTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem("eduscope_tutorial_done", "1"); } catch {}
  };


  useEffect(() => {
    fetch(`${API_BASE}?max_tuition=80000&min_intl=0&min_enrollment=0`)
      .then(r => r.json())
      .then(data => {
        const enriched = data.map(d => ({ ...d, valueScore: computeValueScore(d) }));
        setAllData(enriched);
        setFilteredData(enriched);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    const scores = allData.map(d => d.valueScore).sort((a, b) => a - b);
    const p70 = scores[Math.floor(scores.length * 0.7)] ?? 0;
    const result = allData.filter(d => {
      if (d.tuition > filters.maxTuition) return false;
      if (d.intl_count < filters.minIntl) return false;
      if (d.enrollment_size < filters.minEnrollment) return false;
      if ((d.admission_rate ?? 1) * 100 > filters.maxAdmissionRate) return false;
      if (filters.highRoiOnly && d.valueScore < p70) return false;
      return true;
    });
    setFilteredData(result);
  }, [filters, allData]);

  const stateAggregates = filteredData.reduce((acc, d) => {
    const s = d.state_name;
    if (!s) return acc;
    if (!acc[s]) acc[s] = { totalIntl: 0, scoreSum: 0, institutionCount: 0, avgValueScore: 0 };
    acc[s].totalIntl += d.intl_count ?? 0;
    acc[s].scoreSum += d.valueScore;
    acc[s].institutionCount += 1;
    acc[s].avgValueScore = acc[s].scoreSum / acc[s].institutionCount;
    return acc;
  }, {});

  const activeFilterCount =
    (filters.maxTuition < 80000 ? 1 : 0) +
    (filters.minIntl > 0 ? 1 : 0) +
    (filters.minEnrollment > 0 ? 1 : 0) +
    (filters.maxAdmissionRate < 100 ? 1 : 0) +
    (filters.highRoiOnly ? 1 : 0);

  const { t } = useTheme();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: t.bg, color: t.text, fontFamily: "'IBM Plex Mono', monospace", overflow: "hidden" }}>

      {/* TopBar with home button */}
      <TopBar
        filteredCount={filteredData.length}
        totalCount={allData.length}
        activeView={activeView}
        onViewChange={setActiveView}
        activeFilterCount={activeFilterCount}
        onHome={() => onNavigate("home")}
        onTutorial={() => setShowTutorial(true)}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Filter sidebar */}
        <div style={{ width: "260px", flexShrink: 0, borderRight: `1px solid ${t.border}`, overflowY: "auto", background: t.bgSidebar }}>
          <FilterSidebar
            filters={filters}
            onFilterChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
            selectedState={selectedState}
            filteredData={filteredData}
          />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Viz — 65% */}
            <div style={{ flex: "0 0 65%", borderRight: `1px solid ${t.border}`, overflow: "hidden" }}>
              {activeView === "map"
                ? <ChoroplethMap stateAggregates={stateAggregates} selectedState={selectedState}
                    onStateClick={s => { setSelectedState(s); setSelectedSchool(null); }} loading={loading} />
                : <ScatterPlot data={filteredData} selectedState={selectedState} onSchoolClick={setSelectedSchool} />}
            </div>
            {/* Drill-down — 35% */}
            <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
              <DrillDownPanel selectedState={selectedState} selectedSchool={selectedSchool}
                stateData={filteredData.filter(d => d.state_name === selectedState)}
                onSchoolClick={setSelectedSchool} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ position: "fixed", bottom: 16, right: 16, background: "#1a0a0a", border: "1px solid #dc2626", color: "#fca5a5", padding: "12px 16px", fontSize: "12px", fontFamily: "monospace" }}>
          ⚠ {error} — Is Flask running on port 5001?

        </div>
      )}
       {showTutorial && <TutorialOverlay onClose={closeTutorial} />}
    </div>
  );
}

// ── Root router ───────────────────────────────────────────────────────────────
export default function App() {
  // Read initial page from hash
  const getInitialPage = () => {
    const hash = window.location.hash.replace("#", "");
    return ["home", "dashboard", "contact"].includes(hash) ? hash : "home";
  };

  const [page, setPage] = useState(getInitialPage);

  const navigate = useCallback((target) => {
    setPage(target);
    window.location.hash = target;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "dashboard", "contact"].includes(hash)) setPage(hash);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (page === "home") return <LandingPage onNavigate={navigate} />;
  if (page === "contact") return <ContactPage onNavigate={navigate} />;
  return <Dashboard onNavigate={navigate} />;
}
