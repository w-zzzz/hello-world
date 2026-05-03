/** Tabular Q-learning on an 8x8 gridworld with start, goal, and lava cells.
 *  Pure JS, used by RLGridworld viz. */

export type CellKind = "empty" | "start" | "goal" | "lava";
export type Action = 0 | 1 | 2 | 3; // up, right, down, left

export const ACTIONS: Action[] = [0, 1, 2, 3];
export const ACTION_NAMES = ["up", "right", "down", "left"] as const;
export const ACTION_DELTAS: [number, number][] = [
  [0, -1], // up: y-1
  [1, 0], // right: x+1
  [0, 1], // down: y+1
  [-1, 0], // left: x-1
];

export type GridConfig = {
  width: number;
  height: number;
  start: [number, number];
  goal: [number, number];
  lava: [number, number][];
};

export const DEFAULT_GRID: GridConfig = {
  width: 8,
  height: 8,
  start: [0, 7],
  goal: [7, 0],
  lava: [
    [2, 5],
    [3, 5],
    [4, 5],
    [5, 5],
    [4, 3],
    [4, 2],
    [1, 2],
    [2, 2],
  ],
};

export function cellKind(g: GridConfig, x: number, y: number): CellKind {
  if (g.start[0] === x && g.start[1] === y) return "start";
  if (g.goal[0] === x && g.goal[1] === y) return "goal";
  if (g.lava.some(([lx, ly]) => lx === x && ly === y)) return "lava";
  return "empty";
}

export type QTable = Float32Array; // length = width * height * 4

export function makeQ(g: GridConfig): QTable {
  return new Float32Array(g.width * g.height * 4);
}

function idx(g: GridConfig, x: number, y: number, a: number) {
  return (y * g.width + x) * 4 + a;
}

export function getQ(q: QTable, g: GridConfig, x: number, y: number): [number, number, number, number] {
  const base = (y * g.width + x) * 4;
  return [q[base], q[base + 1], q[base + 2], q[base + 3]];
}

function step(g: GridConfig, x: number, y: number, a: Action): { nx: number; ny: number; r: number; done: boolean } {
  const [dx, dy] = ACTION_DELTAS[a];
  let nx = x + dx;
  let ny = y + dy;
  if (nx < 0 || nx >= g.width || ny < 0 || ny >= g.height) {
    nx = x;
    ny = y;
  }
  const k = cellKind(g, nx, ny);
  if (k === "goal") return { nx, ny, r: 1, done: true };
  if (k === "lava") return { nx, ny, r: -1, done: true };
  return { nx, ny, r: -0.01, done: false };
}

export type AgentState = {
  x: number;
  y: number;
  episode: number;
  steps: number;
  totalReward: number;
  lastReward: number;
  trail: [number, number][];
  successes: number;
  failures: number;
};

export function newAgentState(g: GridConfig): AgentState {
  return {
    x: g.start[0],
    y: g.start[1],
    episode: 0,
    steps: 0,
    totalReward: 0,
    lastReward: 0,
    trail: [[g.start[0], g.start[1]]],
    successes: 0,
    failures: 0,
  };
}

export function qStep(
  q: QTable,
  g: GridConfig,
  s: AgentState,
  epsilon: number,
  alpha: number,
  gamma: number
): AgentState {
  // ε-greedy action selection
  let a: Action;
  if (Math.random() < epsilon) {
    a = Math.floor(Math.random() * 4) as Action;
  } else {
    const [u, r, d, l] = getQ(q, g, s.x, s.y);
    const arr = [u, r, d, l];
    let best = 0;
    let bestV = -Infinity;
    for (let i = 0; i < 4; i++) {
      // tie-break randomly
      const v = arr[i] + (Math.random() - 0.5) * 1e-6;
      if (v > bestV) { bestV = v; best = i; }
    }
    a = best as Action;
  }
  const { nx, ny, r, done } = step(g, s.x, s.y, a);
  const nextQ = done ? 0 : Math.max(...getQ(q, g, nx, ny));
  const cur = q[idx(g, s.x, s.y, a)];
  q[idx(g, s.x, s.y, a)] = cur + alpha * (r + gamma * nextQ - cur);

  if (done) {
    return {
      x: g.start[0],
      y: g.start[1],
      episode: s.episode + 1,
      steps: 0,
      totalReward: 0,
      lastReward: r,
      trail: [[g.start[0], g.start[1]]],
      successes: s.successes + (r > 0 ? 1 : 0),
      failures: s.failures + (r < 0 ? 1 : 0),
    };
  }
  const trail = [...s.trail, [nx, ny] as [number, number]];
  return {
    x: nx,
    y: ny,
    episode: s.episode,
    steps: s.steps + 1,
    totalReward: s.totalReward + r,
    lastReward: r,
    trail: trail.length > 60 ? trail.slice(-60) : trail,
    successes: s.successes,
    failures: s.failures,
  };
}
