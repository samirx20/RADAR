'use client';

import { RobotViewer } from '@/components/RobotViewer';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';
import { Timeline } from '@/components/Timeline';
import { GraphSection } from '@/components/GraphSection';
import { Cpu } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b bg-card shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary rounded-md">
            <Cpu className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase italic text-foreground text-nowrap">UR Diagnostics Engine</h1>
        </div>
      </header>

      {/* Main Content Area - Allow vertical scroll if height is small */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-visible lg:overflow-hidden">
        {/* Left Column: Replay, Scrubber, Tabs, Graph */}
        <section className="flex-[2] flex flex-col p-4 gap-4 border-r lg:min-h-0 lg:h-[calc(100vh-53px)]">
          {/* 3D Replay Area - Locked to 16:9 */}
          <div className="flex-none flex flex-col gap-2">
            <div className="aspect-video w-full bg-muted/20 rounded-lg overflow-hidden border relative shadow-inner">
               <RobotViewer />
            </div>
            {/* Timeline directly under replay */}
            <Timeline />
          </div>

          {/* Graph Section - Scrollable on mobile, flex on desktop */}
          <div className="flex-1 min-h-[400px] lg:min-h-0 overflow-visible">
            <GraphSection />
          </div>
        </section>

        {/* Right Column: Status & Data */}
        <aside className="flex-1 min-w-full lg:min-w-[400px] lg:max-w-[500px] flex flex-col bg-card/30 lg:h-[calc(100vh-53px)]">
          <DiagnosticPanel />
        </aside>
      </div>
    </main>
  );
}
