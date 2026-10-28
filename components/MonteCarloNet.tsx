'use client';

import { useEffect, useRef } from 'react';

/*
 * Page background: a small neural network learning to reproduce a Monte Carlo simulation.
 * Grey: a fixed Monte Carlo fan of log-price paths (geometric Brownian motion), with the
 * distribution of outcomes drawn as a bell at four horizons, standing out of the fan like the
 * textbook figure of Brownian motion. Blue: the network, laid out in ordered layers with curved
 * weights (thickness = size, tone = sign). Each training step a forward pass runs through it,
 * it draws a fresh set of paths and bells with its current drift and volatility, and a backward
 * pass returns. Its bells start too narrow and too low and settle onto the grey ones. Then the
 * loop starts over.
 *
 * A choreographed sketch, not a network trained in the browser. Plain canvas 2D with a
 * hand-rolled projection: no 3D library. 30 fps cap, paused when the tab is hidden, one still
 * (converged) frame under reduced motion.
 */

const FPS = 30;
const STEPS = 48; //          time steps per path
const N_MC = 40; //           Monte Carlo paths drawn
const N_NET = 16; //          network paths per training step
const MU = 0.06, SIGMA = 0.36; // target drift and volatility (log space, one year)
const MU0 = -0.3, SIGMA0 = 0.2; // the untrained network: wrong drift, too narrow
const EPOCH = 1.1; //         seconds per training step
const EPOCHS = 14;
const HOLD = 4; //            seconds to show the fitted state before starting over
const CYCLE = EPOCHS * EPOCH + HOLD;
const X_START = -1.0, X_END = 1.3; // time axis in world units
const Y_SCALE = 0.95;
const CONE = 0.5; //          depth the fan opens to
const HORIZONS = [0.25, 0.5, 0.75, 1]; // where the bells stand, as a share of the year
const BELL = 0.6; //          bell height in world units (target peak)
const LAYERS = [3, 5, 5, 2]; // inputs, two hidden layers, outputs (drift, volatility)
const LAYER_X = [-2.45, -2.07, -1.69, -1.31];
const NODE_GAP = 0.17;
const PITCH = 0.06, DIST = 4.4;

// Seeded randomness, so every visit draws the same simulation.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  const u = Math.max(1e-12, r());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

/** Log-price paths for one set of parameters: n paths x STEPS values, path-major. */
function simulate(n: number, mu: number, sigma: number, seed: number) {
  const r = rng(seed);
  const out = new Float32Array(n * STEPS);
  const dt = 1 / (STEPS - 1);
  for (let i = 0; i < n; i++) {
    let y = 0;
    out[i * STEPS] = 0;
    for (let s = 1; s < STEPS; s++) {
      y += (mu - (sigma * sigma) / 2) * dt + sigma * Math.sqrt(dt) * gauss(r);
      out[i * STEPS + s] = y;
    }
  }
  return out;
}

const mcPaths = simulate(N_MC, MU, SIGMA, 7);

/** The network's parameters after k training steps (k may be fractional). */
function params(k: number) {
  const p = 1 - Math.exp(-(k + 1) / 4.5);
  return { mu: MU0 + (MU - MU0) * p, sigma: SIGMA0 + (SIGMA - SIGMA0) * p, p };
}

// Network nodes in world space: ordered columns in one plane, as in a textbook diagram.
const nodes = LAYERS.flatMap((n, l) => Array.from({ length: n }, (_, j) => ({ l, x: LAYER_X[l], y: 0.1 + (j - (n - 1) / 2) * NODE_GAP })));
// Edges with a start and a trained weight; the weight in use slides between them as training runs.
const edges: { a: number; b: number; w0: number; w1: number }[] = [];
{
  const r = rng(23);
  let off = 0;
  for (let l = 0; l < LAYERS.length - 1; l++) {
    const next = off + LAYERS[l];
    for (let a = 0; a < LAYERS[l]; a++)
      for (let b = 0; b < LAYERS[l + 1]; b++) edges.push({ a: off + a, b: next + b, w0: gauss(r) * 0.7, w1: gauss(r) * 0.7 });
    off = next;
  }
}

const easeOut = (x: number) => 1 - (1 - x) ** 3;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function MonteCarloNet() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0;
    const t0 = performance.now();
    const netCache = new Map<number, Float32Array>();
    const netPaths = (k: number) => {
      let p = netCache.get(k);
      if (!p) {
        const { mu, sigma } = params(k);
        p = simulate(N_NET, mu, sigma, 1000 + k);
        netCache.set(k, p);
      }
      return p;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const draw = (t: number, scroll: number, still = false) => {
      // Where in the training loop we are.
      const c = still ? EPOCHS * EPOCH + 0.5 : t % CYCLE;
      const training = c < EPOCHS * EPOCH;
      const k = training ? Math.floor(c / EPOCH) : EPOCHS - 1;
      const a = training ? (c - k * EPOCH) / EPOCH : 1; // phase inside the step
      const fadeIn = still ? 1 : clamp01(c / 0.8) * clamp01((CYCLE - c) / 0.8); // soft restart

      // Camera.
      const yaw = -0.72 + (still ? 0 : 0.07 * Math.sin((2 * Math.PI * t) / 40)) + 0.25 * scroll;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
      const narrow = W < 768;
      const F = Math.max(W, H * 1.3) * (narrow ? 1.2 : 0.86);
      const ox = W * (narrow ? 0.6 : 0.52), oy = H * (narrow ? 0.66 : 0.64);
      let px = 0, py = 0, pd = 0;
      const project = (x: number, y: number, z: number) => {
        const x1 = x * cy - z * sy;
        const z1 = x * sy + z * cy;
        const y2 = y * cp + z1 * sp;
        const z2 = -y * sp + z1 * cp + DIST;
        px = ox + (F * x1) / z2;
        py = oy - (F * y2) / z2;
        pd = z2;
      };
      const xAt = (s: number) => X_START + ((X_END - X_START) * s) / (STEPS - 1);
      const zAt = (i: number, n: number, s: number) => (i / (n - 1) - 0.5) * CONE * (s / (STEPS - 1));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = fadeIn;
      ctx.lineWidth = 1;

      // Monte Carlo fan (the target).
      for (let i = 0; i < N_MC; i++) {
        ctx.beginPath();
        for (let s = 0; s < STEPS; s++) {
          project(xAt(s), mcPaths[i * STEPS + s] * Y_SCALE, zAt(i, N_MC, s));
          if (s) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        const depth = clamp01((pd - (DIST - 1)) / 2); // 0 near, 1 far
        ctx.strokeStyle = `rgba(200,215,235,${(0.07 - 0.035 * depth).toFixed(3)})`;
        ctx.stroke();
      }

      // A bell for the distribution of log prices at horizon h, rising out of the fan toward the
      // viewer. Heights are scaled so the target's peak is BELL at every horizon.
      const bell = (h: number, mu: number, sigma: number, fill: string | null, stroke: string, width: number) => {
        const x = X_START + (X_END - X_START) * h;
        const sdT = SIGMA * Math.sqrt(h), sd = sigma * Math.sqrt(h);
        const m = (mu - (sigma * sigma) / 2) * h;
        const lo = m - 2.6 * sd, hi = m + 2.6 * sd;
        ctx.beginPath();
        for (let j = 0; j <= 64; j++) {
          const y = lo + ((hi - lo) * j) / 64;
          const z = -BELL * (sdT / sd) * Math.exp(-0.5 * ((y - m) / sd) ** 2);
          project(x, y * Y_SCALE, z);
          if (j) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        if (fill) {
          project(x, hi * Y_SCALE, 0);
          ctx.lineTo(px, py);
          project(x, lo * Y_SCALE, 0);
          ctx.lineTo(px, py);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.lineWidth = 1;
      };
      for (const h of HORIZONS) {
        // The horizon's axis, then the target bell standing on it.
        const x = X_START + (X_END - X_START) * h, sdT = SIGMA * Math.sqrt(h), mT = (MU - (SIGMA * SIGMA) / 2) * h;
        ctx.beginPath();
        project(x, (mT - 2.6 * sdT) * Y_SCALE, 0);
        ctx.moveTo(px, py);
        project(x, (mT + 2.6 * sdT) * Y_SCALE, 0);
        ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(200,215,235,0.045)';
        ctx.stroke();
        bell(h, MU, SIGMA, 'rgba(200,215,235,0.03)', 'rgba(200,215,235,0.11)', 1);
      }

      // Network: curved weights between ordered layers, thickness by size and tone by sign.
      const kk = training ? k + easeOut(clamp01((a - 0.3) / 0.6)) : EPOCHS - 1;
      const cur = params(kk);
      const proj = nodes.map((n) => {
        project(n.x, n.y, 0);
        return [px, py] as const;
      });
      const curve = (x0: number, y0: number, x1: number, y1: number) => {
        const xm = (x0 + x1) / 2;
        ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(xm, y0, xm, y1, x1, y1);
      };
      const onCurve = (x0: number, y0: number, x1: number, y1: number, f: number) => {
        const xm = (x0 + x1) / 2, g = 1 - f;
        const b0 = g * g * g, b1 = 3 * g * g * f, b2 = 3 * g * f * f, b3 = f * f * f;
        return [b0 * x0 + (b1 + b2) * xm + b3 * x1, (b0 + b1) * y0 + (b2 + b3) * y1] as const;
      };
      for (const e of edges) {
        const w = e.w0 + (e.w1 - e.w0) * cur.p;
        const s = Math.min(1.2, Math.abs(w));
        ctx.beginPath();
        curve(proj[e.a][0], proj[e.a][1], proj[e.b][0], proj[e.b][1]);
        ctx.lineWidth = 0.5 + 1.5 * s;
        ctx.strokeStyle = w >= 0 ? `rgba(110,155,205,${(0.07 + 0.11 * s).toFixed(3)})` : `rgba(200,215,235,${(0.04 + 0.07 * s).toFixed(3)})`;
        ctx.stroke();
      }
      // The outputs (drift and volatility) feed the start of the paths.
      project(X_START, 0, 0);
      const startX = px, startY = py;
      ctx.beginPath();
      for (let n = nodes.length - LAYERS[LAYERS.length - 1]; n < nodes.length; n++) curve(proj[n][0], proj[n][1], startX, startY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(110,155,205,0.14)';
      ctx.stroke();

      // Forward pass early in the step, backward pass (the gradients) later on.
      const span = LAYERS.length - 1;
      const fwd = training ? clamp01(a / 0.3) : -1;
      const bwd = training ? clamp01((a - 0.5) / 0.3) : -1;
      const runPulse = (u: number, back: boolean, color: string, size: number) => {
        if (u <= 0 || u >= 1) return;
        const seg = Math.min(span - 1, Math.floor(u * span));
        const f = u * span - seg;
        const layer = back ? span - 1 - seg : seg;
        ctx.fillStyle = color;
        for (const e of edges) {
          if (nodes[e.a].l !== layer) continue;
          const [x, y] = onCurve(proj[e.a][0], proj[e.a][1], proj[e.b][0], proj[e.b][1], back ? 1 - f : f);
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      };
      runPulse(fwd, false, 'rgba(170,200,235,0.6)', 2);
      runPulse(bwd, true, 'rgba(220,228,240,0.3)', 1.5);
      for (let n = 0; n < nodes.length; n++) {
        const l = nodes[n].l;
        const lit = (fwd > 0 && fwd < 1 && Math.abs(fwd * span - l) < 0.3) || (bwd > 0 && bwd < 1 && Math.abs((1 - bwd) * span - l) < 0.3);
        const r = lit ? 3.5 : 3;
        ctx.fillStyle = '#0b111b';
        ctx.fillRect(proj[n][0] - r, proj[n][1] - r, 2 * r, 2 * r);
        ctx.strokeStyle = lit ? 'rgba(170,200,235,0.6)' : 'rgba(137,170,204,0.28)';
        ctx.strokeRect(proj[n][0] - r + 0.5, proj[n][1] - r + 0.5, 2 * r - 1, 2 * r - 1);
      }

      // The network's paths: the previous step's fade out while this step's grow in.
      const drawNet = (paths: Float32Array, grow: number, alpha: number) => {
        if (alpha <= 0.005 || grow <= 0) return;
        const end = Math.max(1, Math.round(grow * (STEPS - 1)));
        ctx.strokeStyle = `rgba(110,155,205,${alpha.toFixed(3)})`;
        for (let i = 0; i < N_NET; i++) {
          ctx.beginPath();
          for (let s = 0; s <= end; s++) {
            project(xAt(s), paths[i * STEPS + s] * Y_SCALE, zAt(i, N_NET, s));
            if (s) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          }
          ctx.stroke();
        }
      };
      if (training) {
        if (k > 0) drawNet(netPaths(k - 1), 1, 0.18 * (1 - clamp01(a / 0.3)));
        drawNet(netPaths(k), easeOut(clamp01((a - 0.3) / 0.6)), 0.18);
      } else {
        drawNet(netPaths(EPOCHS - 1), 1, 0.18);
      }

      // The network's bells for its current drift and volatility.
      for (const h of HORIZONS) bell(h, cur.mu, cur.sigma, null, 'rgba(120,165,215,0.28)', 1.2);
      ctx.globalAlpha = 1;
    };

    const scrollShare = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      return max > 0 ? Math.min(1, scrollY / max) : 0;
    };
    const frame = (now: number) => {
      raf = 0;
      if (document.hidden || reduce.matches) return;
      if (now - last >= 1000 / FPS) {
        last = now;
        draw((now - t0) / 1000, scrollShare());
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && !document.hidden && !reduce.matches) raf = requestAnimationFrame(frame);
    };
    const still = () => draw(0, 0, true);

    resize();
    if (reduce.matches) still();
    else start();

    const onResize = () => {
      resize();
      if (reduce.matches) still();
    };
    addEventListener('resize', onResize);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    const onReduce = () => (reduce.matches ? still() : start());
    reduce.addEventListener('change', onReduce);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener('change', onReduce);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full [mask-image:radial-gradient(ellipse_80%_75%_at_52%_58%,#000_40%,transparent_100%)]"
    />
  );
}
