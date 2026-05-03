import { describe, it, expect } from "vitest";
import { LANDSCAPES, newOptState, step } from "@/lib/math/landscape";

describe("loss landscapes", () => {
  it("Rosenbrock minimum at (1,1) is zero", () => {
    const r = LANDSCAPES.find((l) => l.key === "rosenbrock")!;
    expect(r.f(1, 1)).toBeCloseTo(0, 8);
  });

  it("gradient at minimum is ~0", () => {
    const r = LANDSCAPES.find((l) => l.key === "rosenbrock")!;
    const [gx, gy] = r.grad(1, 1);
    expect(Math.abs(gx)).toBeLessThan(1e-6);
    expect(Math.abs(gy)).toBeLessThan(1e-6);
  });

  it("SGD step descends along negative gradient", () => {
    const r = LANDSCAPES.find((l) => l.key === "rosenbrock")!;
    const grad = r.grad(0, 0);
    const { delta } = step("sgd", newOptState(), grad as [number, number], 0.001);
    // delta should be -lr*grad
    expect(delta[0]).toBeCloseTo(-0.001 * grad[0], 5);
    expect(delta[1]).toBeCloseTo(-0.001 * grad[1], 5);
  });

  it("Adam state advances t", () => {
    const r = LANDSCAPES.find((l) => l.key === "saddle")!;
    const grad = r.grad(0.5, 0.5);
    const { state } = step("adam", newOptState(), grad as [number, number], 0.01);
    expect(state.t).toBe(1);
  });
});
