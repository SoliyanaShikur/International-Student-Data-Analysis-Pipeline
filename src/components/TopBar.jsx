/**
 * TopBar.jsx — Bloomberg-terminal style header
 *
 * Shows:
 * - Brand name + tagline (left)
 * - Live record count ticker (center)
 * - View toggle: Map ↔ Scatter (right)
 *
 * Props:
 *   filteredCount {number} — how many schools pass current filters
 *   totalCount    {number} — total schools in DB
 *   activeView    {string} — "map" | "scatter"
 *   onViewChange  {fn}    — callback(newView)
 */

export default function TopBar({ filteredCount, totalCount, activeView, onViewChange }) {
  return (
    <header
      className="flex items-center justify-between px-6 py-2 border-b border-terminal-border"
      style={{ background: "var(--color-topbar)", minHeight: "48px" }}
    >
      {/* ── Left: Brand ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Blinking status dot — indicates live data connection */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-lg font-bold tracking-widest text-terminal-accent">
          EDUSCOPE
        </span>
        <span className="text-xs text-slate-500 tracking-wider hidden md:block">
          INTERNATIONAL STUDENT ANALYTICS TERMINAL
        </span>
      </div>

      {/* ── Center: Live record count ────────────────────────────────────── */}
      <div className="text-xs text-center text-slate-400">
        <span className="text-terminal-accent font-bold text-sm">
          {filteredCount.toLocaleString()}
        </span>
        <span className="mx-1 text-slate-600">/</span>
        <span>{totalCount.toLocaleString()}</span>
        <span className="ml-1 text-slate-500">INSTITUTIONS ACTIVE</span>
      </div>

      {/* ── Right: View toggle ──────────────────────────────────────────── */}
      <nav className="flex gap-1">
        {[
          { key: "map", label: "▦ MACRO MAP" },
          { key: "scatter", label: "◎ SCATTER" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`px-3 py-1 text-xs tracking-widest border transition-all duration-150 ${
              activeView === key
                ? "bg-terminal-accent text-terminal-bg border-terminal-accent font-bold"
                : "border-terminal-border text-slate-400 hover:border-terminal-accent hover:text-terminal-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
