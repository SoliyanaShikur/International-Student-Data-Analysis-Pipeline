# EduScope — International Student Analytics Terminal

A Bloomberg-style data terminal for analyzing US college international student data.
Built for university administrators benchmarking market share and international applicants hunting "Hidden Gems."

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (custom terminal palette) |
| Charts | D3.js v7 (choropleth + scatter) |
| Backend | Flask + SQLAlchemy |
| Database | PostgreSQL (`college_db`) |
| AI | Claude claude-sonnet-4-20250514 via Anthropic API |

---

## Project Structure

```
edu-dashboard/
├── index.html                  ← Vite HTML entry
├── vite.config.js              ← Vite + API proxy config
├── tailwind.config.js          ← Terminal color palette
├── postcss.config.js
├── package.json
├── app.py                      ← Flask API (run separately)
└── src/
    ├── main.jsx                ← React entry point
    ├── App.jsx                 ← Root: state mgmt + layout
    ├── index.css               ← Global styles + design tokens
    ├── utils/
    │   └── valueScore.js       ← Value Score algorithm
    └── components/
        ├── TopBar.jsx          ← Header + view toggle
        ├── FilterSidebar.jsx   ← All sliders + ROI + Claude AI 
        narrative insightstoggle
        ├── ChoroplethMap.jsx   ← D3 US choropleth map
        ├── ScatterPlot.jsx     ← D3 Tuition vs Intl scatter
        ├── DrillDownPanel.jsx  ← State/school detail sidebar
```

---

## Quick Start

### 1. Start Flask Backend

```bash
# In your existing project folder
pip install flask flask-cors sqlalchemy psycopg2-binary requests

# Set your Anthropic API key (for AI insights)
export ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"

python app.py
# → Running on http://127.0.0.1:5001
```

### 2. Start React Frontend

```bash
cd edu-dashboard
npm install
npm run dev
# → Running on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to Flask automatically — no CORS issues.

---

## Value Score Algorithm

```
ValueScore = (earnings_in_10yrs / tuition) × (intl_count / enrollment_size) × 100
```

Then normalized to 0–100 using log scaling so outlier schools don't crush the distribution.

| Score | Tier | Color |
|-------|------|-------|
| ≥ 70 | Hidden Gem ★ | Amber |
| 40–69 | Solid Value | Cyan |
| < 40 | Below Average | Slate |

---
bash
export ANTHROPIC_API_KEY="sk-ant-..."
python app.py
```


## Design System

### Color Palette

```css
--color-bg:       #070d12   /* deepest background */
--color-accent:   #00b4d8   /* cyan — interactive elements */
--color-amber:    #f59e0b   /* amber — selected / hidden gems */
--color-border:   #1e3a4a   /* panel borders */
--color-card:     #0c1820   /* card surfaces */
```

### Typography
IBM Plex Mono — monospaced, readable at small sizes, authentically terminal.

---

## Dashboard Features

### Macro View (Choropleth Map)
- Quantile color scale (5 buckets) for international student density by state
- Click any state to drill down
- Hover for quick stats tooltip
- Amber border on selected state

### Scatter Plot View
- X: Out-of-state tuition
- Y: International student count
- Dot size: Total enrollment
- Dot color: Value Score tier
- "Hidden Gem Zone" quadrant shading (low tuition + high intl)
- Click dots to see full school detail

### Drill-Down Panel
- Summary stats: institution count, total students, intl students, avg tuition
- Top 10 schools sortable by: International Count | Value Score | Tuition
- Expanded school card with all 8 metrics on school click

### AI Insights
- Generates 3-4 sentence Bloomberg-style narrative
- Context-aware: scoped to selected state or all US
- Shows when insights are stale after filter changes
- Powered by Claude claude-sonnet-4-20250514

### Filters
- Max Tuition: $0–$80,000
- Min International Students: 0–5,000
- Min Total Enrollment: 0–40,000
- Max Admission Rate: 1–100%
- High ROI Only toggle (Value Score ≥ 70th percentile)

All filtering is client-side after initial load — instant response.
