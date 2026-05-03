"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Search, X } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { CATEGORY_LIST, getEmbeddings, type EmbPoint } from "@/lib/viz/embeddings";
import { cn } from "@/lib/utils";

function PointsField({
  points,
  positions,
  filter,
  search,
  hovered,
  setHovered,
}: {
  points: EmbPoint[];
  positions: [number, number, number][];
  filter: string | null;
  search: string;
  hovered: number | null;
  setHovered: (n: number | null) => void;
}) {
  const ref = React.useRef<THREE.InstancedMesh>(null!);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const isMatch = React.useCallback(
    (i: number) => {
      if (filter && points[i].category !== filter) return false;
      if (search && !points[i].word.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    },
    [filter, search, points]
  );
  const colors = React.useMemo(() => {
    const arr = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const muted = !isMatch(i);
      const c = new THREE.Color(`hsl(${points[i].hue} ${muted ? 20 : 70}% ${muted ? 35 : 60}%)`);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [points, isMatch]);

  React.useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < points.length; i++) {
      const [x, y, z] = positions[i];
      dummy.position.set(x, y, z);
      const muted = !isMatch(i);
      const s = i === hovered ? 0.13 : muted ? 0.05 : 0.07;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [points, positions, dummy, hovered, isMatch]);

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

function HoverLabel({ points, positions, hovered }: { points: EmbPoint[]; positions: [number, number, number][]; hovered: number | null }) {
  if (hovered === null) return null;
  const p = points[hovered];
  const pos = positions[hovered];
  return (
    <Html position={pos} center distanceFactor={4} zIndexRange={[10, 0]}>
      <div className="rounded-md bg-black/85 text-white px-2 py-0.5 text-xs font-mono whitespace-nowrap pointer-events-none -translate-y-4">
        <span>{p.word}</span>
        <span className="opacity-60 ml-2">{p.category}</span>
      </div>
    </Html>
  );
}

function ClusterLabels({
  centers,
}: {
  centers: { label: string; pos: [number, number, number]; hue: number }[];
}) {
  return (
    <>
      {centers.map((c) => (
        <Html key={c.label} position={c.pos} center distanceFactor={5} zIndexRange={[5, 0]}>
          <div
            className="rounded-md px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-white pointer-events-none whitespace-nowrap"
            style={{ backgroundColor: `hsl(${c.hue} 65% 35% / 0.9)` }}
          >
            {c.label}
          </div>
        </Html>
      ))}
    </>
  );
}

function AutoOrbit() {
  const ctrl = useThree((s) => s.controls) as unknown as { autoRotate: boolean; update: () => void } | null;
  useFrame(() => {
    if (ctrl) ctrl.update();
  });
  return null;
}

function projectPCA2D(points: EmbPoint[]): [number, number, number][] {
  const n = points.length;
  if (n === 0) return [];
  // mean
  const mean = [0, 0, 0];
  for (const p of points) {
    mean[0] += p.pos[0];
    mean[1] += p.pos[1];
    mean[2] += p.pos[2];
  }
  mean[0] /= n;
  mean[1] /= n;
  mean[2] /= n;
  // covariance
  let c00 = 0, c01 = 0, c02 = 0, c11 = 0, c12 = 0, c22 = 0;
  for (const p of points) {
    const a = p.pos[0] - mean[0];
    const b = p.pos[1] - mean[1];
    const cc = p.pos[2] - mean[2];
    c00 += a * a; c01 += a * b; c02 += a * cc;
    c11 += b * b; c12 += b * cc;
    c22 += cc * cc;
  }
  c00 /= n; c01 /= n; c02 /= n; c11 /= n; c12 /= n; c22 /= n;
  const cov = [
    [c00, c01, c02],
    [c01, c11, c12],
    [c02, c12, c22],
  ];
  // power iteration for top 2 eigenvectors
  const v1 = powerIter(cov, 30);
  const cov2 = deflate(cov, v1);
  const v2 = powerIter(cov2, 30);
  // normalize basis
  const out: [number, number, number][] = [];
  for (const p of points) {
    const a = p.pos[0] - mean[0];
    const b = p.pos[1] - mean[1];
    const cc = p.pos[2] - mean[2];
    const x = a * v1[0] + b * v1[1] + cc * v1[2];
    const y = a * v2[0] + b * v2[1] + cc * v2[2];
    out.push([x * 1.4, y * 1.4, 0]);
  }
  return out;
}

function matVec(m: number[][], v: number[]): number[] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function powerIter(m: number[][], iters: number): [number, number, number] {
  let v = [1, 1, 1];
  for (let i = 0; i < iters; i++) {
    v = matVec(m, v);
    const n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    v[0] /= n; v[1] /= n; v[2] /= n;
  }
  return v as [number, number, number];
}

function deflate(m: number[][], v: number[]): number[][] {
  // m - λvvᵀ where λ = vᵀm v
  const mv = matVec(m, v);
  const lambda = v[0] * mv[0] + v[1] * mv[1] + v[2] * mv[2];
  return [
    [m[0][0] - lambda * v[0] * v[0], m[0][1] - lambda * v[0] * v[1], m[0][2] - lambda * v[0] * v[2]],
    [m[1][0] - lambda * v[1] * v[0], m[1][1] - lambda * v[1] * v[1], m[1][2] - lambda * v[1] * v[2]],
    [m[2][0] - lambda * v[2] * v[0], m[2][1] - lambda * v[2] * v[1], m[2][2] - lambda * v[2] * v[2]],
  ];
}

export function EmbeddingExplorer3D() {
  const points = React.useMemo(() => getEmbeddings(), []);
  const [filter, setFilter] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [pcaMode, setPcaMode] = React.useState(false);

  const positions: [number, number, number][] = React.useMemo(() => {
    if (!pcaMode) return points.map((p) => p.pos);
    return projectPCA2D(points);
  }, [points, pcaMode]);

  const centers = React.useMemo(() => {
    const grouped = new Map<string, { sum: [number, number, number]; n: number; hue: number }>();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const pos = positions[i];
      const g = grouped.get(p.category) ?? { sum: [0, 0, 0], n: 0, hue: p.hue };
      g.sum[0] += pos[0]; g.sum[1] += pos[1]; g.sum[2] += pos[2];
      g.n += 1;
      grouped.set(p.category, g);
    }
    const out: { label: string; pos: [number, number, number]; hue: number }[] = [];
    for (const [label, g] of grouped) {
      out.push({
        label,
        pos: [g.sum[0] / g.n, g.sum[1] / g.n + 0.55, g.sum[2] / g.n],
        hue: g.hue,
      });
    }
    return out;
  }, [points, positions]);

  const matchCount = React.useMemo(() => {
    let n = 0;
    for (let i = 0; i < points.length; i++) {
      if (filter && points[i].category !== filter) continue;
      if (search && !points[i].word.toLowerCase().includes(search.toLowerCase())) continue;
      n++;
    }
    return n;
  }, [points, filter, search]);

  return (
    <VizFrame
      title="Embedding space"
      subtitle={`${matchCount}/${points.length} words · ${pcaMode ? "PCA → 2D" : "3D"}`}
      onReset={() => { setFilter(null); setSearch(""); setPcaMode(false); }}
      fullScreenHref="/playground/embedding-explorer-3d"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40" style={{ height: 460 }}>
          <Canvas
            camera={{ position: pcaMode ? [0, 0, 6] : [3.2, 2.4, 4.5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <color attach="background" args={["#0b0b10"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 5, 2]} intensity={1.2} />
            <directionalLight position={[-3, -2, -1]} intensity={0.4} color="#88b" />
            <PointsField
              points={points}
              positions={positions}
              filter={filter}
              search={search}
              hovered={hovered}
              setHovered={setHovered}
            />
            <HoverLabel points={points} positions={positions} hovered={hovered} />
            <ClusterLabels centers={centers} />
            <OrbitControls makeDefault enableDamping autoRotate={!pcaMode} autoRotateSpeed={0.4} />
            <AutoOrbit />
            <gridHelper args={[8, 16, "#222", "#111"]} position={[0, -1.6, 0]} />
          </Canvas>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
              Search
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="filter by substring…"
                className="w-full rounded-lg border border-soft bg-[var(--color-bg)] pl-7 pr-7 py-1.5 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setPcaMode((m) => !m)}
            className={cn(
              "w-full rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
              pcaMode
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                : "border-soft hover:bg-[var(--color-muted)]"
            )}
          >
            {pcaMode ? "PCA → 2D · on" : "PCA → 2D"}
          </button>
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
            Drag to rotate, scroll to zoom. PCA → 2D flattens onto the top two principal axes —
            useful for inspecting cluster geometry head-on.
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
