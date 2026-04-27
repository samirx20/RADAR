import { create } from 'zustand';
import telemetryData from '@/data/processed_telemetry.json';
import solutionsData from '@/data/solutions.json';

interface TelemetryFrame {
  timestamp: number;
  joints: number[];
  is_fault: boolean;
  fault_code: string;
}

interface Solution {
  title: string;
  solution: string;
  highlight_joint: string;
}

interface PlaybackState {
  // Data
  telemetry: TelemetryFrame[];
  solutions: Record<string, Solution>;
  
  // Playback Control
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  
  // Derived State
  currentFrame: TelemetryFrame;
  activeSolution: Solution | null;

  // Actions
  setIndex: (index: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  nextFrame: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  telemetry: telemetryData as TelemetryFrame[],
  solutions: solutionsData as Record<string, Solution>,
  currentIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  currentFrame: telemetryData[0] as TelemetryFrame,
  activeSolution: null,

  setIndex: (index: number) => {
    const frame = telemetryData[index] as TelemetryFrame;
    const solution = frame.fault_code ? (solutionsData as any)[frame.fault_code] : null;
    set({ 
      currentIndex: index, 
      currentFrame: frame,
      activeSolution: solution,
      // Auto-pause on fault entry if we were playing
      isPlaying: frame.is_fault ? false : get().isPlaying 
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
