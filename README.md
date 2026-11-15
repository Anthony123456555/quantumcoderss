# 🚀 QuantumCoders — Astronaut Health & Mission Risk Monitoring System

> **NASA Space Apps Challenge 2026**  
> An advanced aerospace telemetry and physiological monitoring platform built for orbital missions, combining real time operational simulation with open source NASA research datasets.

---

## 🛰️ Overview

**QuantumCoders** is an end-to-end spaceflight monitoring prototype designed to track, analyze and visualize astronaut health indicators in real time. By bridging operational telemetry streams with authentic spaceflight research from the **NASA Open Science Data Repository (OSDR)**, the platform enables flight surgeons and mission controllers to monitor cardiovascular stress, detect statistical anomalies and assess mission risk indices during deep space operations.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Recharts
* **Backend:** Python 3.12, FastAPI, Uvicorn, Supabase Python SDK
* **Database & Storage:** Supabase PostgreSQL

---

## ✨ Core Features

1. **Dual Data Channel Switching:**
   * **Operational Telemetry:** Real time simulated astronaut telemetry channels (`DEMO-001`).
   * **NASA OSDR Research Data:** Connected directly to public spaceflight research datasets (`OSDR-SUBJ-01`) to benchmark microgravity cardiovascular impact.
2. **Live Telemetry Streaming:** Simulated live sensor injection pipeline (`/api/v1/health/stream`) that streams real time biometric updates directly into Supabase.
3. **Explainable Anomaly Detection Engine:** Automated backend baseline analysis that flags cardiovascular strain and calculates dynamic Mission Risk Indices (`NOMINAL`, `CAUTION`, `ELEVATED`).
4. **Mission Report Export:** Instant generation and download of official secure mission telemetry logs (`.txt`) for archival and debriefing.
5. **Flight Comms Intelligence Terminal:** An interactive CLI chat interface allowing operators to query mission status, anomaly states and database logs in real time.

---

## 📂 Project Structure

```text
quantumcoders/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── ingest_nasa.py
│   ├── requirements.txt
│   └── .env 
└── src/
    └── app/
        └── page.tsx
