import pandas as pd
import numpy as np
import json
import os
import joblib
from scipy.interpolate import interp1d

def process_telemetry(input_csv="data/raw_telemetry.csv", output_json="web/src/data/processed_telemetry.json", target_fps=30):
    print(f"Reading {input_csv}...")
    df = pd.read_csv(input_csv)
    
    # 1. AI Inference (Run on raw data for best accuracy, then interpolate)
    model_path = "scripts/anomaly_model.joblib"
    ai_preds_raw = []
    if os.path.exists(model_path):
        print("Running AI Anomaly Detection...")
        model = joblib.load(model_path)
        features = [f'actual_current_{i}' for i in range(6)] + [f'actual_qd_{i}' for i in range(6)]
        X = df[features]
        preds = model.predict(X) # -1 or 1
        scores = model.decision_function(X)
        # Convert to 0 (normal) or 1 (anomaly) for interpolation
        ai_preds_raw = (preds == -1).astype(int)
    else:
        print("Warning: AI model not found. Skipping AI data.")
        ai_preds_raw = [0] * len(df)

    # 2. Setup Interpolation
    joint_cols = [f'actual_q_{i}' for i in range(6)]
    current_cols = [f'actual_current_{i}' for i in range(6)]
    
    t_orig = df['timestamp'].values
    t_new = np.arange(t_orig[0], t_orig[-1], 1.0/target_fps)
    
    processed_data = []
    ai_predictions = []
    
    # Create interpolators
    joint_interps = [interp1d(t_orig, df[col].values, kind='linear') for col in joint_cols]
    current_interps = [interp1d(t_orig, df[col].values, kind='linear') for col in current_cols]
    ai_interp = interp1d(t_orig, ai_preds_raw, kind='nearest') # Nearest for flags
    
    # Fault data
    stop_interp = interp1d(t_orig, df['protective_stop'].values, kind='nearest')

    print(f"Syncing AI and Telemetry to {target_fps}Hz...")
    for t in t_new:
        idx = (np.abs(t_orig - t)).argmin()
        processed_data.append({
            "timestamp": float(t),
            "joints": [float(interp(t)) for interp in joint_interps],
            "currents": [float(interp(t)) for interp in current_interps],
            "is_fault": int(stop_interp(t)) == 1,
            "fault_code": str(df['fault_code'].iloc[idx]) if 'fault_code' in df.columns else ""
        })
        
        # Add synchronized AI result
        is_anom = int(ai_interp(t)) == 1
        ai_predictions.append({
            "is_anomaly": is_anom,
            "confidence": 0.85 if is_anom else 0.1 # Simplified for now
        })
        
    # Export everything
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w') as f:
        json.dump(processed_data, f)
        
    with open("web/src/data/ai_predictions.json", 'w') as f:
        json.dump(ai_predictions, f)
        
    print(f"Success! Sync'd {len(processed_data)} frames.")

if __name__ == "__main__":
    process_telemetry()
