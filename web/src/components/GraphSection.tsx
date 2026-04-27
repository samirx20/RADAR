'use client';

import { usePlaybackStore } from '@/store/usePlaybackStore';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useMemo } from 'react';

export function GraphSection() {
  const { telemetry, currentIndex } = usePlaybackStore();
  const [activeTab, setActiveTab] = useState('kinematics');

  const graphData = useMemo(() => {
    const windowSize = 60; // Slightly smaller window for better visibility
    const start = Math.max(0, currentIndex - windowSize / 2);
    const end = Math.min(telemetry.length, start + windowSize);
    
    return telemetry.slice(start, end).map((f) => ({
      time: f.timestamp.toFixed(2),
      q0: f.joints[0],
      q1: f.joints[1],
      c0: f.currents[0],
      c1: f.currents[1],
      is_fault: f.is_fault ? 1 : 0
    }));
  }, [telemetry, currentIndex]);

  return (
    <div className="h-full flex flex-col gap-2 min-h-[300px]">
      <Tabs defaultValue="kinematics" className="w-full flex flex-col flex-1" onValueChange={setActiveTab}>
        <TabsList className="bg-card border w-fit">
          <TabsTrigger value="kinematics">Kinematics</TabsTrigger>
          <TabsTrigger value="dynamics">Dynamics</TabsTrigger>
          <TabsTrigger value="health">Health (AI)</TabsTrigger>
        </TabsList>

        <Card className="mt-2 bg-card/50 border flex-1 min-h-0 relative">
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
                
                {activeTab === 'kinematics' && (
                  <>
                    <Line isAnimationActive={false} type="monotone" dataKey="q0" stroke="var(--primary)" dot={false} strokeWidth={2} name="Joint 0" />
                    <Line isAnimationActive={false} type="monotone" dataKey="q1" stroke="#a855f7" dot={false} strokeWidth={2} name="Joint 1" />
                  </>
                )}
                
                {activeTab === 'dynamics' && (
                  <>
                    <Line isAnimationActive={false} type="monotone" dataKey="c0" stroke="#f59e0b" dot={false} strokeWidth={2} name="Current 0" />
                    <Line isAnimationActive={false} type="monotone" dataKey="c1" stroke="var(--destructive)" dot={false} strokeWidth={2} name="Current 1" />
                  </>
                )}

                {activeTab === 'health' && (
                  <Line isAnimationActive={false} type="step" dataKey="is_fault" stroke="var(--destructive)" dot={false} strokeWidth={3} name="Anomaly" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
