import pandas as pd
import numpy as np
import os
import random

def generate_realistic_trajectory(t, motion_type='pick_place'):
    """
    Generate realistic joint trajectories similar to UR operations.
    motion_type: 'pick_place', 'weld', 'paint', 'inspection'
    """
    joints = np.zeros((len(t), 6))
    
    if motion_type == 'pick_place':
        # Pick and place motion - reach, grab, move, release
        for i, ti in enumerate(t):
            phase = (ti % 4) / 4  # 4 second cycle
            
            if phase < 0.3:  # Reach
                joints[i] = [
                    0.3 + 0.2 * np.sin(phase * np.pi / 0.3),
                    -0.8 + 0.3 * np.sin(phase * np.pi / 0.3),
                    -1.2 + 0.4 * np.sin(phase * np.pi / 0.3),
                    -0.5 + 0.2 * np.sin(phase * np.pi / 0.3),
                    0.8,
                    0.0
                ]
            elif phase < 0.5:  # Grab (pause)
                joints[i] = joints[i-1] if i > 0 else [0.5, -0.5, -0.8, -0.3, 0.8, 0]
            elif phase < 0.8:  # Move
                progress = (phase - 0.5) / 0.3
                joints[i] = [
                    0.5 + progress * 0.5,
                    -0.5 - progress * 0.5,
                    -0.8 + progress * 0.3,
                    -0.3 + progress * 0.5,
                    0.8 - progress * 0.3,
                    progress * 0.5
                ]
            else:  # Release and return
                progress = (phase - 0.8) / 0.2
                joints[i] = [
                    1.0 - progress * 0.7,
                    -1.0 + progress * 0.5,
                    -0.5 - progress * 0.7,
                    0.2 - progress * 0.5,
                    0.5 + progress * 0.3,
                    0.5 - progress * 0.5
                ]
    
    elif motion_type == 'weld':
        # Arc welding - smooth continuous motion along a line
        for i, ti in enumerate(t):
            phase = (ti % 3) / 3
            joints[i] = [
                0.2 + 0.6 * phase,
                -0.6 + 0.2 * np.sin(phase * 4 * np.pi),
                -1.0 + 0.3 * np.sin(phase * 4 * np.pi),
                0.0 + 0.4 * np.sin(phase * 4 * np.pi),
                0.5 + 0.1 * np.sin(phase * 4 * np.pi),
                -0.3 + 0.2 * phase
            ]
    
    elif motion_type == 'inspection':
        # Inspection - slow, careful movements
        for i, ti in enumerate(t):
            phase = (ti % 5) / 5
            joints[i] = [
                0.4 * np.sin(phase * 2 * np.pi),
                -0.9 + 0.4 * np.sin(phase * 2 * np.pi),
                -1.4 + 0.3 * np.sin(phase * 2 * np.pi),
                -0.4 + 0.3 * np.cos(phase * 2 * np.pi),
                0.6 + 0.2 * np.sin(phase * 2 * np.pi),
                0.1 * np.sin(phase * 4 * np.pi)
            ]
    
    else:  # Default continuous motion
        for i, ti in enumerate(t):
            joints[i] = [
                0.5 * np.sin(ti * 0.8 + 0),
                -1.0 * np.sin(ti * 0.6 + 1) + 0.3,
                1.5 * np.sin(ti * 0.4 + 2) - 0.5,
                -1.57 * np.sin(ti * 0.7 + 3),
                1.57 * np.cos(ti * 0.5 + 4),
                0.5 * np.sin(ti * 0.9 + 5)
            ]
    
    return joints

def compute_velocity(joints, dt):
    """Compute joint velocities from positions"""
    velocities = np.zeros_like(joints)
    for j in range(6):
        velocities[:, j] = np.gradient(joints[:, j], dt)
    return velocities

def compute_current(joints, velocities):
    """Simulate motor currents based on joint loads"""
    n_samples = len(joints)
    currents = np.zeros((n_samples, 6))
    
    joint_inertia = [0.15, 0.2, 0.12, 0.08, 0.08, 0.05]
    gravity = [0, 0.5, 0.5, 0, 0, 0]
    
    for i in range(n_samples):
        for j in range(6):
            acc = velocities[i+1, j] - velocities[i, j] if i < n_samples-1 else 0
            current = (
                joint_inertia[j] * abs(acc) * 0.15 +
                0.05 * abs(velocities[i, j]) +
                gravity[j] * 0.008
            )
            current += np.random.uniform(0, 0.01)
            currents[i, j] = max(0.2, current)
    
    return currents

def inject_overcurrent(data, joint, start_time, duration):
    """Inject overcurrent fault at specific joint - gradual increase over time"""
    start_idx = int(start_time * 125)
    duration_idx = int(duration * 125)
    
    error_codes = ['C153A2', 'C153B2', 'C153B3', 'C153B4']
    
    if start_idx < len(data['actual_q_0']):
        for i in range(start_idx, min(start_idx + duration_idx, len(data['actual_q_0']))):
            progress = (i - start_idx) / duration_idx if duration_idx > 0 else 0
            data['protective_stop'][i] = 1
            data['fault_code'][i] = error_codes[joint % len(error_codes)]
            data[f'actual_current_{joint}'][i] = data[f'actual_current_{joint}'][i] * (1.0 + progress * 2.0)
    
    return data

def inject_heating(data, joint, start_time, duration):
    """Inject gradual heating drift (current increases over time)"""
    start_idx = int(start_time * 125)
    duration_idx = int(duration * 125)
    
    error_codes = ['C153A8', 'C153B7']
    
    if start_idx < len(data['actual_q_0']):
        for i in range(start_idx, min(start_idx + duration_idx, len(data['actual_q_0']))):
            progress = (i - start_idx) / duration_idx if duration_idx > 0 else 0
            data['protective_stop'][i] = 1
            data['fault_code'][i] = error_codes[joint % len(error_codes)]
            data[f'actual_current_{joint}'][i] = data[f'actual_current_{joint}'][i] * (1.0 + progress * 0.8)
    
    return data

def inject_vibration(data, joint, start_time, duration):
    """Inject vibration (oscillations in velocity) - build up gradually"""
    start_idx = int(start_time * 125)
    duration_idx = int(duration * 125)
    
    error_codes = ['C153A3']
    
    if start_idx < len(data['actual_qd_0']):
        for i in range(start_idx, min(start_idx + duration_idx, len(data['actual_qd_0']))):
            progress = (i - start_idx) / duration_idx if duration_idx > 0 else 0
            data['protective_stop'][i] = 1
            data['fault_code'][i] = error_codes[0]
            oscillation = np.sin(i * 0.5) * (0.2 + progress * 0.3)
            data[f'actual_qd_{joint}'][i] += oscillation
            data[f'actual_current_{joint}'][i] += abs(oscillation) * (1.0 + progress)
    
    return data

def inject_fault(data, fault_type, start_time, duration, joint=0):
    """
    Inject realistic faults into telemetry
    fault_type: 'overcurrent', 'heating', 'vibration'
    """
    if fault_type == 'overcurrent':
        data = inject_overcurrent(data, joint, start_time, duration)
    elif fault_type == 'heating':
        data = inject_heating(data, joint, start_time, duration)
    elif fault_type == 'vibration':
        data = inject_vibration(data, joint, start_time, duration)
    
    return data

def generate_mock_telemetry(
    filename="data/raw_telemetry.csv",
    duration_sec=30,
    freq_hz=125,
    motion_type='pick_place',
    include_faults=True,
    fault_type=None,
    fault_joint=None,
    fault_time=None
):
    """
    Generate realistic UR robot telemetry with multiple motion types.
    
    Args:
        filename: Output CSV path
        duration_sec: Recording duration in seconds
        freq_hz: Sampling frequency (125Hz typical for UR)
        motion_type: Type of robot motion ('pick_place', 'weld', 'inspection', 'mixed')
        include_faults: Whether to inject faults
        fault_type: Specific fault type ('overcurrent', 'heating', 'vibration')
        fault_joint: Joint index for fault (0-5)
        fault_time: Time ratio for fault (0.0-1.0)
    """
    n_samples = int(duration_sec * freq_hz)
    t = np.linspace(0, duration_sec, n_samples)
    dt = 1.0 / freq_hz
    
    print(f"Generating {n_samples} samples at {freq_hz}Hz...")
    
    # Generate joint positions
    if motion_type == 'mixed':
        # Mix different motion types
        joints = np.zeros((n_samples, 6))
        segments = ['pick_place', 'weld', 'inspection']
        segment_len = n_samples // 3
        
        for seg_idx, seg_type in enumerate(segments):
            start = seg_idx * segment_len
            end = start + segment_len
            seg_t = t[start:end]
            joints[start:end] = generate_realistic_trajectory(seg_t, seg_type)
    else:
        joints = generate_realistic_trajectory(t, motion_type)
    
    # Add realistic noise
    noise_level = 0.002  # Small position noise
    joints += np.random.normal(0, noise_level, joints.shape)
    
    # Compute velocities
    velocities = compute_velocity(joints, dt)
    
    # Compute currents
    currents = compute_current(joints, velocities)
    
    # Build data dictionary
    data = {'timestamp': t}
    
    for j in range(6):
        data[f'actual_q_{j}'] = joints[:, j]
        data[f'actual_qd_{j}'] = velocities[:, j]  # velocity
        data[f'actual_current_{j}'] = currents[:, j]
    
    data['protective_stop'] = [0] * n_samples
    data['fault_code'] = [''] * n_samples
    
    # Inject faults if enabled
    if include_faults and fault_type:
        # Use custom fault parameters - fault_time is already in seconds
        j = fault_joint if fault_joint is not None else random.randint(0, 5)
        t_start = fault_time if fault_time is not None else duration_sec * 0.5
        fault_duration = 8.0  # 8 seconds for gradual buildup (allows anomaly to rise)
        data = inject_fault(data, fault_type, t_start, fault_duration, joint=j)
        
        # Truncate data at end of fault zone (data ends when error stops robot)
        fault_end_idx = int((t_start + fault_duration) * 125)
        if fault_end_idx < n_samples:
            # Truncate all arrays to fault end
            for key in data:
                if isinstance(data[key], (list, np.ndarray)):
                    data[key] = data[key][:fault_end_idx]
    elif include_faults:
        # Default random faults for backward compatibility
        data = inject_fault(data, 'overcurrent', duration_sec * 0.4, 8.0, joint=2)
    
    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df.to_csv(filename, index=False)
    
    print(f"Generated: {filename}")
    print(f"  Duration: {duration_sec}s")
    print(f"  Samples: {n_samples}")
    print(f"  Motion: {motion_type}")
    print(f"  Faults: {'Yes' if include_faults else 'No'}")
    
    return df


def generate_all_datasets(output_dir="data/datasets"):
    """Generate all 10 datasets for demo"""
    datasets = [
        # Clean datasets (no faults)
        {"name": "clean_01.csv", "motion": "pick_place", "faults": False},
        {"name": "clean_02.csv", "motion": "weld", "faults": False},
        {"name": "clean_03.csv", "motion": "inspection", "faults": False},
        {"name": "clean_04.csv", "motion": "mixed", "faults": False},
        # Error datasets - hardcoded fault times (10-25 seconds range)
        {"name": "overcurrent_j2_13.csv", "motion": "pick_place", "fault_type": "overcurrent", "joint": 2, "time": 13},
        {"name": "overcurrent_j4_22.csv", "motion": "weld", "fault_type": "overcurrent", "joint": 4, "time": 22},
        {"name": "heating_j0_17.csv", "motion": "inspection", "fault_type": "heating", "joint": 0, "time": 17},
        {"name": "heating_j3_14.csv", "motion": "pick_place", "fault_type": "heating", "joint": 3, "time": 14},
        {"name": "vibration_j1_21.csv", "motion": "weld", "fault_type": "vibration", "joint": 1, "time": 21},
        {"name": "vibration_j5_16.csv", "motion": "inspection", "fault_type": "vibration", "joint": 5, "time": 16},
    ]
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating 10 datasets in {output_dir}...")
    print("=" * 50)
    
    for ds in datasets:
        filename = os.path.join(output_dir, ds["name"])
        include_faults = ds.get("faults", True)
        
        generate_mock_telemetry(
            filename=filename,
            duration_sec=30,
            freq_hz=125,
            motion_type=ds["motion"],
            include_faults=include_faults,
            fault_type=ds.get("fault_type"),
            fault_joint=ds.get("joint"),
            fault_time=ds.get("time")
        )
    
    print("=" * 50)
    print(f"All 10 datasets generated in {output_dir}/")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate UR robot telemetry')
    parser.add_argument('--duration', type=int, default=30, help='Duration in seconds')
    parser.add_argument('--freq', type=int, default=125, help='Sampling frequency Hz')
    parser.add_argument('--motion', type=str, default='pick_place', 
                        choices=['pick_place', 'weld', 'inspection', 'mixed'],
                        help='Type of robot motion')
    parser.add_argument('--no-faults', action='store_true', help='Disable fault injection')
    parser.add_argument('--output', type=str, default='data/raw_telemetry.csv', help='Output file')
    parser.add_argument('--all', action='store_true', help='Generate all 10 datasets')
    
    args = parser.parse_args()
    
    if args.all:
        generate_all_datasets()
    else:
        generate_mock_telemetry(
            filename=args.output,
            duration_sec=args.duration,
            freq_hz=args.freq,
            motion_type=args.motion,
            include_faults=not args.no_faults
        )