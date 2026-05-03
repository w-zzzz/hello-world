"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";

/** A stylized 3D transformer block walkthrough.
 *  Stages:
 *   0: tokens (bottom row of cubes)
 *   1: embeddings (cubes lifted up + colored)
 *   2: + positional (slight x-shift visualization)
 *   3: multi-head attention (animated arrows between tokens)
 *   4: FFN (cubes pulse vertically)
 *   5: next layer (repeat pulse)
 *   6: output (top row of cubes)
 */

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const STAGES = [
  { id: 0, name: "Tokens", desc: "Discrete IDs from the tokenizer." },
  { id: 1, name: "Embeddings", desc: "Look up a vector per token id." },
  { id: 2, name: "+ Positional", desc: "Add order information." },
  { id: 3, name: "Self-attention", desc: "Each token attends to others." },
  { id: 4, name: "Feed-forward", desc: "Per-token MLP." },
  { id: 5, name: "Layer N", desc: "Stack repeats N times." },
  { id: 6, name: "Output", desc: "Logits over vocabulary." },
];

function TokenCube({
  index,
  stage,
  total,
  hue,
  label,
  showPos,
}: {
  index: number;
  stage: number;
  total: number;
  hue: number;
  label: string;
  showPos: boolean;
}) {
  const ref = React.useRef<THREE.Mesh>(null!);
  const x = index - (total - 1) / 2;

  let targetY = 0;
  if (stage >= 1) targetY = 1.0;
  if (stage >= 4) targetY = 1.2 + Math.sin(stage + index) * 0.15;
  if (stage >= 6) targetY = 2.4;

  const targetScale = stage === 0 ? 0.55 : stage >= 6 ? 0.7 : 0.6;
  const tColor = stage >= 1 ? new THREE.Color(`hsl(${(hue + index * 25) % 360} 75% 60%)`) : new THREE.Color("#666");

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.y += (targetY - ref.current.position.y) * Math.min(1, delta * 4);
    const cur = ref.current.scale.x;
    const ns = cur + (targetScale - cur) * Math.min(1, delta * 4);
    ref.current.scale.set(ns, ns, ns);
    const m = ref.current.material as THREE.MeshStandardMaterial;
    if (m && m.color) {
      m.color.lerp(tColor, Math.min(1, delta * 4));
    }
  });

  const xPos = x + (showPos ? 0.04 * Math.sin(index * 1.3) : 0);

  return (
    <group position={[xPos, 0, 0]}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#666" metalness={0.3} roughness={0.4} />
      </mesh>
      {stage <= 1 && (
        <Html position={[0, -0.7, 0]} center distanceFactor={5}>
          <div className="font-mono text-xs text-white/70 pointer-events-none whitespace-nowrap">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function AttentionArrows({ count, active }: { count: number; active: boolean }) {
  // emit subtle curves between every pair of tokens
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if (i !== j) pairs.push([i, j]);
    }
  }
  const opacity = active ? 0.85 : 0;
  const arr = pairs.slice(0, 18); // limit
  return (
    <group>
      {arr.map(([i, j], k) => {
        const x1 = i - (count - 1) / 2;
        const x2 = j - (count - 1) / 2;
        const start = new THREE.Vector3(x1, 1.0, 0);
        const end = new THREE.Vector3(x2, 1.0, 0);
        const mid = start.clone().add(end).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.7 + 0.2 * Math.abs(i - j), 0));
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(20);
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: `hsl(${(i * 60 + j * 30) % 360} 80% 65%)`,
          transparent: true,
          opacity,
        });
        const line = new THREE.Line(geom, mat);
        return <primitive key={k} object={line} />;
      })}
    </group>
  );
}

function GentleSpin() {
  const ref = React.useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  return <group ref={ref} />;
}

export function TransformerWalkthrough3D() {
  const [stage, setStage] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 2400);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <VizFrame
      title="Transformer walkthrough"
      subtitle={`Stage ${stage + 1} / ${STAGES.length} — ${STAGES[stage].name}`}
      onReset={() => { setStage(0); setPlaying(false); }}
      fullScreenHref="/playground/transformer-3d"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-gradient-to-b from-[#0a0a14] to-[#1a0a2a]" style={{ height: 460 }}>
          <Canvas camera={{ position: [0, 1.5, 6.5], fov: 50 }} gl={{ antialias: true }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 5, 2]} intensity={1.4} color="#fff" />
            <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#a8f" />
            <GentleSpin />
            {TOKENS.map((tok, i) => (
              <TokenCube
                key={i}
                index={i}
                stage={stage}
                total={TOKENS.length}
                hue={i * 47}
                label={tok}
                showPos={stage >= 2}
              />
            ))}
            <AttentionArrows count={TOKENS.length} active={stage === 3} />
            <OrbitControls enableDamping enablePan={false} autoRotate autoRotateSpeed={0.3} />
          </Canvas>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-3">
          <div className="space-y-1">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setStage(s.id); setPlaying(false); }}
                className={`w-full text-left rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${stage === s.id ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-soft hover:bg-[var(--color-muted)]"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span>{s.name}</span>
                  <span className="text-[10px] tabular-nums text-[var(--color-muted-fg)]">{s.id + 1}</span>
                </div>
                <div className="text-[10px] text-[var(--color-muted-fg)] mt-0.5 leading-snug">{s.desc}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-fg)] text-[var(--color-bg)] px-3 py-2 text-xs font-medium"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => { setStage(0); setPlaying(false); }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}

// avoid unused imports
void motion;
