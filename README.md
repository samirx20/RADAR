# Universal Robot (UR) Diagnostics Engine

A high-fidelity Digital Twin and Predictive Maintenance dashboard for Universal Robots. This project integrates real-time robotic telemetry with a 3D visualization engine to detect, visualize, and provide solutions for industrial robot faults.

## 🚀 Features
- **3D Digital Twin:** Real-time kinematic mapping of UR5e joint data using Three.js and React-Three-Fiber.
- **Diagnostic Rule Engine:** Automated fault detection that pauses playback and highlights faulty joints in red.
- **Telemetry Pipeline:** Python-based data ingestion and interpolation (125Hz to 30Hz) for web-optimized performance.
- **Predictive Ready:** Architecture prepared for Anomaly Detection ML models.
- **Clean UI:** Built with Next.js 14, Tailwind CSS, and Shadcn/UI for a professional industrial aesthetic.

## 🏗️ Architecture
1. **Data Layer:** Raw telemetry (`.csv`) captured from URSim (Docker).
2. **Processing Layer:** Python scripts for cleaning, normalization, and interpolation.
3. **Frontend Layer:** Next.js dashboard featuring a global state (Zustand) for synchronized 3D and Diagnostic UI.

## 🛠️ Setup Instructions

### Python Pipeline
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
3. Install dependencies: `pip install -r requirements.txt`
4. Run processing script: `python scripts/process_data.py`

### Web Dashboard
1. Navigate to the web folder: `cd web`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. View at: `http://localhost:3000`

## 📊 Data Requirements
The system expects UR flight recorder data with columns for `timestamp`, `actual_q_0` through `actual_q_5`, and `protective_stop`.

---
*Developed for University Major Project - UR Diagnostics & Digital Twin Systems.*
