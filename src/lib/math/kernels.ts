/** Concentric-ring data + polynomial-kernel "lift" used by KernelTrickViz.
 *  Inner ring → class 0, outer ring → class 1. Lift φ(x) = ||x||² adds a 3rd
 *  dimension that makes them linearly separable by a horizontal plane. */

export type Pt2D = { x: number; y: number; cls: 0 | 1 };
export type Pt3D = { x: number; y: number; z: number; cls: 0 | 1 };

let seed = 17;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

export function generateRings(n = 220, innerR = 0.6, outerR = 1.5, noise = 0.12, s = 17): Pt2D[] {
  seed = s;
  const out: Pt2D[] = [];
  for (let i = 0; i < n; i++) {
    const cls: 0 | 1 = i % 2 === 0 ? 0 : 1;
    const r = (cls === 0 ? innerR : outerR) + (rand() - 0.5) * noise;
    const t = rand() * Math.PI * 2;
    out.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, cls });
  }
  return out;
}

/** Lift each point: φ(x,y) = (x, y, α * (x² + y²)) where α controls how much
 *  we pull "up" along z. α=0 leaves the points flat; α=1 fully lifts. */
export function liftPolynomial(pts: Pt2D[], alpha: number): Pt3D[] {
  return pts.map((p) => ({
    x: p.x,
    y: p.y,
    z: alpha * (p.x * p.x + p.y * p.y),
    cls: p.cls,
  }));
}

/** Threshold along z that perfectly splits the rings. For ||x||² ≈ inner²
 *  and ||x||² ≈ outer², the optimal mid-plane is z = α * (inner² + outer²) / 2. */
export function suggestedPlaneZ(alpha: number, innerR = 0.6, outerR = 1.5): number {
  return (alpha * (innerR * innerR + outerR * outerR)) / 2;
}
