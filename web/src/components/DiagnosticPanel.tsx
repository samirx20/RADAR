'use client';

import { usePlaybackStore } from '@/store/usePlaybackStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export function DiagnosticPanel() {
  const { currentFrame, currentAI, activeSolution } = usePlaybackStore();

  return (
    <div className="flex flex-col h-full p-4 gap-4 min-h-0">
      {/* 1. System Status & Diagnostics (Top) */}
      <Card className={`shrink-0 border-2 transition-all duration-500 ${currentFrame.is_fault ? 'border-destructive bg-destructive/10' : 'border-border'}`}>
        <CardHeader className="pb-3 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">System Status</CardTitle>
            <div className="flex gap-2">
              {currentAI.is_anomaly && <Badge variant="outline" className="text-orange-500 border-orange-500 animate-pulse bg-orange-500/10 py-0 h-5">AI WARNING</Badge>}
              {currentFrame.is_fault ? (
                <Badge variant="destructive" className="animate-bounce py-0 h-5"><AlertCircle className="w-2.5 h-2.5 mr-1" /> CRITICAL FAULT</Badge>
              ) : (
                <Badge variant="default" className="bg-emerald-600 py-0 h-5"><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> OPERATIONAL</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {currentFrame.is_fault ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive-foreground">
                <ShieldAlert className="w-5 h-5 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-bold underline mb-1">{activeSolution ? activeSolution.title : "Unknown Critical Error"}</p>
                  <p className="text-xs leading-relaxed opacity-90">{activeSolution ? activeSolution.solution : "No specific solution found for this code. Please consult the UR hardware manual."}</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground flex justify-between">
                <span className="font-bold text-destructive underline uppercase tracking-tight">ERROR CODE: {currentFrame.fault_code || "N/A"}</span>
                <span>TS: {currentFrame.timestamp.toFixed(4)}s</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-1">No active faults. AI monitoring healthy.</p>
          )}
        </CardContent>
      </Card>

      {/* 2. Live Telemetry Data List (Bottom - Scrollable) */}
      <Card className="flex-1 min-h-0 border-border bg-card/50 flex flex-col overflow-hidden">
        <CardHeader className="pb-2 py-4 shrink-0">
          <CardTitle className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Live Telemetry</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
          <ScrollArea className="h-full w-full px-4">
            <div className="space-y-6 py-4 pb-12">
              {/* Kinematics Section */}
              <section>
                <h3 className="text-[11px] font-bold text-primary uppercase mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Kinematics (Joint Angles)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentFrame.joints.map((val, i) => (
                    <div key={i} className="flex flex-col p-2 bg-muted/50 rounded border border-border">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">Joint {i}</span>
                      <span className="font-mono text-xs">{val.toFixed(4)} rad</span>
                    </div>
                  ))}
                </div>
              </section>

              <Separator className="bg-border" />

              {/* Dynamics Section */}
              <section>
                <h3 className="text-[11px] font-bold text-orange-500 uppercase mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Dynamics (Amperage)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentFrame.currents.map((val, i) => (
                    <div key={i} className="flex flex-col p-2 bg-muted/50 rounded border border-border">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">Motor {i}</span>
                      <span className={`font-mono text-xs ${val > 4.0 ? 'text-destructive font-bold' : ''}`}>
                        {val.toFixed(2)} A
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <Separator className="bg-border" />

              {/* Health Section */}
              <section>
                <h3 className="text-[11px] font-bold text-purple-500 uppercase mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Health & AI Logic
                </h3>
                <div className="space-y-2">
                   <div className="flex justify-between p-2 bg-muted/50 rounded text-xs border border-border">
                      <span className="text-muted-foreground">Anomaly Index</span>
                      <span className="font-mono">{(currentAI.confidence * 100).toFixed(1)}%</span>
                   </div>
                   <div className="flex justify-between p-2 bg-muted/50 rounded text-xs border border-border">
                      <span className="text-muted-foreground">Stop Flag</span>
                      <span className="font-mono text-primary">{currentFrame.is_fault ? 'HIGH' : 'LOW'}</span>
                   </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
