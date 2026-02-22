/**
 * valueScore.js — "Hidden Gem" ranking algorithm
 *
 * Formula:
 *   ValueScore = (Earnings / Tuition) × InternationalDensity × 100
 *
 * Where:
 *   Earnings           = 10-year median post-grad salary (earnings_in_10yrs)
 *   Tuition            = out-of-state tuition (tuition); floored at $1 to avoid /0
 *   InternationalDensity = intl_count / enrollment_size (ratio 0-1)
 *                          floored at 0.001 so schools with 0 intl students score low
 *
 * The raw output is then normalized to a 0-100 scale using soft clamping
 * (log scale) so outliers don't crush the rest of the distribution.
 *
 * Interpretation:
 *   > 70  → Premium ROI + strong international community ("Hidden Gem")
 *   40-70 → Solid value
 *   < 40  → Below average on this combined metric
 */

/**
 * Compute raw (unnormalized) value score for a single school record.
 * Safe to call with partial/null data — returns 0 for unusable records.
 *
 * @param {Object} d - A school record from the Flask API
 * @returns {number} Raw value score (unbounded positive float)
 */
export function computeRawValueScore(d) {
  const earnings = d.earnings_in_10yrs ?? 0;
  const tuition = Math.max(d.tuition ?? 1, 1);          // floor at $1
  const enrollment = Math.max(d.enrollment_size ?? 0, 1); // floor at 1
  const intlCount = d.intl_count ?? 0;

  // Skip records with no meaningful earnings data
  if (earnings === 0) return 0;

  // ROI component: how many dollars earned per dollar spent on tuition
  const roi = earnings / tuition;

  // International density: proportion of student body that is international
  const intlDensity = Math.max(intlCount / enrollment, 0.001);

  return roi * intlDensity * 100;
}

/**
 * Normalize a raw score to 0-100 using log scaling.
 * Log scale prevents a handful of elite schools from making
 * everyone else look like 0 on a linear scale.
 *
 * @param {number} raw - Raw score from computeRawValueScore
 * @param {number} maxRaw - Maximum raw score in the dataset (for normalization)
 * @returns {number} Score in [0, 100]
 */
export function normalizeScore(raw, maxRaw) {
  if (maxRaw <= 0 || raw <= 0) return 0;
  // log(1 + raw) / log(1 + maxRaw) maps the entire range to [0, 1]
  const normalized = Math.log(1 + raw) / Math.log(1 + maxRaw);
  return Math.round(normalized * 100);
}

/**
 * Enrich a full dataset with normalized Value Scores.
 * Call this once after fetching from the API.
 *
 * @param {Array} data - Raw API records
 * @returns {Array} Same records with .valueScore (0-100) added
 */
export function enrichWithValueScores(data) {
  // First pass: compute raw scores
  const rawScores = data.map(computeRawValueScore);
  const maxRaw = Math.max(...rawScores);

  // Second pass: normalize to 0-100
  return data.map((d, i) => ({
    ...d,
    valueScoreRaw: rawScores[i],
    valueScore: normalizeScore(rawScores[i], maxRaw),
  }));
}

/**
 * Convenience wrapper — computes score for a single record.
 * Used in App.jsx before the full dataset is available.
 * NOTE: Without the global max, this returns the raw score (not 0-100).
 * For display purposes, use enrichWithValueScores() on the full dataset.
 *
 * @param {Object} d - A school record
 * @returns {number} Raw value score
 */
export function computeValueScore(d) {
  return computeRawValueScore(d);
}

/**
 * Get a human-readable label and color class for a given score
 *
 * @param {number} score - 0-100 normalized value score
 * @returns {{ label: string, colorClass: string }}
 */
export function getScoreTier(score) {
  if (score >= 70) return { label: "Hidden Gem ★", colorClass: "text-amber-400" };
  if (score >= 40) return { label: "Solid Value", colorClass: "text-cyan-400" };
  return { label: "Below Avg", colorClass: "text-slate-500" };
}
