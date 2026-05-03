"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { CATEGORY_LIST, getEmbeddings, type EmbPoint } from "@/lib/viz/embeddings";
import { cn } from "@/lib/utils";

function PointsField({
  points,
  filter,
  hovered,
  setHovered,
}: {
  points: EmbPoint[];
  filter: string | null;
  hovered: number | null;
  setHovered: (n: number | null) => void;
}) {
  const ref = React.useRef<THREE.InstancedMesh>(null!);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const colors = React.useMemo(() => {
    const arr = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const muted = filter && points[i].category !== filter;
      const c = new THREE.Color(`hsl(${points[i].hue} ${muted ? 20 : 70}% ${muted ? 35 : 60}%)`);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [points, filter]);

  React.useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = points[i].pos;
      dummy.position.set(x, y, z);
      const muted = filter && points[i].category !== filter;
      const s = i === hovered ? 0.13 : muted ? 0.05 : 0.07;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [points, dummy, hovered, filter]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, points.length]}
      onPointerMove={(e) => {
        e.stopPropagation();
        setHovered(e.instanceId ?? null);
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial vertexColors metalness={0.2} roughness={0.4} />
      <instancedBufferAttribute
        attach="instanceColor"
        args={[colors, 3]}
      />
    </instancedMesh>
  );
}

function HoverLabel({ points, hovered }: { points: EmbPoint[]; hovered: number | null }) {
  if (hovered === null) return null;
  const p = points[hovered];
  return (
    <Html position={p.pos} center distanceFactor={4} zIndexRange={[10, 0]}>
      <div className="rounded-md bg-black/85 text-white px-2 py-0.5 text-xs font-mono whitespace-nowrap pointer-events-none -translate-y-4">
        <span>{p.word}</span>
        <span className="opacity-60 ml-2">{p.category}</span>
      </div>
    </Html>
  );
}

function AutoOrbit() {
  const ctrl = useThree((s) => s.controls) as unknown as { autoRotate: boolean; update: () => void } | null;
  useFrame(() => {
    if (ctrl) ctrl.update();
  });
  return null;
}

export function EmbeddingExplorer3D() {
  const points = React.useMemo(() => getEmbeddings(), []);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<number | null>(null);

  return (
    <VizFrame
      title="Embedding space"
      subtitle={`${points.length} words · ${CATEGORY_LIST.length} clusters`}
      onReset={() => { setFilter(null); }}
      fullScreenHref="/playground/embedding-explorer-3d"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40" style={{ height: 460 }}>
          <Canvas
            camera={{ position: [3.2, 2.4, 4.5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <color attach="background" args={["#0b0b10"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 5, 2]} intensity={1.2} />
            <directionalLight position={[-3, -2, -1]} intensity={0.4} color="#88b" />
            <PointsField points={points} filter={filter} hovered={hovered} setHovered={setHovered} />
            <HoverLabel points={points} hovered={hovered} />
            <OrbitControls makeDefault enableDamping autoRotate autoRotateSpeed={0.4} />
            <AutoOrbit />
            <gridHelper args={[8, 16, "#222", "#111"]} position={[0, -1.6, 0]} />
          </Canvas>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-2">
              Cluster filter
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors col-span-2",
                  !filter
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                    : "border-soft hover:bg-[var(--color-muted)]"
                )}
              >
                All clusters
              </button>
              {CATEGORY_LIST.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setFilter(c.label)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                    filter === c.label
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "border-soft hover:bg-[var(--color-muted)]"
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${c.hue} 70% 55%)` }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-soft p-3 text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            Drag to rotate, scroll to zoom. Words from the same cluster sit close in the embedding —
            this is what CLIP and word2vec learn. Hover any sphere to see the word and its cluster.
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
