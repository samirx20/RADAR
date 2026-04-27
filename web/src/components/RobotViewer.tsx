'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Center } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { usePlaybackStore } from '@/store/usePlaybackStore';

function RobotArm() {
  const { currentFrame } = usePlaybackStore();
  
  // Refs for the 6 joints
  const j0 = useRef<THREE.Group>(null);
  const j1 = useRef<THREE.Group>(null);
  const j2 = useRef<THREE.Group>(null);
  const j3 = useRef<THREE.Group>(null);
  const j4 = useRef<THREE.Group>(null);
  const j5 = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!currentFrame) return;
    const q = currentFrame.joints;
    
    // Map joints to rotations (Example mapping for a generic arm)
    if (j0.current) j0.current.rotation.y = q[0];
    if (j1.current) j1.current.rotation.z = q[1];
    if (j2.current) j2.current.rotation.z = q[2];
    if (j3.current) j3.current.rotation.z = q[3];
    if (j4.current) j4.current.rotation.y = q[4];
    if (j5.current) j5.current.rotation.z = q[5];
  });

  const isFault = currentFrame.is_fault;
  const faultColor = new THREE.Color('#ef4444');
  const normalColor = new THREE.Color('#64748b');

  return (
    <group position={[0, 0, 0]}>
      {/* Base */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 32]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Joint 0: Base Rotation */}
      <group ref={j0} position={[0, 0.5, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* Joint 1: Shoulder */}
        <group ref={j1} position={[0, 0.2, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.15, 1.0, 0.15]} />
            <meshStandardMaterial color={isFault ? faultColor : normalColor} />
          </mesh>

          {/* Joint 2: Elbow */}
          <group ref={j2} position={[0, 1.0, 0]}>
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.12, 0.8, 0.12]} />
              <meshStandardMaterial color={isFault ? faultColor : normalColor} />
            </mesh>

            {/* Joint 3: Wrist 1 */}
            <group ref={j3} position={[0, 0.8, 0]}>
              <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.1, 0.3, 0.1]} />
                <meshStandardMaterial color="#94a3b8" />
              </mesh>

              {/* Joint 4: Wrist 2 */}
              <group ref={j4} position={[0, 0.3, 0]}>
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.08, 0.2, 0.08]} />
                  <meshStandardMaterial color="#cbd5e1" />
                </mesh>

                {/* Joint 5: Wrist 3 (Tool flange) */}
                <group ref={j5} position={[0, 0.2, 0]}>
                  <mesh position={[0, 0.05, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
                    <meshStandardMaterial color="#f8fafc" />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export function RobotViewer() {
  return (
    <div className="w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 3, 3]} />
        <OrbitControls makeDefault />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={10} 
          sectionSize={1} 
          sectionThickness={1.5} 
          gridShape="square"
          cellSize={0.5}
        />
        
        <Center top>
          <RobotArm />
        </Center>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
