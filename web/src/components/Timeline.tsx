'use client';

import { useEffect, useRef } from 'react';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

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

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        nextFrame();
      }, 1000 / (30 * playbackSpeed)); // 30 FPS target
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, nextFrame, playbackSpeed]);

  return (
    <div className="flex items-center w-full gap-6 px-6 py-4 border-t bg-background">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIndex(0)}
          className="w-8 h-8"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button 
          variant={isPlaying ? "secondary" : "default"} 
          size="icon" 
          onClick={togglePlay}
          className="w-10 h-10"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          <span>{telemetry[currentIndex].timestamp.toFixed(2)}s</span>
          <span>Timeline Control</span>
          <span>{telemetry[telemetry.length-1].timestamp.toFixed(2)}s</span>
        </div>
        <Slider
          value={[currentIndex]}
          max={telemetry.length - 1}
          step={1}
          onValueChange={(val) => setIndex(val[0])}
          className="cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-4 text-xs font-mono min-w-[80px] justify-end">
        <span className={usePlaybackStore.getState().currentFrame.is_fault ? "text-destructive font-bold animate-pulse" : ""}>
          Frame: {currentIndex}
        </span>
      </div>
    </div>
  );
}
