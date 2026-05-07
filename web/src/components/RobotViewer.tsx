'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Center } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { usePlaybackStore } from '@/store/usePlaybackStore';

const UR5E = {
  base_height: 0.089159,
  shoulder_to_upperarm: 0.425,
  upperarm_to_forearm: 0.39225,
  forearm_to_wrist1: 0.10915,
  wrist1_to_wrist2: 0.09465,
  wrist2_to_wrist3: 0.0823,
};

const COLORS = {
  dark: '#1e293b',
  mid: '#334155',
  light: '#475569',
  accent: '#64748b',
  white: '#f8fafc',
  fault: '#ef4444',
  warning: '#f59e0b',
};

function JointHousing({ radius, height, color }: { radius: number; height: number; color: string }) {
  return (
    <mesh>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function RobotArm() {
  const { currentFrame, faultyJoint } = usePlaybackStore();

  const j0 = useRef<THREE.Group>(null);
  const j1 = useRef<THREE.Group>(null);
  const j2 = useRef<THREE.Group>(null);
  const j3 = useRef<THREE.Group>(null);
  const j4 = useRef<THREE.Group>(null);
  const j5 = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!currentFrame) return;
    const q = currentFrame.joints;
    if (j0.current) j0.current.rotation.y = q[0];
    if (j1.current) j1.current.rotation.z = q[1];
    if (j2.current) j2.current.rotation.z = q[2];
    if (j3.current) j3.current.rotation.z = q[3];
    if (j4.current) j4.current.rotation.y = q[4];
    if (j5.current) j5.current.rotation.z = q[5];
  });

  const isFault = currentFrame?.is_fault;
  const getColor = (jointIdx: number) => 
    isFault && faultyJoint === jointIdx ? COLORS.fault : COLORS.light;

  return (
    <group position={[0, 0.089159, 0]}>
      {/* BASE - cylindrical stand */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.07, 0.075, 0.09, 32]} />
        <meshStandardMaterial color={COLORS.dark} />
      </mesh>
      {/* Base cable exit */}
      <mesh position={[0.06, 0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.02, 0.03, 0.08]} />
        <meshStandardMaterial color={COLORS.mid} />
      </mesh>

      {/* JOINT 0 - Base rotation (turntable) */}
      <group ref={j0} position={[0, 0.089159, 0]}>
        {/* Shoulder housing - rounded cylinder */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.058, 0.062, 0.12, 32]} />
          <meshStandardMaterial color={getColor(0)} />
        </mesh>
        {/* Cable routing channel */}
        <mesh position={[0, 0.06, 0.055]}>
          <boxGeometry args={[0.02, 0.08, 0.015]} />
          <meshStandardMaterial color={COLORS.dark} />
        </mesh>

        {/* JOINT 1 - Shoulder lift */}
        <group ref={j1} position={[0, 0.12, 0]}>
          {/* Shoulder motor housing */}
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.052, 0.055, 0.09, 32]} />
            <meshStandardMaterial color={getColor(1)} />
          </mesh>
          {/* Motor cap */}
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.045, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={getColor(1)} />
          </mesh>

          {/* UPPER ARM - main link housing */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.045, 0.048, 0.38, 32]} />
            <meshStandardMaterial color={getColor(1)} />
          </mesh>
          {/* Upper arm detail rings */}
          <mesh position={[0, 0.12, 0]}>
            <torusGeometry args={[0.048, 0.006, 8, 32]} />
            <meshStandardMaterial color={COLORS.dark} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.046, 0.006, 8, 32]} />
            <meshStandardMaterial color={COLORS.dark} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <torusGeometry args={[0.044, 0.006, 8, 32]} />
            <meshStandardMaterial color={COLORS.dark} />
          </mesh>

          {/* JOINT 2 - Elbow */}
          <group ref={j2} position={[0, 0.425, 0]}>
            {/* Elbow motor housing */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.045, 0.048, 0.08, 32]} />
              <meshStandardMaterial color={getColor(2)} />
            </mesh>

            {/* FOREARM - second link */}
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.038, 0.042, 0.35, 32]} />
              <meshStandardMaterial color={getColor(2)} />
            </mesh>
            {/* Forearm detail */}
            <mesh position={[0, 0.1, 0]}>
              <torusGeometry args={[0.04, 0.005, 8, 32]} />
              <meshStandardMaterial color={COLORS.dark} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <torusGeometry args={[0.038, 0.005, 8, 32]} />
              <meshStandardMaterial color={COLORS.dark} />
            </mesh>
            {/* Cable routing tube */}
            <mesh position={[0, 0.4, 0.02]}>
              <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
              <meshStandardMaterial color={COLORS.dark} />
            </mesh>

            {/* JOINT 3 - Wrist 1 */}
            <group ref={j3} position={[0, 0.39225, 0]}>
              <mesh position={[0, 0.035, 0]}>
                <cylinderGeometry args={[0.035, 0.038, 0.07, 32]} />
                <meshStandardMaterial color={getColor(3)} />
              </mesh>

              {/* WRIST 1 LINK */}
              <mesh position={[0, 0.085, 0]}>
                <cylinderGeometry args={[0.028, 0.032, 0.08, 32]} />
                <meshStandardMaterial color={getColor(3)} />
              </mesh>

              {/* JOINT 4 - Wrist 2 */}
              <group ref={j4} position={[0, 0.10915, 0]}>
                <mesh position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.03, 0.032, 0.06, 32]} />
                  <meshStandardMaterial color={getColor(4)} />
                </mesh>

                {/* WRIST 2 LINK */}
                <mesh position={[0, 0.065, 0]}>
                  <cylinderGeometry args={[0.025, 0.028, 0.06, 32]} />
                  <meshStandardMaterial color={getColor(4)} />
                </mesh>

                {/* JOINT 5 - Wrist 3 (tool flange) */}
                <group ref={j5} position={[0, 0.09465, 0]}>
                  <mesh position={[0, 0.025, 0]}>
                    <cylinderGeometry args={[0.028, 0.03, 0.05, 32]} />
                    <meshStandardMaterial color={getColor(5)} />
                  </mesh>
                  
                  {/* Tool flange - flat circular */}
                  <mesh position={[0, 0.055, 0]}>
                    <cylinderGeometry args={[0.032, 0.034, 0.02, 32]} />
                    <meshStandardMaterial color={COLORS.accent} />
                  </mesh>
                  
                  {/* Flange bolts pattern */}
                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <mesh key={angle} position={[0.022 * Math.cos(angle * Math.PI / 180), 0.065, 0.022 * Math.sin(angle * Math.PI / 180)]}>
                      <cylinderGeometry args={[0.004, 0.004, 0.008, 8]} />
                      <meshStandardMaterial color={COLORS.dark} />
                    </mesh>
                  ))}
                  
                  {/* Tool (gripper representation) */}
                  <mesh position={[0, 0.08, 0]}>
                    <boxGeometry args={[0.025, 0.05, 0.04]} />
                    <meshStandardMaterial color={COLORS.white} />
                  </mesh>
                  {/* Gripper fingers */}
                  <mesh position={[-0.015, 0.11, 0]}>
                    <boxGeometry args={[0.008, 0.04, 0.015]} />
                    <meshStandardMaterial color={COLORS.accent} />
                  </mesh>
                  <mesh position={[0.015, 0.11, 0]}>
                    <boxGeometry args={[0.008, 0.04, 0.015]} />
                    <meshStandardMaterial color={COLORS.accent} />
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
        <PerspectiveCamera makeDefault position={[1.5, 1, 1.5]} fov={45} />
        <OrbitControls makeDefault target={[0, 0.35, 0]} enablePan={false} minDistance={0.8} maxDistance={3} />

        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={0.8} castShadow />
        <pointLight position={[-2, 2, -2]} intensity={0.3} />
        <spotLight position={[0, 3, 0]} angle={0.5} penumbra={1} intensity={0.4} castShadow />

        <Grid
          infiniteGrid
          fadeDistance={8}
          sectionSize={1}
          sectionThickness={0.5}
          cellSize={0.25}
          sectionColor="#1e3a5f"
          cellColor="#0f172a"
        />

        <Center top>
          <RobotArm />
        </Center>

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}