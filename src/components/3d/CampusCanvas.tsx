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
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.3;
      coreRef.current.rotation.x += delta * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x -= delta * 0.35;
      ringRef2.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Organic Distorted Core */}
      <Sphere args={[0.9, 64, 64]}>
        <MeshDistortMaterial
          color="#06b6d4"
          attach="material"
          distort={0.4}
          speed={2.2}
          roughness={0.1}
          metalness={0.8}
          wireframe={false}
        />
      </Sphere>

      {/* Outer Holographic Wireframe Shield */}
      <mesh>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Orbiting Orbital Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.75, 0.02, 16, 100]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.65} />
      </mesh>

      <mesh ref={ringRef2} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[2.05, 0.015, 16, 100]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
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
      meshRef.current.rotation.y += delta * (hovered ? 2.5 : 0.8);
      meshRef.current.rotation.x += delta * (hovered ? 1.5 : 0.4);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
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
          scale={hovered ? 1.4 : 1}
        >
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={hovered ? 1.8 : 0.8}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>

        {/* Outer Halo on hover */}
        {hovered && (
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color={node.color} wireframe transparent opacity={0.4} />
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
      <lineBasicMaterial color="#38bdf8" transparent opacity={0.25} linewidth={1} />
    </lineSegments>
  );
}

function FloatingCyberParticles({ count = 90 }) {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 12;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 10;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return coords;
  }, [count]);

  const particlesRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05;
      particlesRef.current.rotation.x += delta * 0.02;
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
        size={0.06}
        color="#38bdf8"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Lightweight 2D/SVG Canvas Fallback for devices without WebGL
export function Campus2DFallback({ onNodeSelect }: { onNodeSelect?: (id: string) => void }) {
  return (
    <div className="relative w-full h-full min-h-[380px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#070b14] via-[#0d1629] to-[#121d38] border border-cyan-500/20 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0,transparent_70%)]" />
      
      {/* Circuit Rings */}
      <div className="relative w-72 h-72 rounded-full border border-cyan-500/30 flex items-center justify-center animate-spin" style={{ animationDuration: '40s' }}>
        <div className="w-52 h-52 rounded-full border border-violet-500/30 border-dashed flex items-center justify-center animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
          <div className="w-32 h-32 rounded-full bg-cyan-500/10 backdrop-blur-md border border-cyan-400/50 flex flex-col items-center justify-center text-center p-2 shadow-glow-cyan animate-pulse">
            <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">SANKALP</span>
            <span className="text-[10px] text-slate-400">SMART CORE</span>
          </div>
        </div>
      </div>

      {/* Floating 8 Node Badges in circular orbit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {CAMPUS_NODES.map((node, i) => {
          const angle = (i / CAMPUS_NODES.length) * 2 * Math.PI;
          const radius = 140; // px
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <button
              key={node.id}
              onClick={() => onNodeSelect?.(node.id)}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className="absolute pointer-events-auto px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 hover:scale-110 flex items-center gap-1.5 shadow-lg"
              style-custom={`background: rgba(13, 21, 39, 0.9); border: 1px solid ${node.color}; color: #f1f5f9; box-shadow: 0 0 15px ${node.color}40;`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
              <span>{node.name}</span>
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
}> = ({ onNodeSelect, height = 'h-[440px]' }) => {
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
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden bg-gradient-to-b from-[#080d1a] to-[#04070e] border border-cyan-500/20 shadow-2xl`}>
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.12)_0%,rgba(7,11,20,0)_70%)]" />

      {/* Floating HUD Tooltip */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-xs">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-cyan-300 font-mono tracking-wider">3D CAMPUS MESH:</span>
        <span className="text-slate-200 font-semibold">{hoveredNode || '8 Connected Modules Active'}</span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-[11px] font-mono text-slate-400 bg-slate-900/60 backdrop-blur px-2.5 py-1 rounded border border-slate-700/50">
        Three.js Engine • Interactive WebGL
      </div>

      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-10, -10, -10]} intensity={1.2} color="#8b5cf6" />
        
        {/* Central Core & Modules */}
        <CentralCore />
        <ConnectingLaserBeams />
        <FloatingCyberParticles count={80} />

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
