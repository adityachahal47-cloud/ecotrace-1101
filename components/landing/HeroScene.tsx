"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Sphere, Box, Torus } from "@react-three/drei";
import * as THREE from "three";

/* ──────────────────────────────────────────────
   Animated scan grid that "verifies" floating objects
   ────────────────────────────────────────────── */
function ScanRing({ radius = 2.2 }: { radius?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.z = clock.elapsedTime * 0.3;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.1;
  });
  return (
    <mesh ref={ ref } position={ [0, 0, 0] }>
      <torusGeometry args={ [radius, 0.015, 16, 100] } />
      <meshStandardMaterial color="#667EEA" emissive="#667EEA" emissiveIntensity={ 1.5 } transparent opacity={ 0.6 } />
    </mesh>
  );
}

function ScanRing2({ radius = 1.6 }: { radius?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.z = -clock.elapsedTime * 0.4;
    ref.current.rotation.y = Math.cos(clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <mesh ref={ ref } position={ [0, 0, 0] }>
      <torusGeometry args={ [radius, 0.01, 16, 100] } />
      <meshStandardMaterial color="#764BA2" emissive="#764BA2" emissiveIntensity={ 1.5 } transparent opacity={ 0.5 } />
    </mesh>
  );
}

/* ── Central glowing orb ── */
function CentralOrb() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
    ref.current.scale.set(s, s, s);
  });
  return (
    <Float speed={ 2 } rotationIntensity={ 0.3 } floatIntensity={ 0.5 }>
      <Sphere ref={ ref } args={ [0.6, 64, 64] } position={ [0, 0, 0] }>
        <MeshDistortMaterial
          color="#667EEA"
          emissive="#764BA2"
          emissiveIntensity={ 0.6 }
          roughness={ 0.2 }
          metalness={ 0.8 }
          distort={ 0.25 }
          speed={ 2 }
          transparent
          opacity={ 0.9 }
        />
      </Sphere>
    </Float>
  );
}

/* ── Floating verification badge ── */
function VerifyBadge({ position, color, delay = 0 }: { position: [number, number, number]; color: string; delay?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + delay;
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15;
    ref.current.rotation.x = t * 0.5;
    ref.current.rotation.y = t * 0.3;
  });
  return (
    <mesh ref={ ref } position={ position }>
      <octahedronGeometry args={ [0.15, 0] } />
      <meshStandardMaterial
        color={ color }
        emissive={ color }
        emissiveIntensity={ 0.5 }
        roughness={ 0.3 }
        metalness={ 0.7 }
        transparent
        opacity={ 0.8 }
      />
    </mesh>
  );
}

/* ── Particle field ── */
function ParticleField() {
  const count = 200;
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c1 = new THREE.Color("#667EEA");
    const c2 = new THREE.Color("#764BA2");
    const c3 = new THREE.Color("#51CF66");
    for (let i = 0; i < count; i++) {
      const c = [c1, c2, c3][i % 3];
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.02;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <points ref={ ref }>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={ [positions, 3] }
        />
        <bufferAttribute
          attach="attributes-color"
          args={ [colors, 3] }
        />
      </bufferGeometry>
      <pointsMaterial size={ 0.025 } vertexColors transparent opacity={ 0.6 } sizeAttenuation />
    </points>
  );
}

/* ── Data stream lines ── */
function DataStream({ startY = 3, x = 0 }: { startY?: number; x?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.6 + x * 2) % 6;
    ref.current.position.y = startY - t;
    ref.current.material.opacity = Math.max(0, 1 - t / 6) * 0.4;
  });
  return (
    <mesh ref={ ref } position={ [x, startY, -1] }>
      <boxGeometry args={ [0.01, 0.3, 0.01] } />
      <meshStandardMaterial
        color="#667EEA"
        emissive="#667EEA"
        emissiveIntensity={ 2 }
        transparent
        opacity={ 0.4 }
      />
    </mesh>
  );
}

/* ══════════════════════════════════════════════
   Main exported scene
   ══════════════════════════════════════════════ */
export default function HeroScene() {
  return (
    <div className="w-full h-full" style={ { minHeight: "100%" } }>
      <Canvas
        camera={ { position: [0, 0, 5], fov: 45 } }
        style={ { background: "transparent" } }
        gl={ { alpha: true, antialias: true } }
      >
        <ambientLight intensity={ 0.3 } />
        <pointLight position={ [5, 5, 5] } intensity={ 1 } color="#667EEA" />
        <pointLight position={ [-5, -3, 3] } intensity={ 0.6 } color="#764BA2" />
        <pointLight position={ [0, 3, -2] } intensity={ 0.4 } color="#51CF66" />

        {/* Central scanning orb */ }
        <CentralOrb />

        {/* Rotating scan rings */ }
        <ScanRing radius={ 1.8 } />
        <ScanRing2 radius={ 1.3 } />
        <ScanRing radius={ 2.5 } />

        {/* Floating verification badges */ }
        <VerifyBadge position={ [1.5, 1.2, 0.5] } color="#51CF66" delay={ 0 } />
        <VerifyBadge position={ [-1.3, -0.8, 0.3] } color="#FF6B6B" delay={ 1 } />
        <VerifyBadge position={ [0.8, -1.4, -0.2] } color="#667EEA" delay={ 2 } />
        <VerifyBadge position={ [-1.6, 0.6, -0.5] } color="#764BA2" delay={ 3 } />
        <VerifyBadge position={ [1.8, -0.3, 0.8] } color="#FFC107" delay={ 1.5 } />

        {/* Background particles */ }
        <ParticleField />

        {/* Data stream effect */ }
        { [-2, -1.2, -0.4, 0.4, 1.2, 2].map((x, i) => (
          <DataStream key={ i } x={ x } startY={ 3 } />
        )) }
      </Canvas>
    </div>
  );
}
