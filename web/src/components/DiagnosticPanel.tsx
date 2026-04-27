'use client';

import { usePlaybackStore } from '@/store/usePlaybackStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react';

export function DiagnosticPanel() {
  const { currentFrame, activeSolution } = usePlaybackStore();

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* System Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          {currentFrame.is_fault ? (
            <Badge variant="destructive" className="animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" /> FAULT
            </Badge>
          ) : (
            <Badge variant="default" className="bg-emerald-500">
              <CheckCircle2 className="w-3 h-3 mr-1" /> NORMAL
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Timestamp: {currentFrame.timestamp.toFixed(3)}s
          </div>
        </CardContent>
      </Card>

      {/* Joint Telemetry */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <Activity className="w-4 h-4 mr-2" /> Joint Positions (rad)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {currentFrame.joints.map((val, i) => (
              <div key={i} className="p-2 border rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Joint {i}</div>
                <div className="font-mono text-sm">{val.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Solution */}
      <Card className={`border-2 transition-colors ${currentFrame.is_fault ? 'border-destructive ring-1 ring-destructive' : ''}`}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Diagnostic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {activeSolution ? (
              <div className="space-y-2">
                <div className="font-bold text-destructive">{activeSolution.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {activeSolution.solution}
                </div>
                <div className="mt-4 p-2 bg-muted rounded text-[10px] font-mono">
                  ERROR_CODE: {currentFrame.fault_code}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No active errors detected. System operating within normal parameters.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
