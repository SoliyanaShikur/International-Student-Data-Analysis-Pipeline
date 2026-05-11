# EduScope — International Student Analytics Terminal

A full-stack analytics dashboard for exploring international student data across 6,275 US institutions. Built for two audiences: international applicants finding hidden-gem schools and university administrators benchmarking competitors.

**Live:** [orange-water-0151fee0f.1.azurestaticapps.net](https://orange-water-0151fee0f.1.azurestaticapps.net)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Charts | D3.js v7 (choropleth map + scatter plot) |
| Backend | Flask + PyMongo |
| Database | MongoDB Atlas |
| AI | Claude API *(not yet connected in production)* |
| Hosting | Azure Static Web Apps (frontend) + Render (API) |

---

## Features

- **Choropleth Map** — international student density by state, click to drill down
- **Scatter Plot** — tuition vs international enrollment, bubble size = total enrollment
- **Value Score** — custom algorithm: (Earnings ÷ Tuition) × International Density, log-normalized
- **Hidden Gem detection** — schools with Value Score ≥ 70 flagged in amber
- **5 live filters** — tuition, intl students, enrollment, admission rate, high ROI toggle
- **School drill-down** — 8 metrics per institution + website link
- **AI Insights** — Claude-generated analysis for applicants and administrators *(local only)*
- **Light / Dark mode** — toggle in top bar, light is default
- **Interactive tutorial** — step-by-step guide on first visit

---

## Running Locally

**1. Start the API:**
```bash
pip install -r requirements.txt
python app.py
# → http://127.0.0.1:5001
```

**2. Start the frontend:**
```bash
npm install
npm run dev
# → http://localhost:5173
```

**3. Set environment variables:**
```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "your-key"
$env:MONGO_URI = "your-mongodb-connection-string"
```

Create a `.env.local` file for the frontend:
```
VITE_API_BASE=http://127.0.0.1:5001/api/colleges
```

---

## Data

Source: US Department of Education College Scorecard  
6,275 institutions · joined from `Institutions` + `Metrics` tables · migrated from PostgreSQL to MongoDB Atlas

---

## Value Score

```
ValueScore = (earnings_in_10yrs / tuition) × (intl_count / enrollment_size) × 100
```

Log-normalized to 0–100 so outlier schools don't skew the distribution.

| Score | Tier |
|-------|------|
| ≥ 70 | Hidden Gem ★ |
| 40–69 | Solid Value |
| < 40 | Below Average |

---

## Project Structure

```
├── app.py                  ← Flask API (MongoDB)
├── requirements.txt
├── runtime.txt             ← Python 3.11 for Render
├── migrate.py              ← One-time Postgres → MongoDB migration
├── public/
│   └── staticwebapp.config.json
└── src/
    ├── App.jsx             ← Routing + dashboard state
    ├── theme.jsx           ← Light/dark token system
    └── components/
        ├── TopBar.jsx
        ├── FilterSidebar.jsx
        ├── ChoroplethMap.jsx
        ├── ScatterPlot.jsx
        ├── DrillDownPanel.jsx
        ├── LandingPage.jsx
        ├── ContactPage.jsx
        └── TutorialOverlay.jsx
```
