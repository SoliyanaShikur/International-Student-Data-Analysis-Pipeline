import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useTheme } from "../theme";

export default function ScatterPlot({ data, selectedState, onSchoolClick }) {
  const { t } = useTheme();
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  const plotData = data.filter(d =>
    d.tuition > 0 && d.enrollment_size > 0 &&
    (selectedState ? d.state_name === selectedState : true)
  );

  const hiddenGems = plotData.filter(d => d.valueScore >= 70);
  const avgTuition = plotData.length > 0 ? Math.round(plotData.reduce((s, d) => s + (d.tuition ?? 0), 0) / plotData.length) : 0;
  const avgIntl = plotData.length > 0 ? Math.round(plotData.reduce((s, d) => s + (d.intl_count ?? 0), 0) / plotData.length) : 0;
  const validE = plotData.filter(d => d.earnings_in_10yrs > 0);
  const avgEarnings = validE.length > 0 ? Math.round(validE.reduce((s, d) => s + d.earnings_in_10yrs, 0) / validE.length) : 0;

  const getTierColor = (score) => {
    if (score >= 70) return t.amber;
    if (score >= 40) return t.accent;
    return t.dotBelow;
  };

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
      .append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3.scaleLinear().domain([0, d3.max(plotData, d => d.tuition) * 1.05 || 80000]).range([0, WIDTH]).nice();
    const yScale = d3.scaleLinear().domain([0, d3.max(plotData, d => d.intl_count) * 1.1 || 100]).range([HEIGHT, 0]).nice();
    const sizeScale = d3.scaleSqrt().domain([0, d3.max(plotData, d => d.enrollment_size) || 50000]).range([2, 12]);

    // Grid
    svg.append("g").call(d3.axisLeft(yScale).tickSize(-WIDTH).tickFormat("").ticks(5))
      .call(g => { g.select(".domain").remove(); g.selectAll(".tick line").attr("stroke", t.gridLine).attr("stroke-dasharray", "3,3"); });
    svg.append("g").attr("transform", `translate(0,${HEIGHT})`).call(d3.axisBottom(xScale).tickSize(-HEIGHT).tickFormat("").ticks(6))
      .call(g => { g.select(".domain").remove(); g.selectAll(".tick line").attr("stroke", t.gridLine).attr("stroke-dasharray", "3,3"); });

    // Axes
    svg.append("g").attr("transform", `translate(0,${HEIGHT})`).call(d3.axisBottom(xScale).ticks(6).tickFormat(v => `$${d3.format(",")(v)}`))
      .call(g => { g.select(".domain").attr("stroke", t.border); g.selectAll(".tick line").attr("stroke", t.border); g.selectAll(".tick text").attr("fill", t.axisText).attr("font-size", "10px").attr("font-family", "monospace"); });
    svg.append("g").call(d3.axisLeft(yScale).ticks(5).tickFormat(v => d3.format(",")(v)))
      .call(g => { g.select(".domain").attr("stroke", t.border); g.selectAll(".tick line").attr("stroke", t.border); g.selectAll(".tick text").attr("fill", t.axisText).attr("font-size", "10px").attr("font-family", "monospace"); });

    svg.append("text").attr("x", WIDTH / 2).attr("y", HEIGHT + 40).attr("text-anchor", "middle")
      .attr("fill", t.axisText).attr("font-size", "10px").attr("font-family", "monospace").attr("letter-spacing", "0.1em").text("OUT-OF-STATE TUITION ($)");
    svg.append("text").attr("transform", "rotate(-90)").attr("x", -HEIGHT / 2).attr("y", -55)
      .attr("text-anchor", "middle").attr("fill", t.axisText).attr("font-size", "10px").attr("font-family", "monospace").attr("letter-spacing", "0.1em").text("INTERNATIONAL STUDENTS");

    // Hidden Gem zone — pointer-events:none so never blocks clicks
    const medTuition = d3.median(plotData, d => d.tuition) ?? 30000;
    const medIntl = d3.median(plotData, d => d.intl_count) ?? 100;
    if (medTuition > 0 && medIntl > 0) {
      svg.append("rect").attr("x", 0).attr("y", 0)
        .attr("width", xScale(medTuition)).attr("height", yScale(medIntl))
        .attr("fill", t.gemZoneFill).attr("stroke", t.gemZoneStroke).attr("stroke-dasharray", "4,4")
        .style("pointer-events", "none");
      svg.append("text").attr("x", 5).attr("y", 11)
        .attr("fill", t.amber).attr("fill-opacity", 0.4).attr("font-size", "9px").attr("font-family", "monospace").attr("letter-spacing", "0.08em")
        .style("pointer-events", "none").text("HIDDEN GEM ZONE");
    }

    // Dots — drawn AFTER zone, always on top
    const sorted = [...plotData].sort((a, b) => a.valueScore - b.valueScore);
    const tooltip = d3.select(tooltipRef.current);
    const tooltipBg = t.name === "light" ? "#ffffff" : "#0c1820";

    svg.selectAll("circle.dot").data(sorted, d => d.name).enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.tuition)).attr("cy", d => yScale(d.intl_count))
      .attr("r", d => sizeScale(d.enrollment_size))
      .attr("fill", d => getTierColor(d.valueScore))
      .attr("fill-opacity", d => d.valueScore >= 70 ? 0.9 : 0.7)
      .attr("stroke", d => d.valueScore >= 70 ? t.amber : "transparent")
      .attr("stroke-width", 1.5).attr("cursor", "pointer")
      .style("pointer-events", "all")
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(80).attr("r", sizeScale(d.enrollment_size) + 5).attr("fill-opacity", 1);
        const color = getTierColor(d.valueScore);
        const label = d.valueScore >= 70 ? "Hidden Gem ★" : d.valueScore >= 40 ? "Solid Value" : "Below Avg";
        tooltip.style("display", "block").style("background", tooltipBg).style("border", `1px solid ${t.border}`).style("color", t.text).html(`
          <div style="color:${color};font-size:10px;font-weight:bold;margin-bottom:3px">${label}</div>
          <div style="font-size:12px;font-weight:bold;margin-bottom:5px;max-width:220px;line-height:1.3">${d.name}</div>
          <div style="font-size:11px;color:${t.textMuted};line-height:1.8">
            ${d.state_name ?? "—"}<br/>
            Tuition: <b>$${d.tuition?.toLocaleString()}</b><br/>
            Intl: <b>${d.intl_count?.toLocaleString()}</b><br/>
            Enrollment: <b>${d.enrollment_size?.toLocaleString()}</b><br/>
            10yr Earnings: <b>${d.earnings_in_10yrs ? "$" + d.earnings_in_10yrs.toLocaleString() : "N/A"}</b><br/>
            Value Score: <b style="color:${color}">${d.valueScore?.toFixed(1)}</b>
          </div>
        `);
      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, document.body);
        tooltip.style("left", `${mx + 14}px`).style("top", `${my - 10}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).transition().duration(80).attr("r", sizeScale(d.enrollment_size)).attr("fill-opacity", d.valueScore >= 70 ? 0.9 : 0.7);
        tooltip.style("display", "none");
      })
      .on("click", (event, d) => onSchoolClick(d));

  }, [data, selectedState, onSchoolClick, t]); // re-render on theme change

  const TIER_COLORS = [{ label: "Hidden Gem ★", color: t.amber }, { label: "Solid Value", color: t.accent }, { label: "Below Avg", color: t.dotBelow }];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: t.bgCard, border: `1px solid ${t.border}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          ◎ Tuition vs International Enrollment {selectedState ? `— ${selectedState}` : "— All States"}
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {TIER_COLORS.map(({ label, color }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
              <span style={{ fontSize: "10px", color: t.textFaint }}>{label}</span>
            </span>
          ))}
          <span style={{ fontSize: "10px", color: t.textFaint }}>● = enrollment</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {plotData.length === 0
          ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: t.textFaint, fontSize: "11px", letterSpacing: "0.1em" }}>NO DATA MATCHES CURRENT FILTERS</div>
          : <svg ref={svgRef} style={{ display: "block" }} />}
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
        {[
          { label: "Schools Shown", value: plotData.length.toLocaleString(), highlight: false },
          { label: "Hidden Gems", value: hiddenGems.length.toLocaleString(), highlight: true },
          { label: "Avg Tuition", value: avgTuition > 0 ? `$${avgTuition.toLocaleString()}` : "N/A", highlight: false },
          { label: "Avg Intl Students", value: avgIntl > 0 ? avgIntl.toLocaleString() : "N/A", highlight: false },
          { label: "Avg 10yr Earnings", value: avgEarnings > 0 ? `$${avgEarnings.toLocaleString()}` : "N/A", highlight: false },
        ].map(({ label, value, highlight }, i) => (
          <div key={label} style={{ padding: "8px 12px", borderRight: i < 4 ? `1px solid ${t.border}` : "none", background: t.bgSidebar ?? t.bg }}>
            <p style={{ margin: "0 0 2px", fontSize: "9px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: highlight ? t.amber : t.accent }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} style={{ position: "fixed", zIndex: 9999, display: "none", padding: "10px 12px", pointerEvents: "none", fontFamily: "'IBM Plex Mono', monospace", maxWidth: "260px" }} />
    </div>
  );
}