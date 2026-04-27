'use client';

import { RobotViewer } from '@/components/RobotViewer';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';
import { Timeline } from '@/components/Timeline';
import { Badge } from '@/components/ui/badge';
import { Settings, Cpu, ShieldAlert } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Cpu className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">UR Diagnostics Engine</h1>
            <p className="text-xs text-muted-foreground">Digital Twin & Fault Analysis System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Model Status</span>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              UR5e Connected (Sim)
            </Badge>
          </div>
          <Settings className="w-5 h-5 text-muted-foreground cursor-pointer hover:rotate-90 transition-transform" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: 3D Scene (Main Focus) */}
        <section className="flex-1 p-6 relative">
          <div className="absolute top-10 left-10 z-10 pointer-events-none">
            <div className="bg-background/80 backdrop-blur border p-4 rounded-xl shadow-2xl">
              <h2 className="text-xs font-bold text-muted-foreground uppercase mb-2">Active View</h2>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold tracking-wide">Real-time Kinematics</span>
              </div>
            </div>
          </div>
          <RobotViewer />
        </section>

        {/* Right: Diagnostics & Data */}
        <aside className="w-[400px] border-l bg-card/50 overflow-y-auto">
          <DiagnosticPanel />
        </aside>
      </div>

      {/* Bottom: Playback Controls */}
      <footer>
        <Timeline />
      </footer>
    </main>
  );
}
