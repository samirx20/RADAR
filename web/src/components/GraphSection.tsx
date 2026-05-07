'use client';

import { usePlaybackStore } from '@/store/usePlaybackStore';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useMemo } from 'react';
import { Upload, ChevronDown } from 'lucide-react';

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

const JOINT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
const CURRENT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9'];

export function GraphSection() {
  const { telemetry, currentDataset, setDataset } = usePlaybackStore();
  const [activeTab, setActiveTab] = useState('kinematics');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState('Clean #1');
  
  const currentSelected = DATASETS.find(d => d.file === currentDataset)?.name || 'Clean #1';

  const handleDatasetSelect = async (file: string, name: string) => {
    setDataset(file);
    setSelectedName(name);
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
        console.log(`Loaded ${newTelemetry.length} frames from ${name}`);
      }
    } catch (err) {
      console.error('Failed to load dataset:', err);
    }
  };

  const graphData = useMemo(() => {
    if (!telemetry.length) return [];
    
    const step = Math.max(1, Math.floor(telemetry.length / 400));
    const baseThreshold = 1.0;
    const warnThreshold = 2.5;
    const critThreshold = 4.0;
    
    return telemetry
      .filter((_, i) => i % step === 0 || i === telemetry.length - 1)
      .map((f) => {
        const maxCurrent = Math.max(...f.currents);
        const avgCurrent = f.currents.reduce((a, b) => a + b, 0) / 6;
        
        const maxScore = maxCurrent < baseThreshold ? 0 : 
          maxCurrent < warnThreshold ? ((maxCurrent - baseThreshold) / (warnThreshold - baseThreshold)) * 35 :
          Math.min(80, 35 + ((maxCurrent - warnThreshold) / (critThreshold - warnThreshold)) * 45);
        
        const avgScore = avgCurrent < baseThreshold ? 0 : 
          Math.min(20, ((avgCurrent - baseThreshold) / (warnThreshold - baseThreshold)) * 20);
        
        const anomalyScore = Math.max(0, Math.min(100, maxScore + avgScore));
        
        return {
          time: f.timestamp.toFixed(1),
          q0: f.joints[0],
          q1: f.joints[1],
          q2: f.joints[2],
          q3: f.joints[3],
          q4: f.joints[4],
          q5: f.joints[5],
          c0: f.currents[0],
          c1: f.currents[1],
          c2: f.currents[2],
          c3: f.currents[3],
          c4: f.currents[4],
          c5: f.currents[5],
          is_fault: f.is_fault ? 1 : 0,
          ai_confidence: anomalyScore,
          avg_current: avgCurrent,
        };
      });
  }, [telemetry]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
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
      console.log(`Loaded ${newTelemetry.length} frames from ${file.name}`);
    }
  };

  return (
    <div className="h-full flex flex-col gap-2 min-h-[300px]">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 text-xs min-w-[140px]"
          >
            <Upload className="w-3 h-3" />
            {currentSelected}
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-card border rounded-md shadow-lg z-50 max-h-[200px] overflow-auto">
              {DATASETS.map(ds => (
                <button
                  key={ds.file}
                  onClick={() => handleDatasetSelect(ds.file, ds.name)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center gap-2 ${
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
        <span className="text-xs text-muted-foreground">
          {telemetry.length} frames
        </span>
      </div>

      <Tabs defaultValue="kinematics" className="w-full flex flex-col flex-1" onValueChange={setActiveTab}>
        <TabsList className="bg-card border w-fit">
          <TabsTrigger value="kinematics">Kinematics</TabsTrigger>
          <TabsTrigger value="dynamics">Dynamics</TabsTrigger>
          <TabsTrigger value="health">Health (AI)</TabsTrigger>
        </TabsList>

        <Card className="mt-2 bg-card/50 border flex-1 min-h-0 relative" style={{ minHeight: '300px' }}>
          <CardContent className="p-4 absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickFormatter={(val) => val.toFixed(2)}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                
                {activeTab === 'kinematics' && (
                  <>
                    {[0,1,2,3,4,5].map(i => (
                      <Line 
                        key={`q${i}`}
                        isAnimationActive={false} 
                        type="monotone" 
                        dataKey={`q${i}`} 
                        stroke={JOINT_COLORS[i]} 
                        dot={false} 
                        strokeWidth={1.5} 
                        name={`Joint ${i}`} 
                      />
                    ))}
                  </>
                )}
                
                {activeTab === 'dynamics' && (
                  <>
                    {[0,1,2,3,4,5].map(i => (
                      <Line 
                        key={`c${i}`}
                        isAnimationActive={false} 
                        type="monotone" 
                        dataKey={`c${i}`} 
                        stroke={CURRENT_COLORS[i]} 
                        dot={false} 
                        strokeWidth={1.5} 
                        name={`Motor ${i}`} 
                      />
                    ))}
                  </>
                )}

                {activeTab === 'health' && (
                  <>
                    <Line isAnimationActive={false} type="monotone" dataKey="avg_current" stroke="#f97316" dot={false} strokeWidth={1.5} name="Avg Current" />
                    <Line isAnimationActive={false} type="monotone" dataKey="ai_confidence" stroke="#8b5cf6" dot={false} strokeWidth={2} name="Anomaly Score" />
                    <Line isAnimationActive={false} type="step" dataKey="is_fault" stroke="#ef4444" dot={false} strokeWidth={1} strokeDasharray="3 3" name="Fault" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}