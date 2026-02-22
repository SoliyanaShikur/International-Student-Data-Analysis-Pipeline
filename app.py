"""
app.py — EduScope Flask API

Endpoints:
  GET /api/colleges          — filtered school records
  POST /api/insights         — proxies to Anthropic API (keeps key server-side)

Why proxy the Anthropic call through Flask?
  Never expose API keys in frontend JavaScript — they'll be visible in DevTools.
  Flask sits between the browser and Anthropic, adding auth without leaking secrets.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
import requests as http_requests
import os

app = Flask(__name__)
CORS(app)  # Allow requests from Vite dev server (localhost:5173)

DB_URL = "postgresql://postgres:ADkefo1976@localhost:5432/college_db"
engine = create_engine(DB_URL)

# ─── Store API key in environment variable, NOT hardcoded ─────────────────────
# Set it before running: export ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/colleges
# Query params: max_tuition, min_intl, min_enrollment
# Returns: JSON array of school records
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/api/colleges')
def get_colleges():
    # Parse optional filter params with safe defaults
    max_tuition = request.args.get('max_tuition', type=int)
    min_intl = request.args.get('min_intl', type=int)
    min_enrollment = request.args.get('min_enrollment', type=int)

    # Base query — select all columns needed by the frontend
    # We join Institutions and Metrics on unitid
    # Note: state_name is used by D3 for choropleth matching (full name, not abbr)
    query_str = """
    SELECT
        i.name,
        i.city,
        i.state_name,
        i.state_abbr,
        i.school_url,
        i.tuition,
        i.intl_count,
        m.enrollment_size,
        m.admission_rate,
        m.completion_rate,
        m.earnings_in_10yrs,
        m.instructional_spend
    FROM Institutions i
    JOIN Metrics m ON i.unitid = m.unitid
    WHERE 1=1
    """
    params = {}

    # Dynamically append filter clauses — prevents SQL injection via SQLAlchemy params
    if max_tuition is not None:
        query_str += " AND i.tuition <= :max_t AND i.tuition > 0"
        params['max_t'] = max_tuition
    if min_intl is not None:
        query_str += " AND i.intl_count >= :min_i"
        params['min_i'] = min_intl
    if min_enrollment is not None:
        query_str += " AND m.enrollment_size >= :min_e"
        params['min_e'] = min_enrollment

    # Order by intl_count descending so initial load shows most interesting schools first
    query_str += " ORDER BY i.intl_count DESC NULLS LAST"

    with engine.connect() as conn:
        result = conn.execute(text(query_str), params)
        # Convert SQLAlchemy Row objects to plain dicts for jsonify
        data = [dict(row._mapping) for row in result]
        return jsonify(data)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/insights
# Body: { "prompt": "..." }
# Returns: { "insight": "..." }
#
# This is a thin proxy — Flask forwards the prompt to Anthropic and returns
# the response. The API key never leaves the server.
# ─────────────────────────────────────────────────────────────────────────────
@app.route('/api/insights', methods=['POST'])
def get_insights():
    if not ANTHROPIC_API_KEY:
        return jsonify({
            "error": "ANTHROPIC_API_KEY not set. Run: export ANTHROPIC_API_KEY='sk-ant-...'"
        }), 503

    body = request.get_json()
    if not body or 'prompt' not in body:
        return jsonify({"error": "Request body must include 'prompt' field"}), 400

    # Forward to Anthropic API
    try:
        response = http_requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 350,
                "messages": [{"role": "user", "content": body["prompt"]}],
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        # Extract text from Anthropic's response structure
        text_content = "".join(
            block.get("text", "") for block in data.get("content", [])
        )
        return jsonify({"insight": text_content})

    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Anthropic API timed out — try again"}), 504
    except http_requests.exceptions.RequestException as e:
        return jsonify({"error": f"Anthropic API error: {str(e)}"}), 502


if __name__ == '__main__':
    print("─" * 50)
    print("EduScope Flask API starting...")
    print(f"Anthropic key configured: {'✓' if ANTHROPIC_API_KEY else '✗ (set ANTHROPIC_API_KEY env var)'}")
    print("─" * 50)
    app.run(debug=True, port=5001)
