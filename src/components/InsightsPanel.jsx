

/**
 * InsightsPanel.jsx — AI-generated narrative insights
 *
 * Uses the Anthropic Messages API (claude-sonnet-4-20250514) to generate
 * context-aware summaries based on the current filter state and selected state.
 *
 * Two insight modes:
 *   1. STATE mode: "In [State], [School X] offers the highest international
 *      density for schools under $25k tuition..."
 *   2. NATIONAL mode: "Across all filtered schools, the top-value states are..."
 *
 * The prompt is assembled from the top 5 schools + aggregate stats —
 * we don't send all 7,000 records (that would exceed token limits and be slow).
 *
 * API call flow:
 *   1. User clicks "Generate Insights" (or state changes if autoRefresh is on)
 *   2. We assemble a concise JSON context string (~300 tokens)
 *   3. POST to /v1/messages
 *   4. Stream the response into the panel
 *
 * Props:
 *   selectedState {string} — currently selected state (or null for national)
 *   filteredData  {Array}  — current filtered school records
 *   filters       {Object} — current filter values (shown in prompt context)
 */

import { useState, useCallback } from "react";

// ── Assemble a concise prompt context from data ────────────────────────────────
// We summarize into ≤ 500 chars so we stay well within token budgets
function buildPrompt(selectedState, filteredData, filters) {
  // Get state-specific or all schools
  const scopeData = selectedState
    ? filteredData.filter((d) => d.state_name === selectedState)
    : filteredData;

  // Top 5 by Value Score
  const top5 = [...scopeData]
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, 5);

  // Aggregate stats
  const totalIntl = scopeData.reduce((s, d) => s + (d.intl_count ?? 0), 0);
  const avgTuition =
    scopeData.length > 0
      ? Math.round(scopeData.reduce((s, d) => s + (d.tuition ?? 0), 0) / scopeData.length)
      : 0;
  const avgEarnings =
    scopeData.filter((d) => d.earnings_in_10yrs > 0).length > 0
      ? Math.round(
        scopeData
          .filter((d) => d.earnings_in_10yrs > 0)
          .reduce((s, d) => s + d.earnings_in_10yrs, 0) /
        scopeData.filter((d) => d.earnings_in_10yrs > 0).length
      )
      : 0;

  // Format top schools as compact text
  const schoolsText = top5
    .map(
      (s) =>
        `${s.name} (intl: ${s.intl_count}, tuition: $${s.tuition?.toLocaleString()}, ` +
        `10yr earnings: $${s.earnings_in_10yrs?.toLocaleString() ?? "N/A"}, score: ${s.valueScore?.toFixed(1)})`
    )
    .join("; ");

  const scope = selectedState ?? "all US states";
  const filterSummary = `max tuition $${filters.maxTuition.toLocaleString()}, ` +
    `min intl ${filters.minIntl}, min enrollment ${filters.minEnrollment}`;

  return (
    `You are an expert education data analyst writing for a Bloomberg-style terminal dashboard. ` +
    `Active filters: ${filterSummary}. ` +
    `Scope: ${scope}. ` +
    `${scopeData.length} institutions shown. ` +
    `Total intl students: ${totalIntl.toLocaleString()}. ` +
    `Avg tuition: $${avgTuition.toLocaleString()}. ` +
    `Avg 10yr earnings: $${avgEarnings.toLocaleString()}. ` +
    `Top 5 by Value Score: ${schoolsText}. ` +
    `\n\nWrite 3–4 sentences of sharp, data-driven insights for this snapshot. ` +
    `Lead with the standout "hidden gem" finding. Be specific with numbers. ` +
    `End with one actionable recommendation for an international applicant or university administrator. ` +
    `Tone: authoritative, concise, Bloomberg terminal style. No markdown headers.`
  );
}

export default function InsightsPanel({ selectedState, filteredData, filters }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Track what state/filter combo last generated insight (for staleness indicator)
  const [lastContext, setLastContext] = useState(null);

  const currentContext = `${selectedState}|${filters.maxTuition}|${filters.minIntl}|${filters.minEnrollment}|${filters.highRoiOnly}`;
  const isStale = lastContext && lastContext !== currentContext;

  const generateInsight = useCallback(async () => {
    if (filteredData.length === 0) {
      setInsight("No data matches the current filters — try loosening the sliders.");
      return;
    }

    setLoading(true);
    setError(null);
    setInsight("");

    const prompt = buildPrompt(selectedState, filteredData, filters);

    try {
      const response = await fetch("http://127.0.0.1:5001/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message ?? `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.map((c) => c.text ?? "").join("") ?? "";
      setInsight(text);
      setLastContext(currentContext);
    } catch (err) {
      // Helpful error messaging for common failure modes
      if (err.message.includes("401")) {
        setError("API key invalid or missing. Add your Anthropic key to InsightsPanel.jsx (local dev) or configure a /api/insights proxy on your Flask server.");
      } else if (err.message.includes("Failed to fetch")) {
        setError("Network error — check CORS. For production, proxy this request through Flask.");
      } else {
        setError(`Claude API error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedState, filteredData, filters, currentContext]);

  return (
    <div
      className="w-full border border-terminal-border"
      style={{ background: "var(--color-card)" }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-terminal-border">
        <div className="flex items-center gap-2">
          <span className="text-xs tracking-widest text-slate-500 uppercase">
            ◈ AI Analyst Insights
          </span>
          {selectedState && (
            <span className="text-xs text-amber-400">— {selectedState}</span>
          )}
          {isStale && !loading && insight && (
            <span className="text-xs text-orange-600 tracking-wider">
              [STALE — filters changed]
            </span>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={generateInsight}
          disabled={loading}
          className={`
            px-3 py-1 text-xs tracking-widest border transition-all duration-150
            ${loading
              ? "border-slate-700 text-slate-600 cursor-not-allowed"
              : "border-terminal-accent text-terminal-accent hover:bg-terminal-accent hover:text-terminal-bg"
            }
          `}
        >
          {loading ? "ANALYZING..." : "▶ GENERATE INSIGHTS"}
        </button>
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="p-4 min-h-16">
        {/* Loading animation */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="animate-pulse text-terminal-accent">████</span>
            <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>███</span>
            <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>█████</span>
            <span className="text-slate-600 ml-2 tracking-widest">PROCESSING...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        )}

        {/* Insight text */}
        {insight && !loading && !error && (
          <p className="text-sm text-slate-200 leading-relaxed max-w-5xl">
            {insight}
          </p>
        )}

        {/* Default prompt */}
        {!insight && !loading && !error && (
          <p className="text-xs text-slate-600 tracking-wider">
            Click "Generate Insights" to analyze the current filtered dataset with Claude AI.
            {selectedState
              ? ` Current scope: ${selectedState}.`
              : " Current scope: all US states."}
          </p>
        )}
      </div>
    </div>
  );
}
