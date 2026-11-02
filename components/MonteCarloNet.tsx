'use client';

import { useEffect, useRef } from 'react';
import { MODEL_LAYERS, modelState, TARGET } from '@/lib/monte-carlo-model';
import { brownianPaths, clamp, fitScene, logPrice, PATH_STEPS, replayState, smooth } from '@/lib/monte-carlo-scene';

/* Recorded training: forward → sample → compare → feedback. The weights and
 * inferred moments are real; pulses explain the process, not measured neuron events.
 * Blue GBM paths share the reference's Brownian shocks. One canvas, no browser training.
 */
const FPS = 30, PATH_COUNT = 28, BLUE_COUNT = 12;
const BLUE_INDICES = Array.from({ length: BLUE_COUNT }, (_, i) => Math.round(i * (PATH_COUNT - 1) / (BLUE_COUNT - 1)));
const MOBILE_INDICES = Array.from(new Set([...BLUE_INDICES, 0, 4, 8, 12, 15, 19, 23, 27]));
const X_START = -1.02, X_END = 1.45, Y_SCALE = 0.95, BELL = 0.47;
const LAYER_X = [-2.5, -2.12, -1.74, -1.36];
const HORIZONS = [0.25, 0.5, 0.75, 1];
const shocks = brownianPaths(PATH_COUNT);
const nodes = MODEL_LAYERS.flatMap((count, layer) => Array.from({ length: count }, (_, j) => ({ layer, j, x: LAYER_X[layer], y: 0.08 + (j - (count - 1) / 2) * 0.17 })));
const edges: { a: number; b: number; layer: number; input: number; output: number }[] = [];
let offset = 0;
for (let layer = 0; layer < MODEL_LAYERS.length - 1; layer++) {
  const next = offset + MODEL_LAYERS[layer];
  for (let a = 0; a < MODEL_LAYERS[layer]; a++) for (let b = 0; b < MODEL_LAYERS[layer + 1]; b++) edges.push({ a: offset + a, b: next + b, layer, input: a, output: b });
  offset = next;
}
const xAt = (step: number) => X_START + (X_END - X_START) * step / (PATH_STEPS - 1);
const zAt = (path: number, step: number) => (path / (PATH_COUNT - 1) - 0.5) * 0.44 * step / (PATH_STEPS - 1);
type Point = readonly [number, number, number];

// Fit the entire replay, including the tall initial density, without zooming as it learns.
const envelope: Point[] = nodes.map((n) => [n.x, n.y, 0]);
const samples = Array.from({ length: 81 }, (_, i) => modelState(i / 80));
for (let s = 0; s < PATH_STEPS; s++) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < PATH_COUNT; i++) {
    const y = logPrice(shocks, i, s, TARGET.mu, TARGET.sigma);
    lo = Math.min(lo, y); hi = Math.max(hi, y);
    if (BLUE_INDICES.includes(i)) for (const p of samples) {
      const prediction = logPrice(shocks, i, s, p.mu, p.sigma);
      lo = Math.min(lo, prediction); hi = Math.max(hi, prediction);
    }
  }
  for (const y of [lo, hi]) for (const z of [zAt(0, s), zAt(PATH_COUNT - 1, s)]) envelope.push([xAt(s), y * Y_SCALE, z]);
}
for (const h of HORIZONS) for (const p of [...samples, TARGET]) {
  const sd = p.sigma * Math.sqrt(h), mean = (p.mu - p.sigma * p.sigma / 2) * h;
  for (let j = 0; j <= 16; j++) {
    const v = -2.8 + 5.6 * j / 16;
    envelope.push([X_START + (X_END - X_START) * h, (mean + v * sd) * Y_SCALE, -BELL * TARGET.sigma / p.sigma * Math.exp(-v * v / 2)]);
  }
}

export function MonteCarloNet() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0, height = 0, dpr = 1, raf = 0, elapsed = 0, previous: number | null = null, painted = -Infinity;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      dpr = Math.min(1.5, devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    };
    const draw = (seconds: number, still = false) => {
      if (!width || !height) return;
      const state = replayState(seconds, still), model = modelState(state.progress);
      const narrow = width < 768;
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      const scroll = maxScroll > 0 ? clamp(scrollY / maxScroll) : 0;
      const yaw = -0.43 + (still ? 0 : 0.025 * Math.sin(seconds * Math.PI / 24)) + 0.1 * scroll;
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const rawProject = (x: number, y: number, z: number): readonly [number, number] => {
        const xx = x * cy - z * sy, zz = x * sy + z * cy, depth = 4.8 + zz;
        return [xx / depth, -(y + zz * 0.055) / depth];
      };
      const fit = fitScene(envelope.map(([x, y, z]) => rawProject(x, y, z)), width, height);
      const project = (x: number, y: number, z: number): readonly [number, number] => {
        const [a, b] = rawProject(x, y, z);
        return [fit.x + a * fit.scale, fit.y + b * fit.scale];
      };
      const point = (p: readonly [number, number], move = false) => move ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
      const curve = (a: readonly [number, number], b: readonly [number, number]) => {
        const mid = (a[0] + b[0]) / 2;
        ctx.moveTo(a[0], a[1]); ctx.bezierCurveTo(mid, a[1], mid, b[1], b[0], b[1]);
      };
      const onCurve = (a: readonly [number, number], b: readonly [number, number], f: number): readonly [number, number] => {
        const mid = (a[0] + b[0]) / 2, g = 1 - f;
        return [g ** 3 * a[0] + 3 * g * f * mid + f ** 3 * b[0], (g ** 3 + 3 * g * g * f) * a[1] + (3 * g * f * f + f ** 3) * b[1]];
      };
      const pulse = (p: readonly [number, number], alpha: number, radius = 2) => {
        ctx.beginPath(); ctx.arc(p[0], p[1], radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(175,209,245,${alpha})`; ctx.fill();
      };
      const horizonList = narrow ? [0.5, 1] : HORIZONS;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      canvas.dataset.phase = state.phase; canvas.dataset.progress = state.progress.toFixed(3); canvas.dataset.reducedMotion = String(still);

      // A quiet, stable reference with a few readable paths.
      ctx.lineWidth = 0.8;
      const referenceIndices = narrow ? MOBILE_INDICES : Array.from({ length: PATH_COUNT }, (_, i) => i);
      for (const i of referenceIndices) {
        ctx.beginPath();
        for (let s = 0; s < PATH_STEPS; s++) point(project(xAt(s), logPrice(shocks, i, s, TARGET.mu, TARGET.sigma) * Y_SCALE, zAt(i, s)), s === 0);
        ctx.strokeStyle = `rgba(190,207,228,${i % 6 === 0 ? 0.1 : 0.038})`; ctx.stroke();
      }
      const bell = (h: number, mu: number, sigma: number, blue: boolean, emphasis: number) => {
        const sd = sigma * Math.sqrt(h), mean = (mu - sigma * sigma / 2) * h, x = X_START + (X_END - X_START) * h;
        ctx.beginPath();
        for (let j = 0; j <= 48; j++) {
          const v = -2.8 + 5.6 * j / 48;
          point(project(x, (mean + v * sd) * Y_SCALE, -BELL * TARGET.sigma / sigma * Math.exp(-v * v / 2)), j === 0);
        }
        ctx.lineWidth = blue ? 1.35 : 0.9;
        ctx.strokeStyle = blue ? `rgba(112,166,225,${(0.24 + 0.12 * emphasis) * state.opacity})` : `rgba(200,216,237,${0.11 + 0.06 * emphasis})`;
        ctx.stroke();
      };
      for (const h of horizonList) bell(h, TARGET.mu, TARGET.sigma, false, state.compare);

      // Identical shocks across checkpoints: only the inferred moments move the fan.
      const grow = state.fitting && state.phase !== 'update' ? state.growth : 1;
      const blueCount = narrow ? 7 : BLUE_COUNT;
      for (let i = 0; i < blueCount; i++) {
        const pathIndex = BLUE_INDICES[Math.round(i * (BLUE_COUNT - 1) / (blueCount - 1))];
        for (const [end, alpha] of [[PATH_STEPS - 1, 0.055], [Math.floor(grow * (PATH_STEPS - 1)), 0.17]] as const) {
          if (end < 1) continue;
          ctx.beginPath();
          for (let s = 0; s <= end; s++) point(project(xAt(s), logPrice(shocks, pathIndex, s, model.mu, model.sigma) * Y_SCALE, zAt(pathIndex, s)), s === 0);
          ctx.lineWidth = i % 4 === 0 ? 1.2 : 0.8; ctx.strokeStyle = `rgba(111,163,221,${alpha * state.opacity})`; ctx.stroke();
        }
      }
      for (const h of horizonList) bell(h, model.mu, model.sigma, true, state.compare);

      const positions = nodes.map((n) => project(n.x, n.y, 0)), origin = project(X_START, 0, 0);
      const outputStart = nodes.length - MODEL_LAYERS[MODEL_LAYERS.length - 1];
      ctx.globalAlpha = 0.35 + 0.65 * state.opacity;
      for (const edge of edges) {
        const weight = model.weights[edge.layer][edge.output][edge.input], strength = Math.min(1, Math.abs(weight) / 1.5);
        ctx.beginPath(); curve(positions[edge.a], positions[edge.b]); ctx.lineWidth = 0.45 + 0.9 * strength;
        ctx.strokeStyle = weight >= 0 ? `rgba(115,162,214,${0.045 + 0.11 * strength})` : `rgba(191,207,227,${0.025 + 0.055 * strength})`; ctx.stroke();
      }
      ctx.beginPath();
      for (let i = outputStart; i < nodes.length; i++) curve(positions[i], origin);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(128,178,232,0.23)'; ctx.stroke();
      const networkPulse = (u: number, backwards: boolean) => {
        if (u < 0 || u > 1) return;
        const layerProgress = Math.min(2.9999, u * 3), segment = Math.floor(layerProgress), f = layerProgress - segment;
        for (const edge of edges) {
          if (edge.layer !== (backwards ? 2 - segment : segment) || (edge.input + edge.output) % 2) continue;
          pulse(onCurve(positions[edge.a], positions[edge.b], backwards ? 1 - f : f), backwards ? 0.38 : 0.72, narrow ? 1.5 : 2);
        }
      };
      networkPulse(state.forward, false);
      if (state.connector >= 0) for (let i = outputStart; i < nodes.length; i++) pulse(onCurve(positions[i], origin, state.connector), 0.85, narrow ? 2 : 2.7);
      // Return from the compared distribution to the origin, output wires, and network.
      if (state.feedback >= 0) {
        const u = state.feedback;
        if (u < 0.25) {
          const end = project(X_END, (model.mu - model.sigma * model.sigma / 2) * Y_SCALE, -BELL * TARGET.sigma / model.sigma);
          pulse(onCurve(end, origin, u / 0.25), 0.48, 2);
        } else if (u < 0.45) {
          for (let i = outputStart; i < nodes.length; i++) pulse(onCurve(positions[i], origin, 1 - (u - 0.25) / 0.2), 0.48, 2);
        } else networkPulse((u - 0.45) / 0.55, true);
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], activation = Math.min(1, Math.abs(model.activations[n.layer][n.j]));
        const lit = state.forward >= 0 && Math.abs(state.forward * 3 - n.layer) < 0.3, radius = narrow ? 2.2 : 3;
        ctx.fillStyle = '#0b111b'; ctx.fillRect(positions[i][0] - radius, positions[i][1] - radius, radius * 2, radius * 2);
        ctx.lineWidth = lit ? 1.3 : 0.8; ctx.strokeStyle = `rgba(151,191,232,${lit ? 0.8 : 0.22 + activation * 0.16})`;
        ctx.strokeRect(positions[i][0] - radius, positions[i][1] - radius, radius * 2, radius * 2);
      }
      const arrival = state.connector > 0.7 ? smooth((state.connector - 0.7) / 0.3) : state.phase === 'generate' ? 1 - grow : 0;
      if (arrival > 0) {
        ctx.beginPath(); ctx.arc(origin[0], origin[1], 3 + 9 * (1 - arrival), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150,198,246,${arrival * 0.55})`; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Preserve a clear connection, with a quieter fan under the reading column.
      if (width >= 1024) {
        const veil = ctx.createLinearGradient(width * 0.43, 0, width * 0.64, 0);
        veil.addColorStop(0, 'rgba(11,17,27,0)'); veil.addColorStop(1, 'rgba(11,17,27,0.42)');
        ctx.fillStyle = veil; ctx.fillRect(width * 0.43, 0, width * 0.57, height);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden || reduced.matches) { previous = null; return; }
      if (previous !== null) elapsed += Math.min(now - previous, 100) / 1000;
      previous = now;
      if (now - painted >= 1000 / FPS) { painted = now; draw(elapsed); }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { previous = null; if (!raf && !document.hidden && !reduced.matches) raf = requestAnimationFrame(frame); };
    const onVisibility = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; previous = null;
      if (!document.hidden) start();
    };
    const onReducedMotion = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; previous = null;
      if (reduced.matches) draw(0, true); else { draw(elapsed); start(); }
    };
    const onResize = () => { resize(); draw(elapsed, reduced.matches); };
    resize(); draw(0, reduced.matches); start();
    addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onReducedMotion);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onReducedMotion);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full [mask-image:radial-gradient(ellipse_100%_85%_at_50%_65%,#000_50%,transparent_100%)]" />;
}
