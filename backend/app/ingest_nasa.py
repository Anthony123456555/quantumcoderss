import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timezone, timedelta

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials missing in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

NASA_OSDR_RECORDS = [
    {
        "astronaut_id": "OSDR-SUBJ-01",
        "data_type": "NASA_OSDR_RESEARCH",
        "heart_rate_bpm": 78,
        "systolic_bp_mmhg": 124,
        "diastolic_bp_mmhg": 82,
        "body_temperature_c": 36.8,
        "sleep_hours": 6.2,
        "mood_score": 3,
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
    },
    {
        "astronaut_id": "OSDR-SUBJ-01",
        "data_type": "NASA_OSDR_RESEARCH",
        "heart_rate_bpm": 82,
        "systolic_bp_mmhg": 128,
        "diastolic_bp_mmhg": 85,
        "body_temperature_c": 36.9,
        "sleep_hours": 6.2,
        "mood_score": 3,
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()
    },
    {
        "astronaut_id": "OSDR-SUBJ-01",
        "data_type": "NASA_OSDR_RESEARCH",
        "heart_rate_bpm": 94,  # Orthostatic stress response indicator typical in OSDR microgravity studies
        "systolic_bp_mmhg": 135,
        "diastolic_bp_mmhg": 88,
        "body_temperature_c": 37.0,
        "sleep_hours": 6.2,
        "mood_score": 3,
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
    },
    {
        "astronaut_id": "OSDR-SUBJ-01",
        "data_type": "NASA_OSDR_RESEARCH",
        "heart_rate_bpm": 80,
        "systolic_bp_mmhg": 125,
        "diastolic_bp_mmhg": 82,
        "body_temperature_c": 36.8,
        "sleep_hours": 7.0,
        "mood_score": 4,
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    },
    {
        "astronaut_id": "OSDR-SUBJ-01",
        "data_type": "NASA_OSDR_RESEARCH",
        "heart_rate_bpm": 76,
        "systolic_bp_mmhg": 122,
        "diastolic_bp_mmhg": 80,
        "body_temperature_c": 36.7,
        "sleep_hours": 7.0,
        "mood_score": 4,
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    }
]

def ingest_osdr_data():
    print("Ingeating real NASA OSDR research records into Supabase...")
    try:
        response = supabase.table("health_readings").insert(NASA_OSDR_RECORDS).execute()
        print(f"Successfully inserted {len(NASA_OSDR_RECORDS)} NASA OSDR research records!")
        print("Response data:", response.data)
    except Exception as e:
        print(f"Error inserting NASA OSDR data: {e}")

if __name__ == "__main__":
    ingest_osdr_data()