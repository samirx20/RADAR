import pandas as pd
import numpy as np
import os

def generate_realistic_telemetry(filename, duration_sec=60, freq_hz=125, is_anomalous=False):
    """
    Generates realistic UR5e telemetry with current and velocity.
    """
    n_samples = duration_sec * freq_hz
    t = np.linspace(0, duration_sec, n_samples)
    
    data = {'timestamp': t}
    
    # Base movement pattern (Sine waves for joints)
    for i in range(6):
        # Position (q)
        base_pos = np.sin(t * (0.5 + i*0.1)) * (0.5 + i*0.2)
        noise = np.random.normal(0, 0.001, n_samples)
        data[f'actual_q_{i}'] = base_pos + noise
        
        # Velocity (qd) - derivative of position
        data[f'actual_qd_{i}'] = np.gradient(data[f'actual_q_{i}'], 1.0/freq_hz)
        
        # Current (A) - proportional to velocity + noise
        # Normal current is around 1.0A - 2.5A for UR5e
        base_current = 1.2 + np.abs(data[f'actual_qd_{i}']) * 0.8
        current_noise = np.random.normal(0, 0.05, n_samples)
        data[f'actual_current_{i}'] = base_current + current_noise

    data['protective_stop'] = [0] * n_samples
    data['fault_code'] = [""] * n_samples
    
    if is_anomalous:
        # Inject 3 random anomalies (Current spikes)
        for _ in range(3):
            spike_idx = np.random.randint(freq_hz, n_samples - freq_hz)
            joint = np.random.randint(0, 6)
            # A huge current spike (5A - 8A) indicates an anomaly/collision
            data[f'actual_current_{joint}'][spike_idx:spike_idx+10] += np.random.uniform(4.0, 6.0)
            
            # 50% chance this anomaly leads to a real Protective Stop
            if np.random.random() > 0.5:
                stop_idx = spike_idx + 8
                data['protective_stop'][stop_idx:] = [1] * (n_samples - stop_idx)
                # Randomly pick from our 50 error codes
                random_code = f"C153{np.random.choice(['A','B','C','D','E'])}{np.random.randint(0,10)}"
                data['fault_code'][stop_idx:] = [random_code] * (n_samples - stop_idx)
                break # Stop generating more if robot halted

    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df.to_csv(filename, index=False)
    print(f"Generated: {filename} ({'ANOMALOUS' if is_anomalous else 'CLEAN'})")

if __name__ == "__main__":
    # 1. Training Data (Clean - 5 minutes)
    generate_realistic_telemetry("data/train_telemetry.csv", duration_sec=300, is_anomalous=False)
    
    # 2. Testing/Production Data (Noisy - 1 minute)
    generate_realistic_telemetry("data/raw_telemetry.csv", duration_sec=60, is_anomalous=True)
