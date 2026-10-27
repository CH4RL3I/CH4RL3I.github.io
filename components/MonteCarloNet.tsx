'use client';

import { useEffect, useRef } from 'react';

/*
 * Page background: a small neural network learning to reproduce a Monte Carlo simulation.
 * Grey: a fixed Monte Carlo fan of log-price paths (geometric Brownian motion) opening into
 * depth, and the histogram of where many such paths end. Blue: the network. Each training step
 * a pulse runs through its layers and it draws a fresh set of paths with its current drift and
 * volatility; those start wrong and converge on the target, and its density curve settles onto
 * the histogram. Then the loop starts over.
 *
 * A choreographed sketch, not a network trained in the browser. Plain canvas 2D with a
 * hand-rolled projection: no 3D library. 30 fps cap, paused when the tab is hidden, one still
 * (converged) frame under reduced motion.
 */

const FPS = 30;
const STEPS = 48; //          time steps per path
const N_MC = 46; //           Monte Carlo paths drawn
const N_NET = 22; //          network paths per training step
const MU = 0.06, SIGMA = 0.36; // target drift and volatility (log space, one year)
const MU0 = -0.32, SIGMA0 = 0.07; // the untrained network: wrong drift, far too narrow
const EPOCH = 0.9; //         seconds per training step
const EPOCHS = 16;
const HOLD = 4; //            seconds to show the fitted state before starting over
const CYCLE = EPOCHS * EPOCH + HOLD;
const X_START = -1.0, X_END = 1.3; // time axis in world units
const Y_SCALE = 0.95;
const CONE = 1.4; //          depth the fan opens to
const LAYERS = [3, 6, 6, 1];
const LAYER_X = [-2.15, -1.85, -1.55, -1.25];
const PITCH = 0.32, DIST = 4.2;
const BINS = 18, Y_LO = -1.25, Y_HI = 1.25;

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

// Histogram of 4,000 simulated end values: the distribution the network has to match.
const hist = (() => {
  const r = rng(11);
  const h = new Float32Array(BINS);
  const n = 4000;
  for (let i = 0; i < n; i++) {
    const y = MU - (SIGMA * SIGMA) / 2 + SIGMA * gauss(r);
    const b = Math.floor(((y - Y_LO) / (Y_HI - Y_LO)) * BINS);
    if (b >= 0 && b < BINS) h[b]++;
  }
  const w = (Y_HI - Y_LO) / BINS;
  for (let b = 0; b < BINS; b++) h[b] /= n * w; // as a density
  return h;
})();

/** The network's parameters after k training steps (k may be fractional). */
function params(k: number) {
  const p = 1 - Math.exp(-(k + 1) / 3.6);
  return { mu: MU0 + (MU - MU0) * p, sigma: SIGMA0 + (SIGMA - SIGMA0) * p };
}

// Network nodes in world space.
const nodes = LAYERS.flatMap((n, l) =>
  Array.from({ length: n }, (_, j) => ({ l, x: LAYER_X[l], y: (j - (n - 1) / 2) * 0.12, z: (j % 2 ? 1 : -1) * 0.07 * (l % 2 ? 1 : -1) })),
);
const edges: [number, number][] = [];
{
  let off = 0;
  for (let l = 0; l < LAYERS.length - 1; l++) {
    const next = off + LAYERS[l];
    for (let a = 0; a < LAYERS[l]; a++) for (let b = 0; b < LAYERS[l + 1]; b++) edges.push([off + a, next + b]);
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
      const yaw = -0.38 + (still ? 0 : 0.08 * Math.sin((2 * Math.PI * t) / 40)) + 0.3 * scroll;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
      const narrow = W < 768;
      const F = Math.max(W, H * 1.3) * (narrow ? 1.2 : 0.82);
      const ox = W * (narrow ? 0.62 : 0.5), oy = H * (narrow ? 0.66 : 0.68);
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
        ctx.strokeStyle = `rgba(200,215,235,${(0.075 - 0.04 * depth).toFixed(3)})`;
        ctx.stroke();
      }

      // Histogram of the simulated end values, standing in the plane after the last step.
      const hx = X_END + 0.1, bw = (Y_HI - Y_LO) / BINS, hs = 0.45;
      ctx.fillStyle = 'rgba(200,215,235,0.045)';
      ctx.strokeStyle = 'rgba(200,215,235,0.07)';
      for (let b = 0; b < BINS; b++) {
        const y0 = (Y_LO + b * bw) * Y_SCALE, y1 = (Y_LO + (b + 1) * bw) * Y_SCALE, len = hist[b] * hs;
        if (len <= 0) continue;
        ctx.beginPath();
        project(hx, y0, 0); ctx.moveTo(px, py);
        project(hx + len, y0, 0); ctx.lineTo(px, py);
        project(hx + len, y1, 0); ctx.lineTo(px, py);
        project(hx, y1, 0); ctx.lineTo(px, py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // The network's density for its current parameters, gliding between steps.
      const kk = training ? k + easeOut(clamp01((a - 0.3) / 0.6)) : EPOCHS - 1;
      const cur = params(kk);
      const m = cur.mu - (cur.sigma * cur.sigma) / 2;
      ctx.beginPath();
      for (let j = 0; j <= 80; j++) {
        const y = Y_LO + ((Y_HI - Y_LO) * j) / 80;
        const d = Math.exp(-0.5 * ((y - m) / cur.sigma) ** 2) / (cur.sigma * Math.sqrt(2 * Math.PI));
        project(hx + Math.min(d, 3.2) * hs, y * Y_SCALE, 0);
        if (j) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.strokeStyle = 'rgba(120,165,215,0.3)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.lineWidth = 1;

      // Network edges, then the pulse of this training step travelling through them.
      const pulse = training ? clamp01(a / 0.35) : -1; // 0..1 across the layers
      const proj = nodes.map((n) => {
        project(n.x, n.y, n.z);
        return [px, py] as const;
      });
      ctx.strokeStyle = 'rgba(137,170,204,0.07)';
      ctx.beginPath();
      for (const [i, j] of edges) {
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
      }
      // The output node feeds the start of the paths.
      project(X_START, 0, 0);
      const out = proj[proj.length - 1];
      ctx.moveTo(out[0], out[1]);
      ctx.lineTo(px, py);
      ctx.stroke();
      if (pulse >= 0 && pulse < 1) {
        const span = LAYERS.length - 1;
        const seg = Math.min(span - 1, Math.floor(pulse * span));
        const f = pulse * span - seg;
        ctx.fillStyle = 'rgba(160,195,235,0.6)';
        for (const [i, j] of edges) {
          if (nodes[i].l !== seg) continue;
          const x = proj[i][0] + (proj[j][0] - proj[i][0]) * f, y = proj[i][1] + (proj[j][1] - proj[i][1]) * f;
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
      for (let n = 0; n < nodes.length; n++) {
        const lit = pulse >= 0 && Math.abs(pulse * (LAYERS.length - 1) - nodes[n].l) < 0.35;
        ctx.beginPath();
        ctx.arc(proj[n][0], proj[n][1], lit ? 2.8 : 2, 0, Math.PI * 2);
        ctx.fillStyle = lit ? 'rgba(160,195,235,0.55)' : 'rgba(137,170,204,0.2)';
        ctx.fill();
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
        if (k > 0) drawNet(netPaths(k - 1), 1, 0.2 * (1 - clamp01(a / 0.3)));
        drawNet(netPaths(k), easeOut(clamp01((a - 0.3) / 0.6)), 0.2);
      } else {
        drawNet(netPaths(EPOCHS - 1), 1, 0.2);
      }
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
