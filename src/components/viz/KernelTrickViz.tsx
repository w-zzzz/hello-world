"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { generateRings, liftPolynomial, suggestedPlaneZ } from "@/lib/math/kernels";

const POINT_COUNT = 220;

function PointCloud({
  alpha,
  hovered,
  setHovered,
}: {
  alpha: number;
  hovered: number | null;
  setHovered: (n: number | null) => void;
}) {
  const ref = React.useRef<THREE.InstancedMesh>(null!);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const data2D = React.useMemo(() => generateRings(POINT_COUNT), []);
  const data3D = React.useMemo(() => liftPolynomial(data2D, alpha), [data2D, alpha]);

  const colors = React.useMemo(() => {
    const arr = new Float32Array(POINT_COUNT * 3);
    for (let i = 0; i < POINT_COUNT; i++) {
      const isPos = data2D[i].cls === 1;
      const c = new THREE.Color(isPos ? "#fb7185" : "#38bdf8");
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [data2D]);

  React.useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < POINT_COUNT; i++) {
      const p = data3D[i];
      dummy.position.set(p.x, p.z, p.y); // map (x, y, z_lift) → three's (x, y, z) = (x, lift, y)
      const s = i === hovered ? 0.07 : 0.045;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data3D, dummy, hovered]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, POINT_COUNT]}
      onPointerMove={(e) => {
        e.stopPropagation();
        setHovered(e.instanceId ?? null);
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial vertexColors metalness={0.2} roughness={0.5} />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
    </instancedMesh>
  );
}

function SeparatingPlane({
  z,
  draggable,
  onChange,
}: {
  z: number;
  draggable: boolean;
  onChange: (z: number) => void;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null!);
  const start = React.useRef<{ y0: number; z0: number } | null>(null);

  return (
    <mesh
      ref={meshRef}
      position={[0, z, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        if (!draggable) return;
        e.stopPropagation();
        start.current = { y0: e.clientY, z0: z };
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        e.stopPropagation();
        const dy = e.clientY - start.current.y0;
        // dragging up should raise plane (negative dy = up)
        onChange(start.current.z0 + (-dy / 80));
      }}
      onPointerUp={() => { start.current = null; }}
    >
      <planeGeometry args={[5, 5, 1, 1]} />
      <meshStandardMaterial color="#fbbf24" transparent opacity={0.28} side={THREE.DoubleSide} />
    </mesh>
  );
}

function GroundGrid() {
  return <gridHelper args={[6, 24, "#333", "#1a1a1a"]} position={[0, 0, 0]} />;
}

function PlaneLabel({ z, sep }: { z: number; sep: number }) {
  return (
    <Html position={[2.5, z, 0]} center distanceFactor={5} zIndexRange={[10, 0]}>
      <div className="rounded-md bg-amber-500/90 text-black text-[10px] font-mono px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
        z = {z.toFixed(2)} · suggested {sep.toFixed(2)}
      </div>
    </Html>
  );
}

function CamSetup({ alpha }: { alpha: number }) {
  // gradually lift camera as alpha grows
  useFrame((state, delta) => {
    const targetY = 0.6 + alpha * 1.6;
    state.camera.position.y += (targetY - state.camera.position.y) * Math.min(1, delta * 2);
    state.camera.lookAt(0, alpha * 1.6 * 0.5, 0);
  });
  return null;
}

export function KernelTrickViz() {
  const [alpha, setAlpha] = React.useState(0);
  const [planeZ, setPlaneZ] = React.useState(0);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const suggested = suggestedPlaneZ(alpha);

  React.useEffect(() => {
    setPlaneZ(suggested);
  }, [suggested]);

  // Compute classification accuracy at current plane
  const acc = React.useMemo(() => {
    const data = liftPolynomial(generateRings(POINT_COUNT), alpha);
    let correct = 0;
    for (const p of data) {
      const pred = p.z > planeZ ? 1 : 0;
      if (pred === p.cls) correct++;
    }
    return correct / data.length;
  }, [alpha, planeZ]);

  return (
    <VizFrame
      title="Kernel trick"
      subtitle={`lift α=${alpha.toFixed(2)} · plane z=${planeZ.toFixed(2)} · accuracy ${(acc * 100).toFixed(0)}%`}
      onReset={() => { setAlpha(0); setPlaneZ(0); }}
      fullScreenHref="/playground/kernel-trick"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40" style={{ height: 460 }}>
          <Canvas camera={{ position: [3.4, 0.6, 3.6], fov: 55 }} gl={{ antialias: true }}>
            <color attach="background" args={["#0b0b10"]} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 5, 2]} intensity={1.2} />
            <directionalLight position={[-3, -2, -1]} intensity={0.4} color="#88b" />
            <CamSetup alpha={alpha} />
            <GroundGrid />
            <PointCloud alpha={alpha} hovered={hovered} setHovered={setHovered} />
            <SeparatingPlane z={planeZ} draggable={alpha > 0.1} onChange={setPlaneZ} />
            <PlaneLabel z={planeZ} sep={suggested} />
            <OrbitControls makeDefault enableDamping enablePan={false} />
          </Canvas>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <Field label={`Lift α · ${alpha.toFixed(2)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`Plane height z · ${planeZ.toFixed(2)}`}>
            <input
              type="range"
              min={0}
              max={3}
              step={0.01}
              value={planeZ}
              onChange={(e) => setPlaneZ(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
            <button
              onClick={() => setPlaneZ(suggested)}
              className="mt-2 w-full rounded-md border border-soft px-2 py-1 text-[10px] hover:bg-[var(--color-muted)]"
            >
              Snap to suggested ({suggested.toFixed(2)})
            </button>
          </Field>
          <div className="rounded-md border border-soft px-2 py-1.5 text-[11px]">
            <div className="text-[var(--color-muted-fg)] uppercase tracking-[0.14em] text-[9px]">Linear separation accuracy</div>
            <div className="font-mono text-[var(--color-fg)] tabular-nums">{(acc * 100).toFixed(1)}%</div>
            <div className="mt-1 h-1.5 rounded bg-[var(--color-muted)] overflow-hidden">
              <div className="h-full bg-[var(--color-accent)]" style={{ width: `${acc * 100}%` }} />
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            Concentric rings can&apos;t be split by a 2D line. Lift each point with the polynomial
            kernel φ(x,y) = (x, y, ‖x‖²) and a flat 3D plane separates them. SVMs do this implicitly
            via the kernel trick.
          </p>
        </div>
      </div>
    </VizFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
