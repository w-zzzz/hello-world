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

describe("optimizer dynamics — momentum", () => {
  it("EMA velocity accumulates with beta=0.9 across steps", () => {
    let s = newOptState();
    const g: [number, number] = [1, -2];
    const lr = 0.1;
    // first step: m = 0.9*0 + g = g
    let r = step("momentum", s, g, lr);
    expect(r.state.m[0]).toBeCloseTo(g[0], 8);
    expect(r.state.m[1]).toBeCloseTo(g[1], 8);
    expect(r.delta[0]).toBeCloseTo(-lr * r.state.m[0], 8);
    s = r.state;
    // second step: m = 0.9*g + g = 1.9*g
    r = step("momentum", s, g, lr);
    expect(r.state.m[0]).toBeCloseTo(1.9 * g[0], 8);
    expect(r.state.m[1]).toBeCloseTo(1.9 * g[1], 8);
    expect(r.state.t).toBe(2);
  });

  it("momentum yields a larger step than SGD when gradients align", () => {
    const g: [number, number] = [1, 0];
    const lr = 0.1;
    const sgd = step("sgd", newOptState(), g, lr);
    let s = newOptState();
    let last = step("momentum", s, g, lr);
    s = last.state;
    last = step("momentum", s, g, lr);
    expect(Math.abs(last.delta[0])).toBeGreaterThan(Math.abs(sgd.delta[0]));
  });

  it("momentum decelerates when gradient flips sign", () => {
    let s = newOptState();
    const lr = 0.1;
    s = step("momentum", s, [1, 0], lr).state;
    s = step("momentum", s, [1, 0], lr).state;
    // m is positive ~1.9 here; flip the gradient
    const r = step("momentum", s, [-1, 0], lr);
    // new m = 0.9*1.9 - 1 = 0.71 → still positive, smaller magnitude
    expect(r.state.m[0]).toBeGreaterThan(0);
    expect(r.state.m[0]).toBeLessThan(1.9);
  });
});

describe("optimizer dynamics — Adam", () => {
  it("first-step bias correction makes magnitude ≈ lr regardless of grad scale", () => {
    const lr = 0.05;
    const small = step("adam", newOptState(), [1e-3, 0], lr);
    const big = step("adam", newOptState(), [10, 0], lr);
    // mhat/sqrt(vhat) ~= sign(g), so |delta| ~= lr
    expect(Math.abs(small.delta[0])).toBeCloseTo(lr, 4);
    expect(Math.abs(big.delta[0])).toBeCloseTo(lr, 4);
  });

  it("Adam first/second moments evolve with beta1=0.9, beta2=0.999", () => {
    let s = newOptState();
    const g: [number, number] = [2, -3];
    const r = step("adam", s, g, 0.01);
    expect(r.state.m[0]).toBeCloseTo(0.1 * g[0], 8);
    expect(r.state.m[1]).toBeCloseTo(0.1 * g[1], 8);
    expect(r.state.v[0]).toBeCloseTo(0.001 * g[0] * g[0], 8);
    expect(r.state.v[1]).toBeCloseTo(0.001 * g[1] * g[1], 8);
    expect(r.state.t).toBe(1);

    s = r.state;
    const r2 = step("adam", s, g, 0.01);
    // m = 0.9*0.2 + 0.1*2 = 0.38
    expect(r2.state.m[0]).toBeCloseTo(0.38, 6);
    expect(r2.state.t).toBe(2);
  });

  it("Adam direction matches negative-gradient sign", () => {
    const r = step("adam", newOptState(), [3, -4], 0.01);
    expect(Math.sign(r.delta[0])).toBe(-1);
    expect(Math.sign(r.delta[1])).toBe(1);
  });

  it("Adam converges toward minimum on Booth landscape", () => {
    const booth = LANDSCAPES.find((l) => l.key === "booth")!;
    let s = newOptState();
    let [x, y] = booth.init;
    const before = booth.f(x, y);
    for (let i = 0; i < 800; i++) {
      const g = booth.grad(x, y);
      const r = step("adam", s, g as [number, number], 0.05);
      s = r.state;
      x += r.delta[0];
      y += r.delta[1];
    }
    const after = booth.f(x, y);
    expect(after).toBeLessThan(before);
    // Booth's minimum is f(1,3) = 0 — Adam should get reasonably close
    expect(after).toBeLessThan(1);
  });
});
