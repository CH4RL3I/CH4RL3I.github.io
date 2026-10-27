'use client';

import { useEffect, useRef } from 'react';

/*
 * Page background: "implied density surface", after fearcurve. A term structure of risk-neutral
 * densities of the log return (x: return, z: maturity, y: density), drawn as a faint 3D wireframe.
 * Each density is a two-normal mix with a left "crash" component; its weight (the fear) drifts
 * slowly and the wave travels back through the maturities. The camera sways a little and turns
 * with the scroll. Plain canvas 2D with a hand-rolled projection: no 3D library.
 */

const NT = 28; //             maturities (depth)
const NX = 72; //             points per curve
const MESH = 6; //            a depth line every MESH points
const X0 = -0.62, X1 = 0.46; // log-return range
const VOL = 0.18;
const PERIOD = 22; //         seconds per fear cycle
const LAG = 0.25; //          seconds of delay per maturity step
const ACCENT_T = 3; //        which maturity carries the accent
const FPS = 30;
const PITCH = 0.5; //         camera tilt, radians
const DIST = 3.4; //          camera distance

const SQ2PI = Math.sqrt(2 * Math.PI);
const pdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * SQ2PI);

const maturities = Array.from({ length: NT }, (_, i) => 0.06 + 0.94 * (i / (NT - 1)) ** 1.3);
const xs = Array.from({ length: NX }, (_, j) => X0 + ((X1 - X0) * j) / (NX - 1));
const peak0 = 1 / (VOL * Math.sqrt(maturities[0]) * SQ2PI);

/** Fills one curve into `out` at `off` and returns its peak. */
function density(T: number, fear: number, out: Float64Array, off: number) {
  const s1 = VOL * Math.sqrt(T);
  const w = 0.05 + 0.17 * fear;
  const m2 = -(0.55 + 0.9 * fear) * s1 * 1.6;
  const s2 = 1.9 * s1;
  const m1 = (-w * m2) / (1 - w); // keeps the mean log return near zero
  let peak = 0;
  for (let j = 0; j < NX; j++) {
    const v = (1 - w) * pdf(xs[j], m1, s1) + w * pdf(xs[j], m2, s2);
    out[off + j] = v;
    if (v > peak) peak = v;
  }
  return peak;
}

const fearAt = (t: number) => {
  const a = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / PERIOD);
  const b = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 53 + 1.3);
  return Math.min(1, Math.max(0, 0.8 * a + 0.2 * b));
};

export function DensitySurface() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const val = new Float64Array(NT * NX);
    const peaks = new Float64Array(NT);
    const sx = new Float32Array(NT * NX), sy = new Float32Array(NT * NX), dz = new Float32Array(NT * NX);
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0;
    const t0 = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const draw = (t: number, scroll: number) => {
      // Surface heights for this moment.
      for (let i = 0; i < NT; i++) peaks[i] = density(maturities[i], fearAt(t - i * LAG), val, i * NX);

      // Camera: a slow sway plus a quarter turn's worth of scroll.
      const yaw = -0.55 + 0.1 * Math.sin((2 * Math.PI * t) / 48) + 0.35 * scroll;
      const cy = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
      const narrow = W < 768;
      const F = Math.max(W, H * 1.2) * (narrow ? 1.25 : 0.95);
      const ox = W * (narrow ? 0.5 : 0.6), oy = H * (narrow ? 0.74 : 0.7);

      let zmin = Infinity, zmax = -Infinity;
      for (let i = 0; i < NT; i++) {
        const z = (i / (NT - 1)) * 1.8 - 0.9; // depth, centred on the rotation axis
        // Each curve keeps its shape; longer maturities are flatter, as in fearcurve's plots.
        const scale = (0.7 * Math.pow(peaks[i] / peak0, 0.55)) / peaks[i];
        for (let j = 0; j < NX; j++) {
          const k = i * NX + j;
          const x = ((xs[j] - (X0 + X1) / 2) / (X1 - X0)) * 2.2;
          const y = val[k] * scale;
          const x1 = x * cy - z * syw;
          const z1 = x * syw + z * cy;
          const y2 = y * cp + z1 * sp;
          const z2 = -y * sp + z1 * cp + DIST;
          sx[k] = ox + (F * x1) / z2;
          sy[k] = oy - (F * y2) / z2;
          dz[k] = z2;
          if (z2 < zmin) zmin = z2;
          if (z2 > zmax) zmax = z2;
        }
      }
      const near = (z: number) => 1 - (z - zmin) / (zmax - zmin || 1); // 1 = closest to the camera

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;

      // Depth lines: across maturities, every MESH points.
      for (let j = 0; j < NX; j += MESH) {
        ctx.beginPath();
        for (let i = 0; i < NT; i++) {
          const k = i * NX + j;
          if (i) ctx.lineTo(sx[k], sy[k]);
          else ctx.moveTo(sx[k], sy[k]);
        }
        ctx.strokeStyle = 'rgba(137,170,204,0.04)';
        ctx.stroke();
      }

      // The densities themselves, back to front.
      for (let i = NT - 1; i >= 0; i--) {
        const k0 = i * NX;
        ctx.beginPath();
        ctx.moveTo(sx[k0], sy[k0]);
        for (let j = 1; j < NX; j++) ctx.lineTo(sx[k0 + j], sy[k0 + j]);
        const n = near(dz[k0 + (NX >> 1)]);
        if (i === ACCENT_T) {
          ctx.strokeStyle = 'rgba(110,155,205,0.32)';
          ctx.lineWidth = 1.3;
        } else {
          ctx.strokeStyle = `rgba(200,215,235,${(0.025 + 0.085 * n * n).toFixed(3)})`;
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }
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
    // Reduced motion: one still frame with a clearly skewed curve, and no turning with the scroll.
    const still = () => draw(PERIOD * 0.25, 0);

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
      className="pointer-events-none fixed inset-0 z-0 h-full w-full [mask-image:radial-gradient(ellipse_75%_70%_at_55%_62%,#000_35%,transparent_100%)]"
    />
  );
}
