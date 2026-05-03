/** Lightweight 2D PCA + correlated Gaussian sampler.
 *  Pure JS: power iteration for eigendecomposition of a 2x2 covariance.
 *  Used by PCAProjector viz. */

export type Vec2 = [number, number];

let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function randn() {
  const u = rand() || 1e-9;
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function resetSeed(s = 42) {
  seed = s;
}

/** Sample n points from a 2D Gaussian with given std + correlation. */
export function sampleGaussian2D(
  n: number,
  sigmaX = 1.4,
  sigmaY = 0.7,
  rho = 0.65,
  seedStart = 42
): Vec2[] {
  resetSeed(seedStart);
  const out: Vec2[] = [];
  // Cholesky-like: x = sx * z1, y = sy * (rho z1 + sqrt(1-rho²) z2)
  const sq = Math.sqrt(Math.max(0, 1 - rho * rho));
  for (let i = 0; i < n; i++) {
    const z1 = randn();
    const z2 = randn();
    out.push([sigmaX * z1, sigmaY * (rho * z1 + sq * z2)]);
  }
  return out;
}

export function meanCov(points: Vec2[]): { mean: Vec2; cov: [[number, number], [number, number]] } {
  const n = Math.max(1, points.length);
  let mx = 0, my = 0;
  for (const [x, y] of points) { mx += x; my += y; }
  mx /= n; my /= n;
  let cxx = 0, cxy = 0, cyy = 0;
  for (const [x, y] of points) {
    const a = x - mx, b = y - my;
    cxx += a * a; cxy += a * b; cyy += b * b;
  }
  cxx /= n; cxy /= n; cyy /= n;
  return { mean: [mx, my], cov: [[cxx, cxy], [cxy, cyy]] };
}

/** Closed-form eigendecomposition of a real symmetric 2x2.
 *  Returns axes sorted by descending eigenvalue. */
export function eig2(cov: [[number, number], [number, number]]): {
  vals: [number, number];
  vecs: [Vec2, Vec2];
} {
  const a = cov[0][0], b = cov[0][1], d = cov[1][1];
  const tr = a + d;
  const det = a * d - b * b;
  const tmp = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + tmp;
  const l2 = tr / 2 - tmp;
  // eigenvector for l1: (b, l1 - a) or (l1 - d, b)
  function evec(l: number): Vec2 {
    if (Math.abs(b) > 1e-9) {
      const v: Vec2 = [b, l - a];
      const n = Math.hypot(v[0], v[1]) || 1;
      return [v[0] / n, v[1] / n];
    }
    // diagonal cov
    return l === a ? [1, 0] : [0, 1];
  }
  return { vals: [l1, l2], vecs: [evec(l1), evec(l2)] };
}

/** Project n points onto the 1D axis at angle θ. Returns variance captured. */
export function projectAndVariance(points: Vec2[], theta: number): { proj: number[]; variance: number } {
  const cx = Math.cos(theta), cy = Math.sin(theta);
  const proj = points.map(([x, y]) => x * cx + y * cy);
  const n = Math.max(1, proj.length);
  const mu = proj.reduce((s, v) => s + v, 0) / n;
  const variance = proj.reduce((s, v) => s + (v - mu) * (v - mu), 0) / n;
  return { proj, variance };
}
