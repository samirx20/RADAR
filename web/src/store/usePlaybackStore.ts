import { create } from 'zustand';
import telemetryData from '@/data/processed_telemetry.json';
import solutionsData from '@/data/solutions.json';
import aiPredictions from '@/data/ai_predictions.json';

interface TelemetryFrame {
  timestamp: number;
  joints: number[];
  currents: number[];
  is_fault: boolean;
  fault_code: string;
}

interface AIPrediction {
  is_anomaly: boolean;
  confidence: number;
}

interface Solution {
  title: string;
  solution: string;
  highlight_joint: string;
}

interface PlaybackState {
  telemetry: TelemetryFrame[];
  aiPredictions: AIPrediction[];
  solutions: Record<string, Solution>;
  currentDataset: string;
  anomalyScores: number[];
  
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  activeView: 'replay' | 'graph';
  
  currentFrame: TelemetryFrame;
  currentAI: AIPrediction;
  activeSolution: Solution | null;
  faultyJoint: number | null;

  setIndex: (index: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setView: (view: 'replay' | 'graph') => void;
  setDataset: (dataset: string) => void;
  nextFrame: () => void;
}

const JOINT_NAME_TO_INDEX: Record<string, number> = {
  'base_link': 0,
  'shoulder_pan_joint': 0,
  'shoulder_lift_joint': 1,
  'upper_arm_link': 1,
  'elbow_joint': 2,
  'forearm_link': 2,
  'wrist_1_joint': 3,
  'wrist1_link': 3,
  'wrist_2_joint': 4,
  'wrist2_link': 4,
  'wrist_3_joint': 5,
  'wrist3_link': 5,
  'tool0': 5,
};

const UR5E_JOINT_LIMITS = [
  { min: -Math.PI * 2, max: Math.PI * 2 },   // Joint 0: base pan
  { min: -2.0, max: 2.0 },                // Joint 1: shoulder lift (UR5e: -2.0 to 2.0 rad)
  { min: -2.0, max: 2.0 },                // Joint 2: elbow (UR5e: -2.0 to 2.0 rad)
  { min: -2.0, max: 2.0 },                // Joint 3: wrist 1
  { min: -2.0, max: 2.0 },                // Joint 4: wrist 2
  { min: -2.0, max: 2.0 },                // Joint 5: wrist 3
];

function clampJoint(jointIndex: number, value: number): number {
  const limits = UR5E_JOINT_LIMITS[jointIndex];
  if (!limits) return value;
  return Math.max(limits.min, Math.min(limits.max, value));
}

function parseFaultyJoint(solution: Solution | null): number | null {
  if (!solution?.highlight_joint) return null;
  const jointName = solution.highlight_joint.toLowerCase();
  return JOINT_NAME_TO_INDEX[jointName] ?? null;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  telemetry: telemetryData as TelemetryFrame[],
  aiPredictions: aiPredictions as AIPrediction[],
  solutions: solutionsData as Record<string, Solution>,
  currentDataset: 'clean_01.csv',
  anomalyScores: [],
  currentIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  activeView: 'replay',
  currentFrame: telemetryData[0] as TelemetryFrame,
  currentAI: aiPredictions[0] as AIPrediction,
  activeSolution: null,
  faultyJoint: null,

  setIndex: (index: number) => {
    const { telemetry, solutions, currentIndex } = get();
    if (index < 0 || index >= telemetry.length) return;

    const frame = telemetry[index];
    const prevFrame = telemetry[currentIndex];
    const solution = (frame && frame.fault_code) ? (solutions as any)[frame.fault_code] : null;
    
    if (!frame) return;

    const shouldAutoPause = frame.is_fault && (!prevFrame || !prevFrame.is_fault);
    const faultyJoint = parseFaultyJoint(solution);

    const clampedJoints = frame.joints.map((val, i) => clampJoint(i, val));
    const clampedFrame = { ...frame, joints: clampedJoints };

    set({ 
      currentIndex: index, 
      currentFrame: clampedFrame,
      activeSolution: solution,
      faultyJoint: faultyJoint,
      isPlaying: shouldAutoPause ? false : get().isPlaying 
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed: number) => set({ playbackSpeed: speed }),
  setView: (view: 'replay' | 'graph') => set({ activeView: view }),
  setDataset: (dataset: string) => set({ currentDataset: dataset }),

  nextFrame: () => {
    const { currentIndex, telemetry, isPlaying } = get();
    if (!isPlaying) return;
    
    if (currentIndex < telemetry.length - 1) {
      get().setIndex(currentIndex + 1);
    } else {
      set({ isPlaying: false });
    }
  }
}));