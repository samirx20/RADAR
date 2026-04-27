import pandas as pd
import numpy as np
import json
import os
from scipy.interpolate import interp1d

def process_telemetry(input_csv="data/raw_telemetry.csv", output_json="web/src/data/processed_telemetry.json", target_fps=30):
    df = pd.read_csv(input_csv)
    
    # Ensure columns exist
    required_cols = ['timestamp'] + [f'actual_q_{i}' for i in range(6)] + ['protective_stop', 'fault_code']
    for col in required_cols:
        if col not in df.columns:
            if 'actual_q' in col: df[col] = 0.0
            else: df[col] = 0
            
    # Interpolation
    t_orig = df['timestamp'].values
    t_new = np.arange(t_orig[0], t_orig[-1], 1.0/target_fps)
    
    processed_data = []
    
    # Create interpolators for joints
    joint_interpolators = [interp1d(t_orig, df[f'actual_q_{i}'].values, kind='linear') for i in range(6)]
    
    # Fault data is discrete, so we use 'nearest' or just sample the closest
    fault_interpolator = interp1d(t_orig, df['protective_stop'].values, kind='nearest')
    
    # For fault codes (strings), we'll find the closest timestamp
    def get_closest_fault_code(t):
        idx = (np.abs(t_orig - t)).argmin()
        val = df['fault_code'].values[idx]
        return val if pd.notna(val) else ""

    for t in t_new:
        processed_data.append({
            "timestamp": float(t),
            "joints": [float(interp(t)) for interp in joint_interpolators],
            "is_fault": int(fault_interpolator(t)) == 1,
            "fault_code": get_closest_fault_code(t)
        })
        
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w') as f:
        json.dump(processed_data, f)
        
    print(f"Processed telemetry exported to {output_json} ({len(processed_data)} frames)")

if __name__ == "__main__":
    process_telemetry()
