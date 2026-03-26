import psycopg2
from pymongo import MongoClient
import pandas as pd

# Postgres source
pg = psycopg2.connect("postgresql://postgres:ADkefo1976@localhost:5432/college_db")
df = pd.read_sql("""
SELECT i.*, m.*
FROM institutions i
LEFT JOIN Metrics m ON i.unitid = m.unitid
""", pg)

# MongoDB destination
mongo = MongoClient("mongodb+srv://soliyanashikur_db_user:5hjnJiOjJ7J9DbOU@isss-data-cluster.gupa1mk.mongodb.net/?appName=ISSS-Data-Cluster")
db = mongo["college_db"]
db["colleges"].drop()
db["colleges"].insert_many(df.to_dict("records"))
print(f"Migrated {len(df)} records")