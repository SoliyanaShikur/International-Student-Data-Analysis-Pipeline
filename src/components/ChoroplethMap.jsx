import { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { useTheme } from "../theme";

const MAP_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Two separate color scales — one per theme
const DARK_COLORS = ["#0d1117", "#0c2a3d", "#0e4d6b", "#0d7aa8", "#00b4d8"];
const LIGHT_COLORS = ["#e8f4f8", "#b3dce8", "#6dbdd8", "#2b9ec0", "#0077a0"];

export default function ChoroplethMap({ stateAggregates, selectedState, onStateClick, loading }) {
  const { t, isDark } = useTheme();
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const geoDataRef = useRef(null);
  const zoomRef = useRef(null);
  const pathGenRef = useRef(null);

  // ── Draw base map (once on mount, re-draw when theme changes) ─────────────
  const drawnRef = useRef(false);

  useEffect(() => {
    if (drawnRef.current) return;
    drawnRef.current = true;
    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const projection = d3.geoAlbersUsa().scale(width * 1.4).translate([width / 2, height / 2]);
    const pathGen = d3.geoPath().projection(projection);
    pathGenRef.current = pathGen;

    svg.selectAll("*").remove();

    // Background grid
    const defs = svg.append("defs");
    defs.append("pattern").attr("id", "grid-bg").attr("width", 24).attr("height", 24).attr("patternUnits", "userSpaceOnUse")
      .append("path").attr("d", "M 24 0 L 0 0 0 24").attr("fill", "none")
      .attr("stroke", isDark ? "#1a2332" : "#d8d2c4").attr("stroke-width", "0.5");

    svg.append("rect").attr("class", "bg-grid").attr("width", "100%").attr("height", "100%").attr("fill", "url(#grid-bg)");

    d3.json(MAP_URL).then((us) => {
      geoDataRef.current = us;
      const features = topojson.feature(us, us.objects.states).features;

      svg.append("g").attr("class", "states-group")
        .selectAll("path").data(features).enter().append("path")
        .attr("class", "state-path").attr("d", pathGen)
        .attr("stroke", t.mapBorder).attr("stroke-width", 0.8)
        .attr("fill", t.mapBase).attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
          const name = d.properties.name;
          const agg = stateAggregates[name];
          const isSelected = name === selectedState;
          if (!isSelected) d3.select(this).attr("stroke", t.accent).attr("stroke-width", 1.5);
          const bg = isDark ? "#0c1820" : "#ffffff";
          const textColor = isDark ? "#c9d6e0" : "#1a1a1a";
          tooltip.style("display", "block")
            .style("background", bg).style("border", `1px solid ${t.border}`).style("color", textColor)
            .html(`<div style="font-size:12px;font-weight:bold;color:${t.accent};margin-bottom:4px">${name}</div>
              <div style="font-size:11px;line-height:1.7">
                Institutions: <b>${agg?.institutionCount?.toLocaleString() ?? "N/A"}</b><br/>
                Intl Students: <b>${agg?.totalIntl?.toLocaleString() ?? "N/A"}</b><br/>
                Avg Value Score: <b>${agg?.avgValueScore?.toFixed(1) ?? "N/A"}</b>
              </div>`);
        })
        .on("mousemove", function (event) {
          const [mx, my] = d3.pointer(event, document.body);
          tooltip.style("left", `${mx + 14}px`).style("top", `${my - 10}px`);
        })
        .on("mouseout", function (event, d) {
          const name = d.properties.name;
          const isSelected = name === selectedState;
          d3.select(this).attr("stroke", isSelected ? t.amber : t.mapBorder).attr("stroke-width", isSelected ? 2 : 0.8);
          tooltip.style("display", "none");
        })
        .on("click", function (event, d) { onStateClick(d.properties.name); });

      svg.append("path").attr("class", "state-borders")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("d", pathGen).attr("fill", "none").attr("stroke", t.mapBorder).attr("stroke-width", 0.4);

      // Zoom
      let isZoomed = false;
      const zoom = d3.zoom().scaleExtent([1, 8])
        .filter(function (event) {
          // Allow scroll zoom always, but only allow drag/pan when zoomed in
          if (event.type === "mousedown") return isZoomed;
          return true;
        })
        .on("zoom", (event) => {
          if (event.sourceEvent?.type === "wheel") isZoomed = true;
          svg.select(".states-group").attr("transform", event.transform);
          svg.select(".state-borders").attr("transform", event.transform);
        });

      zoomRef.current = zoom;
      svg.call(zoom);

      svg.selectAll(".state-path").on("dblclick", function (event, d) {
        event.stopPropagation();
        if (isZoomed) {
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
          isZoomed = false;
        } else {
          const [[x0, y0], [x1, y1]] = pathGen.bounds(d);
          svg.transition().duration(750).call(zoom.transform,
            d3.zoomIdentity.translate(width / 2, height / 2)
              .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
          );
          isZoomed = true;
        }
      });
      svg.on("dblclick.zoom", null);

      // Apply initial colors
      updateColors(features, stateAggregates, isDark, t);
    });
  }, []); // run only once

  // ── Color update (on filter change) ──────────────────────────────────────
  useEffect(() => {
    if (!geoDataRef.current) return;
    const features = topojson.feature(geoDataRef.current, geoDataRef.current.objects.states).features;
    updateColors(features, stateAggregates, isDark, t, selectedState);
  }, [stateAggregates, selectedState, isDark, t]);


  function updateColors(features, aggregates, dark, theme, selected) {
    const svg = d3.select(svgRef.current);
    const values = Object.values(aggregates).map(a => a.totalIntl).filter(v => v > 0);
    const palette = dark ? DARK_COLORS : LIGHT_COLORS;

    const colorScale = values.length > 1
      ? d3.scaleQuantile().domain(values).range(palette)
      : () => palette[0];

    svg.select(".states-group").selectAll(".state-path")
      .attr("fill", (d) => {
        const agg = aggregates[d.properties.name];
        return agg?.totalIntl > 0 ? colorScale(agg.totalIntl) : theme.mapBase;
      })
      .attr("stroke", (d) => d.properties.name === selected ? theme.amber : theme.mapBorder)
      .attr("stroke-width", (d) => d.properties.name === selected ? 2.5 : 0.8);
  }

  const colorPalette = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: t.bgCard, border: `1px solid ${t.border}` }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: t.textFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          ▦ International Student Density by State
        </span>
        {/* Color legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ fontSize: "9px", color: t.textFaint, marginRight: "4px" }}>Low</span>
          {colorPalette.map((c, i) => <div key={i} style={{ width: "18px", height: "10px", background: c }} />)}
          <span style={{ fontSize: "9px", color: t.textFaint, marginLeft: "4px" }}>High</span>
          <span style={{ fontSize: "9px", color: t.textFaint, marginLeft: "12px" }}>Scroll=zoom · Dbl-click=focus/reset</span>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.bgCard, zIndex: 10 }}>
            <div style={{ textAlign: "center", color: t.textFaint }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.15em", margin: 0 }}>LOADING MAP DATA...</p>
            </div>
          </div>
        )}
        <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} style={{ position: "fixed", zIndex: 9999, display: "none", padding: "10px 12px", pointerEvents: "none", fontFamily: "'IBM Plex Mono', monospace", maxWidth: "220px" }} />
    </div>
  );
}