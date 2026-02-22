/**
 * ChoroplethMap.jsx — D3.js US choropleth (fixed: single map-group for zoom)
 */

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const MAP_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const COLOR_SCALE = [
  "#0d1117",
  "#0c2a3d",
  "#0e4d6b",
  "#0d7aa8",
  "#00b4d8",
];

export default function ChoroplethMap({ stateAggregates, selectedState, onStateClick, loading }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const geoDataRef = useRef(null);

  useEffect(() => {
    // Guard: if map already drawn, skip (prevents StrictMode double-render ghost)
    if (svgRef.current.querySelector(".states-group")) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const projection = d3.geoAlbersUsa()
      .scale(width * 1.4)
      .translate([width / 2, height / 2]);

    const pathGen = d3.geoPath().projection(projection);

    svg.selectAll("*").remove();

    // Background grid — stays fixed, not inside mapGroup
    const defs = svg.append("defs");
    defs.append("pattern")
      .attr("id", "grid").attr("width", 20).attr("height", 20)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path").attr("d", "M 20 0 L 0 0 0 20")
      .attr("fill", "none").attr("stroke", "#1a2332").attr("stroke-width", "0.5");

    svg.append("rect").attr("class", "bg-grid")
      .attr("width", "100%").attr("height", "100%").attr("fill", "url(#grid)");

    d3.json(MAP_URL).then((us) => {
      geoDataRef.current = us;
      const features = topojson.feature(us, us.objects.states).features;

      // ── SINGLE mapGroup — zoom moves this entire group ─────────────────
      // This is the fix: states AND borders are both children of mapGroup
      // so they always move together as one unit
      const mapGroup = svg.append("g").attr("class", "map-group");

      // States inside mapGroup
      mapGroup.append("g")
        .attr("class", "states-group")
        .selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", "state-path")
        .attr("d", pathGen)
        .attr("stroke", "#1e3a4a")
        .attr("stroke-width", 0.8)
        .attr("fill", "#0d1117")
        .attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
          const stateName = d.properties.name;
          const agg = stateAggregates[stateName];
          d3.select(this).attr("stroke", "#00b4d8").attr("stroke-width", 1.5);
          tooltip.style("display", "block").html(`
            <div style="font-weight:bold;color:#00b4d8;margin-bottom:4px">${stateName}</div>
            <div style="font-size:11px;color:#cbd5e1">
              Institutions: <b>${agg?.institutionCount?.toLocaleString() ?? "N/A"}</b><br/>
              Intl Students: <b>${agg?.totalIntl?.toLocaleString() ?? "N/A"}</b><br/>
              Avg Value Score: <b>${agg?.avgValueScore?.toFixed(1) ?? "N/A"}</b>
            </div>
          `);
        })
        .on("mousemove", function (event) {
          const [mx, my] = d3.pointer(event, document.body);
          tooltip.style("left", `${mx + 14}px`).style("top", `${my - 10}px`);
        })
        .on("mouseout", function (event, d) {
          const isSelected = d.properties.name === selectedState;
          d3.select(this)
            .attr("stroke", isSelected ? "#f59e0b" : "#1e3a4a")
            .attr("stroke-width", isSelected ? 2 : 0.8);
          tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
          onStateClick(d.properties.name);
        });

      // Borders inside mapGroup — moves with states on zoom/pan
      mapGroup.append("path")
        .attr("class", "state-borders")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("d", pathGen)
        .attr("fill", "none")
        .attr("stroke", "#1e3a4a")
        .attr("stroke-width", 0.5);

      // ── Zoom behavior ──────────────────────────────────────────────────
      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
          mapGroup.attr("transform", event.transform); // single transform = no ghost
        });

      svg.call(zoom);

      // Double-click state → fly in
      // Track zoom state
      let isZoomed = false;

      svg.selectAll(".state-path")
        .on("dblclick", function (event, d) {
          event.stopPropagation();

          if (isZoomed) {
            // Already zoomed — zoom back out
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
            isZoomed = false;
          } else {
            // Zoom into clicked state
            const [[x0, y0], [x1, y1]] = pathGen.bounds(d);
            svg.transition().duration(750).call(
              zoom.transform,
              d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
            );
            isZoomed = true;
          }
        });

      // Double-click background → reset
      svg.on("dblclick.zoom", () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      });
    });
  }, []);

  // Color update effect — re-runs on filter/selection changes
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.select(".states-group").node()) return;

    const values = Object.values(stateAggregates).map((s) => s.totalIntl).filter(Boolean);
    const colorScale = d3.scaleQuantile()
      .domain(values.length > 0 ? values : [0, 1])
      .range(COLOR_SCALE);

    svg.selectAll(".state-path")
      .transition().duration(400)
      .attr("fill", function (d) {
        const agg = stateAggregates[d.properties?.name];
        return agg ? colorScale(agg.totalIntl) : COLOR_SCALE[0];
      })
      .attr("stroke", function (d) {
        return d.properties?.name === selectedState ? "#f59e0b" : "#1e3a4a";
      })
      .attr("stroke-width", function (d) {
        return d.properties?.name === selectedState ? 2.5 : 0.8;
      });
  }, [stateAggregates, selectedState]);

  const Legend = useCallback(() => {
    const labels = ["Low", "", "Med", "", "High"];
    return (
      <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10, color: "#64748b", marginRight: 4 }}>INTL DENSITY</span>
        {COLOR_SCALE.map((c, i) => (
          <div key={c} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 28, height: 12, background: c, border: "1px solid #1e3a4a" }} />
            <span style={{ fontSize: 9, color: "#475569" }}>{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0c1820", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid #1e3a4a", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em" }}>
          ▦ NATIONAL OVERVIEW — INTERNATIONAL STUDENT DENSITY
        </span>
        {selectedState && (
          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: "bold" }}>
            ▶ {selectedState.toUpperCase()}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,13,18,0.8)", zIndex: 10 }}>
          <span style={{ color: "#00b4d8", fontSize: 11, letterSpacing: "0.1em" }}>LOADING DATA...</span>
        </div>
      )}

      <svg ref={svgRef} style={{ width: "100%", flex: 1 }} />
      <Legend />

      <div ref={tooltipRef} style={{ position: "fixed", zIndex: 50, background: "#0c1820", border: "1px solid #1e3a4a", padding: "8px 12px", fontSize: 13, pointerEvents: "none", fontFamily: "monospace", display: "none" }} />
    </div>
  );
}