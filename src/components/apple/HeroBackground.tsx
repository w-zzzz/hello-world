"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

/**
 * Lazily-loaded hero background — a fullscreen WebGL quad rendering an
 * animated mesh-gradient via a fragment shader. Designed to overlay (not
 * replace) the existing CSS gradient, so failure or missing WebGL falls back
 * gracefully. Pauses when the tab is hidden or reduced motion is requested.
 */
export default function HeroBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: true,
      alpha: true,
    });
    if (!gl) return;

    // --- Shaders ---
    const vert = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;
    const frag = `
      precision highp float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform vec2 u_res;
      uniform vec3 u_c1;
      uniform vec3 u_c2;
      uniform vec3 u_c3;
      uniform vec3 u_c4;

      // Smooth noise via interpolated value-noise.
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = v_uv;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_res.x / u_res.y;

        float t = u_time * 0.06;

        // four moving "blobs" of color, summed with smooth falloff
        vec2 a = vec2(sin(t * 1.2) * 0.5 - 0.3, cos(t * 1.0) * 0.4);
        vec2 b = vec2(cos(t * 0.7) * 0.6 + 0.2, sin(t * 0.9) * 0.5 + 0.3);
        vec2 c = vec2(sin(t * 0.5) * 0.4, cos(t * 1.3) * 0.4 - 0.4);
        vec2 d = vec2(cos(t * 0.4) * 0.7 - 0.1, sin(t * 0.6) * 0.6 + 0.4);

        float wa = exp(-dot(p - a, p - a) * 1.6);
        float wb = exp(-dot(p - b, p - b) * 1.8);
        float wc = exp(-dot(p - c, p - c) * 1.4);
        float wd = exp(-dot(p - d, p - d) * 1.7);

        float sum = wa + wb + wc + wd + 1e-4;
        vec3 col = (u_c1 * wa + u_c2 * wb + u_c3 * wc + u_c4 * wd) / sum;

        // subtle noise breakup so there's no banding
        float n = noise(uv * 6.0 + t * 0.3) * 0.04;
        col += n;

        // overall mask — strongest at center, fading to edges
        float mask = smoothstep(1.2, 0.0, length(p));
        float a_out = mask * 0.55;

        gl_FragColor = vec4(col, a_out);
      }
    `;

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type);
      if (!sh) return null;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(sh);
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uC1 = gl.getUniformLocation(prog, "u_c1");
    const uC2 = gl.getUniformLocation(prog, "u_c2");
    const uC3 = gl.getUniformLocation(prog, "u_c3");
    const uC4 = gl.getUniformLocation(prog, "u_c4");

    // Read theme colors from CSS so dark/light pick up automatically.
    const readColor = (cssVar: string, fallback: [number, number, number]): [number, number, number] => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim();
      if (!v) return fallback;
      // Try to parse hex / rgb. We pre-render via a hidden div.
      const probe = document.createElement("div");
      probe.style.color = v;
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!m) return fallback;
      return [
        parseInt(m[1], 10) / 255,
        parseInt(m[2], 10) / 255,
        parseInt(m[3], 10) / 255,
      ];
    };

    let c1 = readColor("--color-accent", [0.45, 0.55, 0.95]);
    let c2 = readColor("--color-part-7", [0.55, 0.4, 0.85]);
    let c3 = readColor("--color-part-10", [0.85, 0.4, 0.6]);
    let c4 = readColor("--color-part-4", [0.35, 0.7, 0.55]);

    const themeObs = new MutationObserver(() => {
      c1 = readColor("--color-accent", c1);
      c2 = readColor("--color-part-7", c2);
      c3 = readColor("--color-part-10", c3);
      c4 = readColor("--color-part-4", c4);
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let visible = true;
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);

    const start = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = (now - start) / 1000;
      gl!.uniform1f(uTime, reduce ? 0 : t);
      gl!.uniform2f(uRes, canvas.width, canvas.height);
      gl!.uniform3f(uC1, c1[0], c1[1], c1[2]);
      gl!.uniform3f(uC2, c2[0], c2[1], c2[2]);
      gl!.uniform3f(uC3, c3[0], c3[1], c3[2]);
      gl!.uniform3f(uC4, c4[0], c4[1], c4[2]);
      gl!.enable(gl!.BLEND);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
