import psycopg2
from pymongo import MongoClient
import pandas as pd
import os

# Postgres source
pg = psycopg2.connect("postgresql://postgres:ADkefo1976@localhost:5432/college_db")
df = pd.read_sql("""
SELECT i.*, m.*
FROM institutions i
LEFT JOIN Metrics m ON i.unitid = m.unitid
""", pg)

# MongoDB destination
MONGO_URI = os.environ.get("MONGO_URI")
mongo = MongoClient(MONGO_URI)
db = mongo["college_db"]
db["colleges"].drop()
db["colleges"].insert_many(df.to_dict("records"))
print(f"Migrated {len(df)} records")