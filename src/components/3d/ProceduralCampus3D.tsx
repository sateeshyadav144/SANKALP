import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural Architectural Pine Tree (Cone Layers with Natural Green Gradient)
function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tree Trunk */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 0.9, 6]} />
        <meshStandardMaterial color="#2B1810" roughness={0.9} />
      </mesh>
      {/* Bottom Cone */}
      <mesh position={[0, 0.95, 0]}>
        <coneGeometry args={[0.55, 0.75, 7]} />
        <meshStandardMaterial color="#0F3820" roughness={0.8} />
      </mesh>
      {/* Middle Cone */}
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[0.42, 0.65, 7]} />
        <meshStandardMaterial color="#14532D" roughness={0.8} />
      </mesh>
      {/* Top Cone */}
      <mesh position={[0, 1.7, 0]}>
        <coneGeometry args={[0.28, 0.55, 7]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Procedural Architectural Deciduous / Shade Tree
function ShadeTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.0, 6]} />
        <meshStandardMaterial color="#2E1C12" roughness={0.9} />
      </mesh>
      {/* Foliage Clusters */}
      <mesh position={[0, 1.2, 0]}>
        <dodecahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial color="#156434" roughness={0.7} />
      </mesh>
      <mesh position={[0.18, 1.45, 0.1]}>
        <dodecahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color="#1E7A43" roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, 1.35, -0.1]}>
        <dodecahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial color="#12522A" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Street Lantern Post with Warm Ambient Light
function LanternPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.035, 0.9, 6]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lantern Housing */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.1]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>
      {/* Glowing Bulb */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#FEF3C7" emissive="#FDE68A" emissiveIntensity={2.0} />
      </mesh>
      <pointLight position={[0, 0.92, 0]} intensity={0.6} distance={2.2} color="#FEF3C7" />
    </group>
  );
}

// Collegiate Architecture Model (Main Academic Hall, Clock Tower, Wings, Portico)
function CollegiateCampusBuilding() {
  const hourHandRef = useRef<THREE.Mesh>(null);
  const minHandRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (minHandRef.current) minHandRef.current.rotation.z -= delta * 0.15;
    if (hourHandRef.current) hourHandRef.current.rotation.z -= delta * 0.02;
  });

  // Center Hall Windows Grid
  const centerWindows = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let floor = 0; floor < 3; floor++) {
      for (let col = -3; col <= 3; col++) {
        // Skip entrance area on ground floor
        if (floor === 0 && Math.abs(col) <= 1) continue;
        list.push([col * 0.38, 0.55 + floor * 0.48, 0.91]);
      }
    }
    return list;
  }, []);

  // Left & Right Wings Windows
  const wingWindows = useMemo(() => {
    const list: [number, number, number][] = [];
    // Left Wing
    for (let floor = 0; floor < 3; floor++) {
      for (let col = 0; col < 4; col++) {
        list.push([-1.7 - col * 0.42, 0.5 + floor * 0.45, 0.76]);
      }
    }
    // Right Wing
    for (let floor = 0; floor < 3; floor++) {
      for (let col = 0; col < 4; col++) {
        list.push([1.7 + col * 0.42, 0.5 + floor * 0.45, 0.76]);
      }
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, -0.4]}>
      {/* Stone Foundation Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[8.4, 0.22, 3.2]} />
        <meshStandardMaterial color="#1E2838" roughness={0.8} />
      </mesh>

      {/* Center Academic Hall Body */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[3.2, 2.1, 1.8]} />
        <meshStandardMaterial color="#2A384F" roughness={0.65} metalness={0.15} />
      </mesh>
      {/* Center Hall Roof Cornice */}
      <mesh position={[0, 2.33, 0]}>
        <boxGeometry args={[3.35, 0.12, 1.95]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Clock Tower Lower Pedestal */}
      <mesh position={[0, 2.65, 0]}>
        <boxGeometry args={[1.5, 0.55, 1.5]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Clock Tower Main Shaft */}
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[1.25, 1.05, 1.25]} />
        <meshStandardMaterial color="#2A384F" roughness={0.6} />
      </mesh>
      {/* Tower Cornice */}
      <mesh position={[0, 3.96, 0]}>
        <boxGeometry args={[1.38, 0.08, 1.38]} />
        <meshStandardMaterial color="#64748B" roughness={0.4} />
      </mesh>

      {/* Clock Face Housing & Dial */}
      <group position={[0, 3.45, 0.63]}>
        {/* Clock Bezel Ring */}
        <mesh>
          <ringGeometry args={[0.3, 0.36, 32]} />
          <meshStandardMaterial color="#00D9FF" emissive="#00D9FF" emissiveIntensity={0.9} />
        </mesh>
        {/* Warm Illuminated Clock Face Dial */}
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.34, 32]} />
          <meshStandardMaterial color="#FEF3C7" emissive="#FEF3C7" emissiveIntensity={0.85} />
        </mesh>
        {/* Clock Dial Center Pin */}
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        {/* Hour Hand */}
        <mesh ref={hourHandRef} position={[0, 0, 0.015]}>
          <boxGeometry args={[0.025, 0.16, 0.005]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        {/* Minute Hand */}
        <mesh ref={minHandRef} position={[0, 0, 0.018]}>
          <boxGeometry args={[0.018, 0.22, 0.005]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
      </group>

      {/* Belfry Louvers above Clock */}
      <group position={[0, 4.3, 0]}>
        <mesh>
          <boxGeometry args={[1.05, 0.6, 1.05]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
        {/* Belfry Arches Front */}
        <mesh position={[0, 0, 0.53]}>
          <planeGeometry args={[0.5, 0.45]} />
          <meshStandardMaterial color="#0B132B" />
        </mesh>
      </group>

      {/* Tower Octagonal Cupola Dome */}
      <mesh position={[0, 4.85, 0]}>
        <cylinderGeometry args={[0.42, 0.65, 0.6, 8]} />
        <meshStandardMaterial color="#0284C7" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Dome Finial Needle */}
      <mesh position={[0, 5.35, 0]}>
        <cylinderGeometry args={[0.02, 0.035, 0.5, 6]} />
        <meshStandardMaterial color="#00D9FF" emissive="#00D9FF" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 5.5, 0]} intensity={1.2} distance={3} color="#00D9FF" />

      {/* Left Wing */}
      <mesh position={[-2.65, 0.95, -0.1]}>
        <boxGeometry args={[2.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#24334A" roughness={0.65} metalness={0.15} />
      </mesh>
      <mesh position={[-2.65, 1.73, -0.1]}>
        <boxGeometry args={[2.65, 0.09, 1.6]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Right Wing */}
      <mesh position={[2.65, 0.95, -0.1]}>
        <boxGeometry args={[2.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#24334A" roughness={0.65} metalness={0.15} />
      </mesh>
      <mesh position={[2.65, 1.73, -0.1]}>
        <boxGeometry args={[2.65, 0.09, 1.6]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Neoclassical Entrance Portico */}
      <group position={[0, 0.6, 0.95]}>
        {/* Portico Base Steps */}
        <mesh position={[0, -0.4, 0.1]}>
          <boxGeometry args={[1.7, 0.16, 0.65]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.28, 0.05]}>
          <boxGeometry args={[1.5, 0.12, 0.5]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>

        {/* 4 Classical Columns */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <group key={`col-${i}`} position={[x, 0.12, 0.2]}>
            {/* Column Base */}
            <mesh position={[0, -0.38, 0]}>
              <boxGeometry args={[0.13, 0.06, 0.13]} />
              <meshStandardMaterial color="#64748B" />
            </mesh>
            {/* Shaft */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.055, 0.065, 0.8, 12]} />
              <meshStandardMaterial color="#94A3B8" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Capital */}
            <mesh position={[0, 0.46, 0]}>
              <boxGeometry args={[0.13, 0.06, 0.13]} />
              <meshStandardMaterial color="#64748B" />
            </mesh>
          </group>
        ))}

        {/* Portico Entablature Beam */}
        <mesh position={[0, 0.68, 0.18]}>
          <boxGeometry args={[1.75, 0.14, 0.45]} />
          <meshStandardMaterial color="#475569" roughness={0.4} />
        </mesh>

        {/* Triangular Pediment (Proper Triangular Prism Geometry) */}
        <mesh position={[0, 0.95, 0.18]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 1.7, 3]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>

        {/* Illuminated Grand Entrance Portal */}
        <mesh position={[0, 0.02, 0.01]}>
          <planeGeometry args={[0.85, 0.8]} />
          <meshStandardMaterial color="#00D9FF" emissive="#00D9FF" emissiveIntensity={1.4} />
        </mesh>
        <pointLight position={[0, 0.1, 0.4]} intensity={2.2} distance={3.8} color="#00D9FF" />
      </group>

      {/* Center Windows with Warm Amber & Cyan Glow */}
      {centerWindows.map((pos, idx) => (
        <group key={`cw-${idx}`} position={pos}>
          {/* Glass Pane */}
          <mesh>
            <planeGeometry args={[0.22, 0.3]} />
            <meshStandardMaterial
              color="#FEF3C7"
              emissive={idx % 4 === 0 ? '#38BDF8' : '#FDE68A'}
              emissiveIntensity={1.5}
            />
          </mesh>
          {/* Window Frame Lintel */}
          <mesh position={[0, 0.17, 0.01]}>
            <boxGeometry args={[0.26, 0.035, 0.02]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}

      {/* Wing Windows */}
      {wingWindows.map((pos, idx) => (
        <group key={`ww-${idx}`} position={pos}>
          <mesh>
            <planeGeometry args={[0.24, 0.28]} />
            <meshStandardMaterial
              color="#FEF3C7"
              emissive={idx % 5 === 0 ? '#00D9FF' : '#FACC15'}
              emissiveIntensity={1.3}
            />
          </mesh>
          <mesh position={[0, 0.16, 0.01]}>
            <boxGeometry args={[0.27, 0.035, 0.02]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}

      {/* Ambient Facade Fill Lights */}
      <pointLight position={[0, 1.5, 1.5]} intensity={1.8} distance={5} color="#FDE68A" />
      <pointLight position={[-2.6, 1.2, 1.2]} intensity={1.2} distance={4} color="#FACC15" />
      <pointLight position={[2.6, 1.2, 1.2]} intensity={1.2} distance={4} color="#FACC15" />
    </group>
  );
}

// Campus Grounds (Plaza, Pathways, Running Track, Peripheral Trees, Street Lamps)
function CampusGrounds() {
  const trees = useMemo(() => {
    return [
      // Left Woodland Grove (Clustered away from center building)
      { pos: [-3.8, 0, 0.4] as [number, number, number], scale: 1.1, type: 'pine' as const },
      { pos: [-4.4, 0, 0.9] as [number, number, number], scale: 1.3, type: 'pine' as const },
      { pos: [-4.2, 0, -0.3] as [number, number, number], scale: 1.0, type: 'shade' as const },
      { pos: [-3.5, 0, 1.5] as [number, number, number], scale: 0.85, type: 'shade' as const },
      { pos: [-4.8, 0, 1.6] as [number, number, number], scale: 0.95, type: 'pine' as const },

      // Right Side Boundary Trees
      { pos: [4.4, 0, -0.2] as [number, number, number], scale: 1.2, type: 'pine' as const },
      { pos: [4.8, 0, 0.6] as [number, number, number], scale: 1.0, type: 'shade' as const },
      { pos: [4.5, 0, 1.4] as [number, number, number], scale: 0.9, type: 'pine' as const },

      // Distant Horizon Trees (Background Depth)
      { pos: [-2.8, 0, -1.8] as [number, number, number], scale: 0.9, type: 'pine' as const },
      { pos: [-1.4, 0, -2.0] as [number, number, number], scale: 0.75, type: 'pine' as const },
      { pos: [1.6, 0, -2.0] as [number, number, number], scale: 0.75, type: 'pine' as const },
      { pos: [3.0, 0, -1.8] as [number, number, number], scale: 0.9, type: 'pine' as const },
    ];
  }, []);

  const lamps = useMemo(() => {
    return [
      [-1.3, 0, 1.4] as [number, number, number],
      [1.3, 0, 1.4] as [number, number, number],
      [-1.3, 0, 2.5] as [number, number, number],
      [1.3, 0, 2.5] as [number, number, number],
      [-2.8, 0, 1.9] as [number, number, number],
      [2.8, 0, 1.9] as [number, number, number],
    ];
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Main Base Grounds Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]}>
        <planeGeometry args={[16, 11]} />
        <meshStandardMaterial color="#0A1D13" roughness={0.9} />
      </mesh>

      {/* Main Central Lawn (Manicured University Green) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.2]}>
        <planeGeometry args={[5.2, 3.4]} />
        <meshStandardMaterial color="#144A29" roughness={0.8} />
      </mesh>

      {/* Limestone Walkway Promenade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 2.0]}>
        <planeGeometry args={[1.4, 3.8]} />
        <meshStandardMaterial color="#2B3648" roughness={0.65} />
      </mesh>
      {/* Transverse Cross Promenade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 1.2]}>
        <planeGeometry args={[6.8, 0.85]} />
        <meshStandardMaterial color="#2B3648" roughness={0.65} />
      </mesh>

      {/* Campus Athletic Running Track (Right Flank) */}
      <group position={[3.8, 0.05, 1.8]} rotation={[-Math.PI / 2, 0, 0.25]}>
        {/* Track Surface (Terracotta Red) */}
        <mesh>
          <ringGeometry args={[1.15, 1.55, 36]} />
          <meshStandardMaterial color="#991B1B" roughness={0.7} />
        </mesh>
        {/* Inner Sports Field Turf */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[1.13, 36]} />
          <meshStandardMaterial color="#166534" roughness={0.6} />
        </mesh>
        {/* Luminous Inner Field Demarcation */}
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.7, 0.74, 36]} />
          <meshStandardMaterial color="#00D9FF" emissive="#00D9FF" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Trees */}
      {trees.map((t, idx) =>
        t.type === 'pine' ? (
          <PineTree key={`pt-${idx}`} position={t.pos} scale={t.scale} />
        ) : (
          <ShadeTree key={`st-${idx}`} position={t.pos} scale={t.scale} />
        )
      )}

      {/* Lanterns */}
      {lamps.map((pos, idx) => (
        <LanternPost key={`lp-${idx}`} position={pos} />
      ))}
    </group>
  );
}

// Twilight Stars & Floating Fireflies
function CelestialAtmosphere() {
  const count = 45;
  const particles = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = 1.0 + Math.random() * 5.0;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#00D9FF"
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

// Camera Rig for Smooth Architectural Perspective & Cursor Interaction
function ArchitecturalCameraRig() {
  useFrame((state) => {
    const mouseX = state.pointer.x * 0.45;
    const mouseY = state.pointer.y * 0.2;
    const t = state.clock.getElapsedTime() * 0.12;

    // Smooth subtle camera drift with mouse parallax
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      THREE.MathUtils.clamp(mouseX + Math.sin(t) * 0.25, -1.0, 1.0),
      0.04
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      THREE.MathUtils.clamp(3.1 + mouseY * 0.4, 2.7, 3.6),
      0.04
    );
    state.camera.lookAt(0, 1.5, 0.4);
  });

  return null;
}

// Crisp Vector SVG Fallback Illustration (Guaranteed 100% Sharp on any screen/browser)
export function CampusVectorIllustration() {
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#061833] via-[#092248] to-[#040F22] border border-[#17365C]">
      {/* Twilight Glow & Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,217,255,0.12)_0%,transparent_70%)]" />

      <svg className="w-full h-full max-h-[340px]" viewBox="0 0 600 340" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Background Sky & Distant Mountain Ridges */}
        <path d="M0 240 Q150 210, 300 235 T600 220 L600 340 L0 340 Z" fill="#071933" opacity="0.6" />
        <path d="M0 260 Q180 230, 360 255 T600 245 L600 340 L0 340 Z" fill="#0A244A" opacity="0.8" />

        {/* Campus Base Grounds */}
        <rect x="0" y="270" width="600" height="70" fill="#0C2B1D" />
        <polygon points="180,340 420,340 370,270 230,270" fill="#155432" />
        {/* Sandstone Central Path */}
        <polygon points="275,340 325,340 310,270 290,270" fill="#2E3C52" />

        {/* Left Wing Building */}
        <rect x="130" y="190" width="120" height="80" rx="4" fill="#24344D" stroke="#3D506E" strokeWidth="1.5" />
        {/* Left Wing Roof Trim */}
        <rect x="126" y="186" width="128" height="6" rx="2" fill="#4B6082" />
        {/* Left Wing Lit Windows */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`lw-${row}-${col}`}
              x={142 + col * 26}
              y={200 + row * 22}
              width="14"
              height="15"
              rx="2"
              fill={col === 1 ? '#00D9FF' : '#FEF08A'}
              opacity="0.9"
            />
          ))
        )}

        {/* Right Wing Building */}
        <rect x="350" y="190" width="120" height="80" rx="4" fill="#24344D" stroke="#3D506E" strokeWidth="1.5" />
        {/* Right Wing Roof Trim */}
        <rect x="346" y="186" width="128" height="6" rx="2" fill="#4B6082" />
        {/* Right Wing Lit Windows */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`rw-${row}-${col}`}
              x={362 + col * 26}
              y={200 + row * 22}
              width="14"
              height="15"
              rx="2"
              fill={col === 2 ? '#00D9FF' : '#FEF08A'}
              opacity="0.9"
            />
          ))
        )}

        {/* Main Central Academic Hall */}
        <rect x="230" y="160" width="140" height="110" rx="4" fill="#2C3D5A" stroke="#445878" strokeWidth="2" />
        <rect x="225" y="156" width="150" height="7" rx="2" fill="#586E91" />

        {/* Central Clock Tower */}
        <rect x="270" y="80" width="60" height="80" rx="3" fill="#24344D" stroke="#3D506E" strokeWidth="2" />
        {/* Clock Tower Belfry & Dome */}
        <rect x="275" y="55" width="50" height="25" rx="3" fill="#1C293D" />
        <path d="M280 55 C280 35, 320 35, 320 55 Z" fill="#0284C7" />
        <line x1="300" y1="35" x2="300" y2="15" stroke="#00D9FF" strokeWidth="3" strokeLinecap="round" />
        <circle cx="300" cy="15" r="3" fill="#00D9FF" />

        {/* Clock Face with Glowing Dial */}
        <circle cx="300" cy="115" r="20" fill="#FEF3C7" stroke="#00D9FF" strokeWidth="3" />
        <circle cx="300" cy="115" r="2.5" fill="#1E293B" />
        <line x1="300" y1="115" x2="300" y2="103" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="300" y1="115" x2="310" y2="115" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />

        {/* Neoclassical Columns Portico */}
        <rect x="250" y="225" width="100" height="45" fill="#1B283D" />
        {/* Classical Pediment Triangle */}
        <polygon points="245,225 355,225 300,205" fill="#3D506E" stroke="#586E91" strokeWidth="2" />
        {/* Portico Columns */}
        {[260, 285, 315, 340].map((x, i) => (
          <rect key={`col-${i}`} x={x} y={225} width="6" height="45" fill="#94A3B8" rx="1" />
        ))}
        {/* Grand Glowing Entrance Door */}
        <rect x="282" y="235" width="36" height="35" rx="3" fill="#00D9FF" opacity="0.9" />

        {/* Athletic Track Oval (Right) */}
        <ellipse cx="510" cy="295" rx="65" ry="32" fill="#991B1B" stroke="#B91C1C" strokeWidth="2" />
        <ellipse cx="510" cy="295" rx="50" ry="22" fill="#166534" />
        <ellipse cx="510" cy="295" rx="32" ry="14" fill="none" stroke="#00D9FF" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Campus Trees (Left Grove) */}
        <polygon points="90,290 120,230 150,290" fill="#0F3820" />
        <polygon points="95,270 120,220 145,270" fill="#166534" />
        <polygon points="60,300 85,250 110,300" fill="#14532D" />
        <polygon points="125,295 150,245 175,295" fill="#0D331D" />

        {/* Campus Trees (Right Grove) */}
        <polygon points="460,285 480,240 500,285" fill="#14532D" />
        <polygon points="560,290 580,245 600,290" fill="#0F3820" />

        {/* Streetlight Halos */}
        <circle cx="210" cy="275" r="4" fill="#FEF3C7" />
        <circle cx="210" cy="275" r="14" fill="#FEF3C7" opacity="0.2" />
        <circle cx="390" cy="275" r="4" fill="#FEF3C7" />
        <circle cx="390" cy="275" r="14" fill="#FEF3C7" opacity="0.2" />
      </svg>
    </div>
  );
}

// Main 3D Procedural Campus Export
export const ProceduralCampus3D: React.FC<{ className?: string }> = ({
  className = 'w-full h-full',
}) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <CampusVectorIllustration />;
  }

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Soft Sky Twilight Backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#06152B] via-[#081E3D] to-[#040E1E]" />

      <Canvas
        camera={{ position: [0, 3.2, 7.6], fov: 36 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Evening Twilight Ambient & Directional Moonlight */}
        <ambientLight intensity={0.65} color="#38BDF8" />
        <directionalLight position={[-6, 12, 6]} intensity={1.3} color="#E0F2FE" />
        <directionalLight position={[6, 8, -4]} intensity={0.45} color="#713CFF" />

        {/* Camera Rig & Scene Elements */}
        <ArchitecturalCameraRig />
        <CollegiateCampusBuilding />
        <CampusGrounds />
        <CelestialAtmosphere />
      </Canvas>
    </div>
  );
};
