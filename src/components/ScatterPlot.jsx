/**
 * ScatterPlot.jsx — D3 scatter: Tuition (X) vs International Students (Y)
 *
 * Fixes:
 *  - Hidden Gem zone rect uses pointer-events:none so dots are always clickable
 *  - SVG height fills container (no fixed 320px dead space)
 *  - Stats bar below chart shows live aggregate metrics
 *  - Dots drawn AFTER zone rect so they're always on top
 */

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const TIER_COLORS = {
  "Hidden Gem ★": "#f59e0b",
  "Solid Value": "#06b6d4",
  "Below Avg": "#374151",
};

function getScoreTier(score) {
  if (score >= 70) return { label: "Hidden Gem ★", color: "#f59e0b" };
  if (score >= 40) return { label: "Solid Value", color: "#06b6d4" };
  return { label: "Below Avg", color: "#374151" };
}

export default function ScatterPlot({ data, selectedState, onSchoolClick }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredSchool, setHoveredSchool] = useState(null);

  // ── Compute stats for the stats bar ────────────────────────────────────────
  const plotData = data.filter(d =>
    d.tuition > 0 && d.enrollment_size > 0 &&
    (selectedState ? d.state_name === selectedState : true)
  );

  const hiddenGems = plotData.filter(d => d.valueScore >= 70);
  const avgTuition = plotData.length > 0
    ? Math.round(plotData.reduce((s, d) => s + (d.tuition ?? 0), 0) / plotData.length) : 0;
  const avgIntl = plotData.length > 0
    ? Math.round(plotData.reduce((s, d) => s + (d.intl_count ?? 0), 0) / plotData.length) : 0;
  const avgEarnings = (() => {
    const valid = plotData.filter(d => d.earnings_in_10yrs > 0);
    return valid.length > 0
      ? Math.round(valid.reduce((s, d) => s + d.earnings_in_10yrs, 0) / valid.length) : 0;
  })();
  const maxIntlSchool = plotData.reduce((best, d) =>
    (d.intl_count ?? 0) > (best?.intl_count ?? 0) ? d : best, null);

  useEffect(() => {
    if (!svgRef.current || plotData.length === 0) return;

    const container = containerRef.current;
    const MARGIN = { top: 16, right: 16, bottom: 48, left: 68 };
    const WIDTH = (container?.clientWidth ?? 700) - MARGIN.left - MARGIN.right;
    const HEIGHT = (container?.clientHeight ?? 340) - MARGIN.top - MARGIN.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", WIDTH + MARGIN.left + MARGIN.right)
      .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // ── Scales ────────────────────────────────────────────────────────────
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(plotData, d => d.tuition) * 1.05 || 80000])
      .range([0, WIDTH]).nice();

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(plotData, d => d.intl_count) * 1.1 || 100])
      .range([HEIGHT, 0]).nice();

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(plotData, d => d.enrollment_size) || 50000])
      .range([2, 12]);

    // ── Grid ──────────────────────────────────────────────────────────────
    svg.append("g").call(
      d3.axisLeft(yScale).tickSize(-WIDTH).tickFormat("").ticks(5)
    ).call(g => {
      g.select(".domain").remove();
      g.selectAll(".tick line").attr("stroke", "#1a2d3d").attr("stroke-dasharray", "3,3");
    });

    svg.append("g").attr("transform", `translate(0,${HEIGHT})`).call(
      d3.axisBottom(xScale).tickSize(-HEIGHT).tickFormat("").ticks(6)
    ).call(g => {
      g.select(".domain").remove();
      g.selectAll(".tick line").attr("stroke", "#1a2d3d").attr("stroke-dasharray", "3,3");
    });

    // ── Axes ──────────────────────────────────────────────────────────────
    svg.append("g").attr("transform", `translate(0,${HEIGHT})`).call(
      d3.axisBottom(xScale).ticks(6).tickFormat(v => `$${d3.format(",")(v)}`)
    ).call(g => {
      g.select(".domain").attr("stroke", "#1e3a4a");
      g.selectAll(".tick line").attr("stroke", "#1e3a4a");
      g.selectAll(".tick text").attr("fill", "#4b5563").attr("font-size", "10px").attr("font-family", "monospace");
    });

    svg.append("g").call(
      d3.axisLeft(yScale).ticks(5).tickFormat(v => d3.format(",")(v))
    ).call(g => {
      g.select(".domain").attr("stroke", "#1e3a4a");
      g.selectAll(".tick line").attr("stroke", "#1e3a4a");
      g.selectAll(".tick text").attr("fill", "#4b5563").attr("font-size", "10px").attr("font-family", "monospace");
    });

    // Axis labels
    svg.append("text").attr("x", WIDTH / 2).attr("y", HEIGHT + 40)
      .attr("text-anchor", "middle").attr("fill", "#374151")
      .attr("font-size", "10px").attr("font-family", "monospace").attr("letter-spacing", "0.1em")
      .text("OUT-OF-STATE TUITION ($)");

    svg.append("text").attr("transform", "rotate(-90)")
      .attr("x", -HEIGHT / 2).attr("y", -55)
      .attr("text-anchor", "middle").attr("fill", "#374151")
      .attr("font-size", "10px").attr("font-family", "monospace").attr("letter-spacing", "0.1em")
      .text("INTERNATIONAL STUDENTS");

    // ── Hidden Gem zone — drawn FIRST, pointer-events:none so it never blocks clicks ──
    const medTuition = d3.median(plotData, d => d.tuition) ?? 30000;
    const medIntl = d3.median(plotData, d => d.intl_count) ?? 100;

    if (medTuition > 0 && medIntl > 0) {
      svg.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", xScale(medTuition))
        .attr("height", yScale(medIntl))
        .attr("fill", "#f59e0b").attr("fill-opacity", 0.03)
        .attr("stroke", "#f59e0b").attr("stroke-opacity", 0.12)
        .attr("stroke-dasharray", "4,4")
        .style("pointer-events", "none"); // ← KEY FIX: never intercepts mouse events

      svg.append("text")
        .attr("x", 5).attr("y", 11)
        .attr("fill", "#f59e0b").attr("fill-opacity", 0.35)
        .attr("font-size", "9px").attr("font-family", "monospace").attr("letter-spacing", "0.08em")
        .style("pointer-events", "none") // ← also passthrough
        .text("HIDDEN GEM ZONE");
    }

    // ── Dots — drawn AFTER zone rect so always on top ─────────────────────
    // Sort so Hidden Gems render last = highest z-order
    const sorted = [...plotData].sort((a, b) => a.valueScore - b.valueScore);

    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("circle.dot")
      .data(sorted, d => d.name)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.tuition))
      .attr("cy", d => yScale(d.intl_count))
      .attr("r", d => sizeScale(d.enrollment_size))
      .attr("fill", d => getScoreTier(d.valueScore).color)
      .attr("fill-opacity", d => d.valueScore >= 70 ? 0.9 : 0.65)
      .attr("stroke", d => d.valueScore >= 70 ? "#f59e0b" : "transparent")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .style("pointer-events", "all") // ← always clickable
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(80)
          .attr("r", sizeScale(d.enrollment_size) + 5)
          .attr("fill-opacity", 1);
        setHoveredSchool(d);
        const { label, color } = getScoreTier(d.valueScore);
        tooltip.style("display", "block").html(`
          <div style="color:${color};font-size:10px;font-weight:bold;margin-bottom:3px">${label}</div>
          <div style="color:#fff;font-size:12px;font-weight:bold;margin-bottom:5px;max-width:220px;line-height:1.3">${d.name}</div>
          <div style="font-size:11px;color:#94a3b8;line-height:1.8">
            ${d.state_name ?? "—"}<br/>
            Tuition: <b style="color:#e2e8f0">$${d.tuition?.toLocaleString()}</b><br/>
            Intl Students: <b style="color:#e2e8f0">${d.intl_count?.toLocaleString()}</b><br/>
            Enrollment: <b style="color:#e2e8f0">${d.enrollment_size?.toLocaleString()}</b><br/>
            10yr Earnings: <b style="color:#e2e8f0">${d.earnings_in_10yrs ? "$" + d.earnings_in_10yrs.toLocaleString() : "N/A"}</b><br/>
            Value Score: <b style="color:${color}">${d.valueScore?.toFixed(1)}</b>
          </div>
        `);
      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, document.body);
        tooltip.style("left", `${mx + 14}px`).style("top", `${my - 10}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(80)
          .attr("r", sizeScale(d.enrollment_size))
          .attr("fill-opacity", d.valueScore >= 70 ? 0.9 : 0.65);
        setHoveredSchool(null);
        tooltip.style("display", "none");
      })
      .on("click", (event, d) => {
        onSchoolClick(d);
      });

  }, [data, selectedState, onSchoolClick]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0c1820", border: "1px solid #1e3a4a" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid #1e3a4a", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: "#4b5563", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          ◎ Tuition vs International Enrollment {selectedState ? `— ${selectedState}` : "— All States"}
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {Object.entries(TIER_COLORS).map(([label, color]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
              <span style={{ fontSize: "10px", color: "#4b5563" }}>{label}</span>
            </span>
          ))}
          <span style={{ fontSize: "10px", color: "#374151" }}>● = enrollment</span>
        </div>
      </div>

      {/* ── D3 canvas ── */}
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {plotData.length === 0 ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: "11px", letterSpacing: "0.1em" }}>
            NO DATA MATCHES CURRENT FILTERS
          </div>
        ) : (
          <svg ref={svgRef} style={{ display: "block" }} />
        )}
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: "1px solid #1e3a4a", flexShrink: 0 }}>
        {[
          { label: "Schools Shown", value: plotData.length.toLocaleString() },
          { label: "Hidden Gems", value: hiddenGems.length.toLocaleString(), highlight: true },
          { label: "Avg Tuition", value: avgTuition > 0 ? `$${avgTuition.toLocaleString()}` : "N/A" },
          { label: "Avg Intl Students", value: avgIntl > 0 ? avgIntl.toLocaleString() : "N/A" },
          { label: "Avg 10yr Earnings", value: avgEarnings > 0 ? `$${avgEarnings.toLocaleString()}` : "N/A" },
        ].map(({ label, value, highlight }, i) => (
          <div key={label} style={{
            padding: "8px 12px",
            borderRight: i < 4 ? "1px solid #1e3a4a" : "none",
            background: "#080f15",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: highlight ? "#f59e0b" : "#00b4d8" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tooltip ── */}
      <div ref={tooltipRef} style={{
        position: "fixed", zIndex: 9999, display: "none", background: "#0c1820",
        border: "1px solid #1e3a4a", padding: "10px 12px", pointerEvents: "none",
        fontFamily: "'IBM Plex Mono', monospace", maxWidth: "260px",
      }} />
    </div>
  );
}