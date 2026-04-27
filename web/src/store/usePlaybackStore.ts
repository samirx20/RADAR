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
  
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  
  currentFrame: TelemetryFrame;
  currentAI: AIPrediction;
  activeSolution: Solution | null;

  setIndex: (index: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  nextFrame: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  telemetry: telemetryData as TelemetryFrame[],
  aiPredictions: aiPredictions as AIPrediction[],
  solutions: solutionsData as Record<string, Solution>,
  currentIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  currentFrame: telemetryData[0] as TelemetryFrame,
  currentAI: aiPredictions[0] as AIPrediction,
  activeSolution: null,

  setIndex: (index: number) => {
    const { telemetry, aiPredictions, solutions, currentIndex } = get();
    if (index < 0 || index >= telemetry.length) return;

    const frame = telemetry[index];
    const prevFrame = telemetry[currentIndex];
    const ai = aiPredictions[index];
    const solution = (frame && frame.fault_code) ? (solutions as any)[frame.fault_code] : null;
    
    if (!frame || !ai) return;

    // Only auto-pause if we just transitioned from NO-FAULT to FAULT
    const shouldAutoPause = frame.is_fault && (!prevFrame || !prevFrame.is_fault);

    set({ 
      currentIndex: index, 
      currentFrame: frame,
      currentAI: ai,
      activeSolution: solution,
      isPlaying: shouldAutoPause ? false : get().isPlaying 
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed: number) => set({ playbackSpeed: speed }),

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
