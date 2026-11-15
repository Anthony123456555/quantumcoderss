from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(
    title="QuantumCoders API",
    description="Astronaut Health Monitoring System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "project": "QuantumCoders",
        "status": "online",
        "message": "Astronaut Health Monitoring API"
    }

@app.get("/api/v1/health")
def get_health():
    return {
        "data_type": "SIMULATED",
        "astronaut_id": "DEMO-001",
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "indicators": {
            "heart_rate_bpm": 72,
            "systolic_bp_mmhg": 120,
            "diastolic_bp_mmhg": 80,
            "body_temperature_c": 36.7,
            "sleep_hours": 7.5,
            "mood_score": 4
        }
    }

@app.get("/api/v1/database/test")
def test_database():
    try:
        supabase.table("health_readings").select("*").limit(1).execute()
        return {
            "status": "connected",
            "database": "Supabase PostgreSQL",
            "message": "QuantumCoders database connection successful"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/v1/health/readings/demo")
def save_demo_reading():
    try:
        reading = {
            "astronaut_id": "DEMO-001",
            "data_type": "SIMULATED",
            "heart_rate_bpm": 72,
            "systolic_bp_mmhg": 120,
            "diastolic_bp_mmhg": 80,
            "body_temperature_c": 36.7,
            "sleep_hours": 7.5,
            "mood_score": 4
        }
        response = supabase.table("health_readings").insert(reading).execute()
        return {
            "status": "success",
            "message": "Health reading saved successfully",
            "data": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/health/readings")
def get_health_readings(astronaut_id: str = "DEMO-001", data_type: str = "SIMULATED_SERIES", limit: int = 12):
    try:
        query = (
            supabase.table("health_readings")
            .select("*")
            .order("id", desc=True)
            .limit(limit)
        )
        
        if data_type == "NASA_OSDR_RESEARCH":
            query = query.eq("data_type", "NASA_OSDR_RESEARCH").eq("astronaut_id", "OSDR-SUBJ-01")
        else:
            query = query.eq("astronaut_id", astronaut_id)

        response = query.execute()
        records = response.data

        risk_score = "NOMINAL"
        risk_level = "LOW"
        anomaly_alert = None
        
        if records:
            latest = records[0]
            hr = latest.get("heart_rate_bpm", 72)
            sys = latest.get("systolic_bp_mmhg", 120)
            
            hr_values = [r["heart_rate_bpm"] for r in records if "heart_rate_bpm" in r]
            avg_hr = sum(hr_values) / len(hr_values) if hr_values else 72

            if hr > 90 or sys > 135:
                risk_score = "ELEVATED"
                risk_level = "MODERATE"
                anomaly_alert = {
                    "metric": "Cardiovascular Load",
                    "severity": "MODERATE",
                    "message": f"Heart rate ({hr} BPM) and pressure ({sys} mmHg) exceed nominal flight baseline.",
                    "recommendation": "Initiate downlink telemetry check and review astronaut exertion state."
                }
            elif hr > avg_hr * 1.15:
                risk_score = "CAUTION"
                risk_level = "LOW"
                anomaly_alert = {
                    "metric": "Heart Rate Variance",
                    "severity": "LOW",
                    "message": f"Heart rate ({hr} BPM) is +15% above rolling window average.",
                    "recommendation": "Monitor physiological stability during current orbital phase."
                }

        return {
            "status": "success",
            "count": len(records),
            "mission_risk": {
                "status": risk_score,
                "level": risk_level
            },
            "anomaly_alert": anomaly_alert,
            "data": records
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/health/stream")
def stream_live_reading():
    try:
        hr = int(72 + random.uniform(-8, 12))
        sys_bp = int(120 + random.uniform(-6, 14))
        dia_bp = int(80 + random.uniform(-4, 8))
        temp = round(36.7 + random.uniform(-0.2, 0.4), 1)
        
        reading = {
            "astronaut_id": "DEMO-001",
            "data_type": "SIMULATED_SERIES",
            "heart_rate_bpm": hr,
            "systolic_bp_mmhg": sys_bp,
            "diastolic_bp_mmhg": dia_bp,
            "body_temperature_c": temp,
            "sleep_hours": 7.5,
            "mood_score": 4,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        response = supabase.table("health_readings").insert(reading).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/mission/report", response_class=PlainTextResponse)
def export_mission_report():
    try:
        response = supabase.table("health_readings").select("*").order("id", desc=True).limit(20).execute()
        records = response.data
        
        report = "========================================\n"
        report += " QUANTUMCODERS - OFFICIAL MISSION REPORT\n"
        report += " NASA SPACE APPS CHALLENGE 2026\n"
        report += "========================================\n\n"
        report += f"Generated At: {datetime.now(timezone.utc).isoformat()}\n"
        report += f"Total Records Analyzed: {len(records)}\n\n"
        report += "--- RECENT TELEMETRY LOGS ---\n"
        
        for r in records:
            report += f"ID: {r.get('id')} | Type: {r.get('data_type')} | Subject: {r.get('astronaut_id')}\n"
            report += f"  -> HR: {r.get('heart_rate_bpm')} BPM | BP: {r.get('systolic_bp_mmhg')}/{r.get('diastolic_bp_mmhg')} mmHg | Temp: {r.get('body_temperature_c')}°C\n"
            report += f"  -> Timestamp: {r.get('created_at') or r.get('recorded_at')}\n\n"
            
        report += "--- END OF SECURE TELEMETRY REPORT ---\n"
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/mission/comms")
def mission_comms(payload: dict):
    query = payload.get("message", "").lower()
    
    if "risk" in query or "statut" in query or "status" in query:
        response_text = "MISSION STATUS: Nominal operational bounds verified. Cardiovascular telemetry stable across active channels."
    elif "anomaly" in query or "anomalie" in query:
        response_text = "ANOMALY ENGINE: Statistical baseline monitoring active. No critical threshold breaches detected on OSDR-SUBJ-01."
    elif "nasa" in query or "osdr" in query:
        response_text = "NASA OSDR DATABASE: Open-source spaceflight research datasets synchronized successfully from repository."
    else:
        response_text = f"FLIGHT COMMS: Query received ('{query}'). Telemetry systems fully operational. All life support indicators green."
        
    return {"status": "success", "reply": response_text}

@app.post("/api/v1/health/readings/seed")
def seed_historical_readings():
    try:
        base_time = datetime.now(timezone.utc) - timedelta(hours=6)
        records = []
        
        for i in range(12):
            reading_time = base_time + timedelta(minutes=30 * i)
            if i == 11:
                hr = 88
                sys_bp = 132
                dia_bp = 88
            else:
                hr = int(72 + random.uniform(-4, 6))
                sys_bp = int(120 + random.uniform(-4, 6))
                dia_bp = int(80 + random.uniform(-3, 3))

            temp = round(36.7 + random.uniform(-0.2, 0.3), 1)
            sleep = 7.5
            mood = random.choice([4, 5])
            
            records.append({
                "astronaut_id": "DEMO-001",
                "data_type": "SIMULATED_SERIES",
                "heart_rate_bpm": hr,
                "systolic_bp_mmhg": sys_bp,
                "diastolic_bp_mmhg": dia_bp,
                "body_temperature_c": temp,
                "sleep_hours": sleep,
                "mood_score": mood,
                "created_at": reading_time.isoformat()
            })

        response = supabase.table("health_readings").insert(records).execute()

        return {
            "status": "success",
            "message": f"Successfully seeded {len(records)} historical readings with a test anomaly spike",
            "count": len(response.data)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))