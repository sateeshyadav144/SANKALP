import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Module definitions with 3D positions and brand colors
export const CAMPUS_NODES = [
  { id: 'expenses', name: 'Expense Tracker', color: '#10b981', position: [-2.6, 1.4, 0.4] as [number, number, number] },
  { id: 'attendance', name: 'Attendance Manager', color: '#06b6d4', position: [-1.4, 2.5, -0.6] as [number, number, number] },
  { id: 'summarizer', name: 'AI Note Summarizer', color: '#8b5cf6', position: [1.4, 2.5, -0.4] as [number, number, number] },
  { id: 'visuals', name: 'Notes & Visuals', color: '#38bdf8', position: [2.6, 1.3, 0.5] as [number, number, number] },
  { id: 'flashcards', name: 'Flashcards', color: '#a855f7', position: [2.5, -1.4, -0.3] as [number, number, number] },
  { id: 'tts', name: 'Text-to-Speech', color: '#f59e0b', position: [1.2, -2.4, 0.4] as [number, number, number] },
  { id: 'code', name: 'Code Editor', color: '#60a5fa', position: [-1.3, -2.4, -0.5] as [number, number, number] },
  { id: 'safety', name: 'Safety & Welfare', color: '#f43f5e', position: [-2.5, -1.3, 0.3] as [number, number, number] },
];

function CentralCore() {
  const coreRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.12;
      coreRef.current.rotation.x += delta * 0.05;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Subtle Metallic Core */}
      <Sphere args={[0.85, 32, 32]}>
        <MeshDistortMaterial
          color="#0ea5e9"
          attach="material"
          distort={0.06}
          speed={1.0}
          roughness={0.2}
          metalness={0.7}
          wireframe={false}
        />
      </Sphere>

      {/* Outer Holographic Wireframe Shield */}
      <mesh>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.2} />
      </mesh>

      {/* Orbiting Subtle Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.7, 0.015, 16, 80]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function OrbitingModuleNode({
  node,
  onHover,
}: {
  node: typeof CAMPUS_NODES[0];
  onHover: (name: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 0.8 : 0.3);
      meshRef.current.rotation.x += delta * (hovered ? 0.5 : 0.2);
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
      <group position={node.position}>
        <mesh
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            onHover(node.name);
          }}
          onPointerOut={() => {
            setHovered(false);
            onHover(null);
          }}
          scale={hovered ? 1.25 : 1}
        >
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={hovered ? 1.2 : 0.6}
            roughness={0.25}
            metalness={0.8}
          />
        </mesh>

        {hovered && (
          <mesh>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshBasicMaterial color={node.color} wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </Float>
  );
}

function ConnectingLaserBeams() {
  const linesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const center = new THREE.Vector3(0, 0, 0);

    CAMPUS_NODES.forEach((node) => {
      points.push(center);
      points.push(new THREE.Vector3(...node.position));
    });

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, []);

  return (
    <lineSegments geometry={linesGeometry}>
      <lineBasicMaterial color="#38bdf8" transparent opacity={0.12} linewidth={1} />
    </lineSegments>
  );
}

function FloatingCyberParticles({ count = 40 }) {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 10;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 8;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return coords;
  }, [count]);

  const particlesRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38bdf8"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

// Lightweight 2D/SVG Canvas Fallback for devices without WebGL
export function Campus2DFallback({ onNodeSelect }: { onNodeSelect?: (id: string) => void }) {
  return (
    <div className="relative w-full h-full min-h-[260px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#020B1A] via-[#061329] to-[#071B35] border border-[#17365C] shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.1)_0,transparent_70%)]" />
      
      {/* Circuit Rings */}
      <div className="relative w-56 h-56 rounded-full border border-cyan-500/20 flex items-center justify-center">
        <div className="w-36 h-36 rounded-full border border-blue-500/20 border-dashed flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-400/30 flex flex-col items-center justify-center text-center p-2">
            <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold font-mono">SANKALP</span>
            <span className="text-[9px] text-slate-400">ECOSYSTEM</span>
          </div>
        </div>
      </div>

      {/* Floating 8 Node Badges in circular orbit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {CAMPUS_NODES.map((node, i) => {
          const angle = (i / CAMPUS_NODES.length) * 2 * Math.PI;
          const radius = 115; // px
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button
              key={node.id}
              onClick={() => onNodeSelect?.(node.id)}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className="absolute pointer-events-auto px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200 hover:scale-105 flex items-center gap-1.5 shadow"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: node.color }} />
              <span className="text-slate-200">{node.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Main 3D Canvas with WebGL detection & Error Boundary
export const CampusCanvas: React.FC<{
  onNodeSelect?: (id: string) => void;
  height?: string;
}> = ({ onNodeSelect, height = 'h-[300px]' }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

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
    return <Campus2DFallback onNodeSelect={onNodeSelect} />;
  }

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden bg-gradient-to-b from-[#080d1a] to-[#04070e] border border-cyan-500/20 shadow-xl`}>
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.08)_0%,rgba(7,11,20,0)_70%)]" />

      {/* Clean Status Tag */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm border border-cyan-500/20 text-[11px] font-mono text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span>{hoveredNode ? hoveredNode : 'Campus Mesh Active'}</span>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#38bdf8" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#60a5fa" />
        
        {/* Central Core & Modules */}
        <CentralCore />
        <ConnectingLaserBeams />
        <FloatingCyberParticles count={40} />

        {CAMPUS_NODES.map((node) => (
          <OrbitingModuleNode
            key={node.id}
            node={node}
            onHover={setHoveredNode}
          />
        ))}
      </Canvas>
    </div>
  );
};
