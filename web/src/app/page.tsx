'use client';

import { RobotViewer } from '@/components/RobotViewer';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';
import { Timeline } from '@/components/Timeline';
import { GraphSection } from '@/components/GraphSection';
import { Play, BarChart3, ChevronDown, Database } from 'lucide-react';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { useState, useMemo } from 'react';

const DATASETS = [
  { file: 'clean_01.csv', name: 'Clean #1', hasFault: false },
  { file: 'clean_02.csv', name: 'Clean #2', hasFault: false },
  { file: 'clean_03.csv', name: 'Clean #3', hasFault: false },
  { file: 'clean_04.csv', name: 'Clean #4', hasFault: false },
  { file: 'overcurrent_j2_13.csv', name: 'Overcurrent J2', hasFault: true },
  { file: 'overcurrent_j4_22.csv', name: 'Overcurrent J4', hasFault: true },
  { file: 'heating_j0_17.csv', name: 'Heating J0', hasFault: true },
  { file: 'heating_j3_14.csv', name: 'Heating J3', hasFault: true },
  { file: 'vibration_j1_21.csv', name: 'Vibration J1', hasFault: true },
  { file: 'vibration_j5_16.csv', name: 'Vibration J5', hasFault: true },
];

function HeaderDatasetSelector() {
  const { currentDataset, setDataset } = usePlaybackStore();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const currentSelected = DATASETS.find(d => d.file === currentDataset)?.name || 'Clean #1';

  const handleSelect = async (file: string, name: string) => {
    setDataset(file);
    setShowDropdown(false);
    
    try {
      const response = await fetch(`/data/datasets/${file}`);
      const text = await response.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const getColIndex = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name));
      const timestampIdx = getColIndex('timestamp');
      const jointIdxs = [0,1,2,3,4,5].map(i => getColIndex(`actual_q_${i}`));
      const currentIdxs = [0,1,2,3,4,5].map(i => getColIndex(`actual_current_${i}`));
      const faultIdx = getColIndex('protective_stop');
      const faultCodeIdx = getColIndex('fault_code');
      
      const newTelemetry = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < headers.length) continue;
        
        const joints = jointIdxs.map(idx => {
          const val = idx >= 0 ? parseFloat(cols[idx]) : 0;
          return isNaN(val) ? 0 : val;
        });
        const currents = currentIdxs.map(idx => {
          const val = idx >= 0 ? parseFloat(cols[idx]) : 0;
          return isNaN(val) ? 0 : val;
        });
        
        const faultVal = faultIdx >= 0 ? cols[faultIdx] : '0';
        const isFault = (parseInt(faultVal) === 1);
        const faultCode = faultCodeIdx >= 0 ? cols[faultCodeIdx] : '';
        
        newTelemetry.push({
          timestamp: timestampIdx >= 0 ? parseFloat(cols[timestampIdx]) : (i-1) * 0.033,
          joints: joints,
          currents: currents,
          is_fault: isFault,
          fault_code: faultCode
        });
      }
      
      if (newTelemetry.length > 0) {
        const store = usePlaybackStore.getState();
        store.telemetry = newTelemetry;
        store.setIndex(0);
      }
    } catch (err) {
      console.error('Failed to load dataset:', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
      >
        <Database className="w-4 h-4" />
        {currentSelected}
        <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-card border rounded-md shadow-lg z-50 max-h-[250px] overflow-auto">
          {DATASETS.map(ds => (
            <button
              key={ds.file}
              onClick={() => handleSelect(ds.file, ds.name)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${
                ds.hasFault ? 'text-amber-500' : 'text-green-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${ds.hasFault ? 'bg-amber-500' : 'bg-green-500'}`} />
              {ds.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { activeView, setView } = usePlaybackStore();

  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center px-6 py-3 border-b bg-card shrink-0 sticky top-0 z-50 justify-between">
        {/* Left: App Name */}
        <h1 className="text-xl font-bold tracking-widest uppercase text-nowrap">RADAR</h1>
        
        {/* Middle: Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
          <button
            onClick={() => setView('replay')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeView === 'replay' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            <Play className="w-4 h-4" />
            Replay
          </button>
          <button
            onClick={() => setView('graph')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              activeView === 'graph' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Graph
          </button>
        </div>
        
        {/* Right: Dataset Selector */}
        <HeaderDatasetSelector />
      </header>

      {/* Main Content Area - Allow vertical scroll if height is small */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-visible lg:overflow-hidden">
        {/* Left Column: Replay or Graph based on activeView */}
        <section className="flex-[2] flex flex-col p-4 gap-4 border-r lg:min-h-0 lg:h-[calc(100vh-53px)]">
          {/* 3D Replay Area - Locked to 16:9 */}
          <div className={`flex-none flex flex-col gap-2 ${activeView === 'graph' ? 'hidden' : ''}`}>
            <div className="aspect-video w-full bg-muted/20 rounded-lg overflow-hidden border relative shadow-inner">
               <RobotViewer />
            </div>
            {/* Timeline directly under replay */}
            <Timeline />
          </div>

          {/* Graph Section - Always visible in graph view */}
          <div className={`flex-1 min-h-[400px] lg:min-h-0 overflow-visible ${activeView === 'graph' ? 'block' : 'hidden'}`}>
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
