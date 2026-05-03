export type LossFn = {
  key: string;
  label: string;
  f: (x: number, y: number) => number;
  grad: (x: number, y: number) => [number, number];
  domain: [number, number, number, number]; // xmin, xmax, ymin, ymax
  init: [number, number];
  vmax: number; // for color scale clipping
};

export const LANDSCAPES: LossFn[] = [
  {
    key: "rosenbrock",
    label: "Rosenbrock",
    f: (x, y) => Math.pow(1 - x, 2) + 100 * Math.pow(y - x * x, 2),
    grad: (x, y) => [
      -2 * (1 - x) - 400 * x * (y - x * x),
      200 * (y - x * x),
    ],
    domain: [-2, 2, -1, 3],
    init: [-1.5, 2.2],
    vmax: 1500,
  },
  {
    key: "saddle",
    label: "Saddle",
    f: (x, y) => x * x - y * y,
    grad: (x, y) => [2 * x, -2 * y],
    domain: [-2.5, 2.5, -2.5, 2.5],
    init: [1.7, 0.05],
    vmax: 8,
  },
  {
    key: "himmelblau",
    label: "Himmelblau",
    f: (x, y) => Math.pow(x * x + y - 11, 2) + Math.pow(x + y * y - 7, 2),
    grad: (x, y) => [
      4 * x * (x * x + y - 11) + 2 * (x + y * y - 7),
      2 * (x * x + y - 11) + 4 * y * (x + y * y - 7),
    ],
    domain: [-5, 5, -5, 5],
    init: [-3.5, 3.5],
    vmax: 800,
  },
  {
    key: "beale",
    label: "Beale",
    f: (x, y) =>
      Math.pow(1.5 - x + x * y, 2) +
      Math.pow(2.25 - x + x * y * y, 2) +
      Math.pow(2.625 - x + x * y * y * y, 2),
    grad: (x, y) => {
      const a = 1.5 - x + x * y;
      const b = 2.25 - x + x * y * y;
      const c = 2.625 - x + x * y * y * y;
      return [
        2 * a * (y - 1) + 2 * b * (y * y - 1) + 2 * c * (y * y * y - 1),
        2 * a * x + 2 * b * (2 * x * y) + 2 * c * (3 * x * y * y),
      ];
    },
    domain: [-4.5, 4.5, -4.5, 4.5],
    init: [3.2, -3.5],
    vmax: 250000,
  },
];

export const LANDSCAPE_BY_KEY = Object.fromEntries(LANDSCAPES.map((l) => [l.key, l]));

export type OptKey = "sgd" | "momentum" | "adam";
export type OptState = {
  m: [number, number];
  v: [number, number];
  t: number;
};

export function step(
  opt: OptKey,
  state: OptState,
  grad: [number, number],
  lr: number
): { delta: [number, number]; state: OptState } {
  if (opt === "sgd") {
    return {
      delta: [-lr * grad[0], -lr * grad[1]],
      state: { ...state, t: state.t + 1 },
    };
  }
  if (opt === "momentum") {
    const beta = 0.9;
    const m: [number, number] = [
      beta * state.m[0] + grad[0],
      beta * state.m[1] + grad[1],
    ];
    return {
      delta: [-lr * m[0], -lr * m[1]],
      state: { m, v: state.v, t: state.t + 1 },
    };
  }
  // adam
  const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
  const m: [number, number] = [
    beta1 * state.m[0] + (1 - beta1) * grad[0],
    beta1 * state.m[1] + (1 - beta1) * grad[1],
  ];
  const v: [number, number] = [
    beta2 * state.v[0] + (1 - beta2) * grad[0] * grad[0],
    beta2 * state.v[1] + (1 - beta2) * grad[1] * grad[1],
  ];
  const t = state.t + 1;
  const mhat0 = m[0] / (1 - Math.pow(beta1, t));
  const mhat1 = m[1] / (1 - Math.pow(beta1, t));
  const vhat0 = v[0] / (1 - Math.pow(beta2, t));
  const vhat1 = v[1] / (1 - Math.pow(beta2, t));
  return {
    delta: [
      -lr * mhat0 / (Math.sqrt(vhat0) + eps),
      -lr * mhat1 / (Math.sqrt(vhat1) + eps),
    ],
    state: { m, v, t },
  };
}

export function newOptState(): OptState {
  return { m: [0, 0], v: [0, 0], t: 0 };
}
