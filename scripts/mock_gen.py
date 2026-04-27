import pandas as pd
import numpy as np
import os

def generate_mock_telemetry(filename="data/raw_telemetry.csv", duration_sec=10, freq_hz=125):
    """
    Generates a mock UR flight_recorder CSV.
    UR typically logs at 125Hz or 500Hz.
    """
    n_samples = duration_sec * freq_hz
    t = np.linspace(0, duration_sec, n_samples)
    
    # Simulate 6 joints (actual_q) moving in a sine wave
    data = {
        'timestamp': t,
        'actual_q_0': 0.5 * np.sin(t),
        'actual_q_1': -1.0 + 0.2 * np.cos(t),
        'actual_q_2': 1.5 + 0.3 * np.sin(t * 0.5),
        'actual_q_3': -1.57 + 0.1 * np.cos(t),
        'actual_q_4': 1.57 + 0.1 * np.sin(t),
        'actual_q_5': 0.0 + 0.5 * np.cos(t * 0.8),
        'protective_stop': [0] * n_samples,
        'fault_code': [""] * n_samples
    }
    
    # Inject a "Protective Stop" at 7 seconds
    stop_idx = int(7 * freq_hz)
    for i in range(stop_idx, n_samples):
        data['protective_stop'][i] = 1
        data['fault_code'][i] = "C153A2" # Mock code from blueprint
        # Freeze joints at stop
        for j in range(6):
            data[f'actual_q_{j}'][i] = data[f'actual_q_{j}'][stop_idx]

    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df.to_csv(filename, index=False)
    print(f"Mock telemetry generated: {filename}")

if __name__ == "__main__":
    generate_mock_telemetry()
