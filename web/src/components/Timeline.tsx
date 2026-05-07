'use client';

import { useEffect, useRef, useMemo } from 'react';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function Timeline() {
  const { 
    currentIndex, 
    telemetry, 
    isPlaying, 
    togglePlay, 
    setIndex, 
    nextFrame,
    playbackSpeed 
  } = usePlaybackStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate fault positions for markers
  const faultMarkers = useMemo(() => {
    return telemetry
      .map((f, i) => (f.is_fault ? i : -1))
      .filter((i) => i !== -1);
  }, [telemetry]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        const { currentIndex, telemetry, setIndex } = usePlaybackStore.getState();
        if (currentIndex < telemetry.length - 1) {
          setIndex(currentIndex + 1);
        } else {
          usePlaybackStore.setState({ isPlaying: false });
        }
      }, 16);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center w-full gap-4 px-4 py-2 bg-secondary/30 rounded-lg border shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIndex(0)}
          className="w-7 h-7 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant={isPlaying ? "secondary" : "default"} 
          size="icon" 
          onClick={togglePlay}
          className={`w-8 h-8 ${!isPlaying ? 'bg-primary text-primary-foreground' : ''}`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center relative py-4">
        {/* Fault Markers */}
        <div className="absolute top-[18px] left-0 right-0 h-1.5 pointer-events-none z-0 px-2">
           <div className="relative w-full h-full">
            {faultMarkers.map((idx) => (
              <div 
                key={idx}
                className="absolute h-full w-0.5 bg-destructive/50"
                style={{ left: `${(idx / (telemetry.length - 1)) * 100}%` }}
              />
            ))}
           </div>
        </div>
        
        <Slider
          value={[currentIndex]}
          max={telemetry.length - 1}
          step={1}
          onValueChange={(val) => {
              const arr = val as number[];
              setIndex(arr[0]);
            }}
          className="cursor-pointer relative z-10"
        />
      </div>

      <div className="text-[10px] font-mono text-muted-foreground min-w-[50px] text-right">
        {telemetry[currentIndex].timestamp.toFixed(2)}s
      </div>
    </div>
  );
}
