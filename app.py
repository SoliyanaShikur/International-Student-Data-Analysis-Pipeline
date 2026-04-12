import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import requests as http_requests
import math

app = Flask(__name__)
CORS(app, origins=[
    "https://orange-water-0151fee0f.1.azurestaticapps.net",
    "http://localhost:5173"
])

MONGO_URI = os.environ.get(
    "MONGO_URI",
    "mongodb+srv://soliyanashikur_db_user:5hjnJiOjJ7J9DbOU@isss-data-cluster.gupa1mk.mongodb.net/"
)
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
db = mongo_client["college_db"]
colleges_col = db["colleges"]


@app.route("/api/colleges")
def get_colleges():
    max_tuition   = request.args.get("max_tuition",   type=int)
    min_intl      = request.args.get("min_intl",      type=int)
    min_enrollment = request.args.get("min_enrollment", type=int)

    mongo_filter = {}
    if max_tuition is not None:
        mongo_filter["tuition"] = {"$lte": max_tuition, "$gt": 0}
    if min_intl is not None:
        mongo_filter["intl_count"] = {"$gte": min_intl}
    if min_enrollment is not None:
        mongo_filter["enrollment_size"] = {"$gte": min_enrollment}

    cursor = colleges_col.find(mongo_filter, {"_id": 0}).sort("intl_count", -1)
    clean = []
    for doc in cursor:
        clean.append({
            k: (None if isinstance(v, float) and math.isnan(v) else v)
            for k, v in doc.items()
        })
    return jsonify(clean)


@app.route("/api/insights", methods=["POST"])
def get_insights():
    if not ANTHROPIC_API_KEY:
        return jsonify({"error": "ANTHROPIC_API_KEY not set"}), 503

    body = request.get_json()
    if not body or "prompt" not in body:
        return jsonify({"error": "Missing prompt"}), 400

    try:
        resp = http_requests.post(
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
        resp.raise_for_status()
        data = resp.json()
        text = "".join(b.get("text", "") for b in data.get("content", []))
        return jsonify({"insight": text})
    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Anthropic timed out"}), 504
    except http_requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502


if __name__ == "__main__":
    print("-" * 40)
    print("EduScope API starting on port 5001")
    print(f"Anthropic key: {'SET' if ANTHROPIC_API_KEY else 'NOT SET'}")
    try:
        mongo_client.server_info()
        print(f"MongoDB OK - {colleges_col.count_documents({})} records")
    except Exception as e:
        print(f"MongoDB ERROR - {e}")
    print("-" * 40)
    app.run(host="0.0.0.0", port=5001, debug=False, use_reloader=False)