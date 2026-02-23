import { useState, useEffect, useCallback } from "react";
import TopBar from "./components/TopBar";
import FilterSidebar from "./components/FilterSidebar";
import ChoroplethMap from "./components/ChoroplethMap";
import ScatterPlot from "./components/ScatterPlot";
import DrillDownPanel from "./components/DrillDownPanel";
import { computeValueScore } from "./utils/valueScore";

const API_BASE = "http://127.0.0.1:5001/api/colleges";

export default function App() {
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

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#070d12", color: "#c9d6e0", fontFamily: "'IBM Plex Mono', monospace",
      overflow: "hidden"
    }}>

      <TopBar
        filteredCount={filteredData.length}
        totalCount={allData.length}
        activeView={activeView}
        onViewChange={setActiveView}
        activeFilterCount={
          (filters.maxTuition < 80000 ? 1 : 0) +
          (filters.minIntl > 0 ? 1 : 0) +
          (filters.minEnrollment > 0 ? 1 : 0) +
          (filters.maxAdmissionRate < 100 ? 1 : 0) +
          (filters.highRoiOnly ? 1 : 0)
        }
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Filter sidebar */}
        <div style={{
          width: "260px", flexShrink: 0, borderRight: "1px solid #1e3a4a",
          overflowY: "auto", background: "#080f15"
        }}>
          <FilterSidebar
            filters={filters}
            onFilterChange={(k, v) => setFilters(p => ({ ...p, [k]: v }))}
            selectedState={selectedState}
            filteredData={filteredData}
          />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top row: visualization + drilldown */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Map or Scatter — 65% */}
            <div style={{ flex: "0 0 65%", borderRight: "1px solid #1e3a4a", overflow: "hidden" }}>
              {activeView === "map"
                ? <ChoroplethMap stateAggregates={stateAggregates}
                  selectedState={selectedState}
                  onStateClick={s => { setSelectedState(s); setSelectedSchool(null); }}
                  loading={loading} />
                : <ScatterPlot data={filteredData} selectedState={selectedState}
                  onSchoolClick={setSelectedSchool} />}
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
        <div style={{
          position: "fixed", bottom: 16, right: 16, background: "#1a0a0a",
          border: "1px solid #dc2626", color: "#fca5a5", padding: "12px 16px", fontSize: 12
        }}>
          ⚠ {error} — Is Flask running on port 5001?
        </div>
      )}
    </div>
  );
}