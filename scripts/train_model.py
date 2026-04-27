import pandas as pd
import numpy as np
import joblib
import json
import os
from sklearn.ensemble import IsolationForest

def train_anomaly_detector(train_csv="data/train_telemetry.csv", model_path="scripts/anomaly_model.joblib"):
    print(f"Training AI model on {train_csv}...")
    df = pd.read_csv(train_csv)
    
    # We train on Current and Velocity to find anomalies
    features = [f'actual_current_{i}' for i in range(6)] + [f'actual_qd_{i}' for i in range(6)]
    X_train = df[features]
    
    # Isolation Forest: contamination=0.01 means we expect 1% anomalies even in clean data (noise)
    model = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
    model.fit(X_train)
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    return model

def run_inference(test_csv="data/raw_telemetry.csv", model_path="scripts/anomaly_model.joblib", output_json="web/src/data/ai_predictions.json"):
    print(f"Running AI inference on {test_csv}...")
    model = joblib.load(model_path)
    df = pd.read_csv(test_csv)
    
    features = [f'actual_current_{i}' for i in range(6)] + [f'actual_qd_{i}' for i in range(6)]
    X_test = df[features]
    
    # Predict (-1 for anomaly, 1 for normal)
    preds = model.predict(X_test)
    
    # Map to probability-like score (distance from boundary)
    scores = model.decision_function(X_test)
    
    results = []
    for i in range(len(preds)):
        results.append({
            "is_anomaly": bool(preds[i] == -1),
            "confidence": float(np.clip(1.0 - (scores[i] + 0.5), 0, 1)) # Simple mapping
        })
        
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w') as f:
        json.dump(results, f)
    
    print(f"AI Predictions exported to {output_json}")

if __name__ == "__main__":
    train_anomaly_detector()
    run_inference()
