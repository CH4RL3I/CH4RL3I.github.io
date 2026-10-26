'use client';

import { useEffect, useRef } from 'react';

/*
 * "Implied densities", after fearcurve: a term structure of risk-neutral densities of the
 * log return, short maturities tall and narrow at the front, long ones flat at the back.
 * Each density is a two-normal mix with a left "crash" component; its weight (the fear)
 * drifts slowly and the wave travels back through the maturities. Painted back to front,
 * each curve filled with the background so nearer curves hide the ones behind.
 */

const N = 26; //            maturities
const M = 150; //           points per curve
const X0 = -0.62, X1 = 0.46; // log-return range
const VOL = 0.18;
const PERIOD = 22; //       seconds per fear cycle
const LAG = 0.2; //         seconds of delay per maturity step
const ACCENT_I = 2; //      which curve carries the accent
const FPS = 30;

const SQ2PI = Math.sqrt(2 * Math.PI);
const pdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * SQ2PI);

const maturities = Array.from({ length: N }, (_, i) => 0.06 + 0.94 * (i / (N - 1)) ** 1.3);
const xs = Array.from({ length: M }, (_, j) => X0 + ((X1 - X0) * j) / (M - 1));

function density(T: number, fear: number, out: Float64Array) {
  const s1 = VOL * Math.sqrt(T);
  const w = 0.05 + 0.17 * fear;
  const m2 = -(0.55 + 0.9 * fear) * s1 * 1.6;
  const s2 = 1.9 * s1;
  const m1 = (-w * m2) / (1 - w); // keeps the mean log return near zero
  let peak = 0;
  for (let j = 0; j < M; j++) {
    const v = (1 - w) * pdf(xs[j], m1, s1) + w * pdf(xs[j], m2, s2);
    out[j] = v;
    if (v > peak) peak = v;
  }
  return peak;
}

const fearAt = (t: number) => {
  const a = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / PERIOD);
  const b = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 53 + 1.3);
  return Math.min(1, Math.max(0, 0.8 * a + 0.2 * b));
};

export function DensityField({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const buf = new Float64Array(M);
    const px = new Float32Array(M), py = new Float32Array(M);
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(px[0], py[0]);
      for (let j = 1; j < M; j++) ctx.lineTo(px[j], py[j]);
    };
    const peak0 = 1 / (VOL * Math.sqrt(maturities[0]) * SQ2PI);
    let W = 0, H = 0, dpr = 1;
    let raf = 0, last = 0, visible = true;
    const t0 = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const amp = Math.min(H * 0.3, W * 0.42);
      const narrow = W < 640;
      for (let i = N - 1; i >= 0; i--) {
        const d = i / (N - 1);
        const s = 1 - 0.45 * d;
        const base = H * 0.9 - d * H * (narrow ? 0.34 : 0.42);
        const cx = W * 0.5 + d * W * 0.07;
        const span = W * (narrow ? 1.7 : 1.25) * s;
        const peak = density(maturities[i], fearAt(t - i * LAG), buf);
        const h = amp * s * Math.pow(peak / peak0, 0.55);
        for (let j = 0; j < M; j++) {
          px[j] = cx + ((xs[j] - (X0 + X1) / 2) / (X1 - X0)) * span;
          py[j] = base - (buf[j] / peak) * h;
        }
        trace();
        // Fill down to the bottom with the page colour so this curve hides the ones behind it.
        ctx.lineTo(cx + span / 2, H);
        ctx.lineTo(cx - span / 2, H);
        ctx.closePath();
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
        if (i === ACCENT_I) {
          const g = ctx.createLinearGradient(cx - span / 2, 0, cx + span / 2, 0);
          g.addColorStop(0, 'rgba(137,170,204,0)');
          g.addColorStop(0.3, 'rgba(137,170,204,0.55)');
          g.addColorStop(0.7, 'rgba(78,133,191,0.55)');
          g.addColorStop(1, 'rgba(78,133,191,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.25;
        } else {
          ctx.strokeStyle = `rgba(245,245,245,${(0.045 + 0.1 * (1 - d)).toFixed(3)})`;
          ctx.lineWidth = 1;
        }
        // Stroke only the curve itself, not the closing edges of the fill.
        trace();
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || reduce.matches) return;
      if (now - last >= 1000 / FPS) {
        last = now;
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden && !reduce.matches) raf = requestAnimationFrame(frame);
    };
    // Reduced motion: one still frame with a clearly skewed curve.
    const still = () => draw(PERIOD * 0.25);

    resize();
    if (reduce.matches) still(); else { draw(0); start(); }

    const ro = new ResizeObserver(() => { resize(); if (reduce.matches) still(); else draw((performance.now() - t0) / 1000); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(canvas);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    const onReduce = () => { if (reduce.matches) still(); else start(); };
    reduce.addEventListener('change', onReduce);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener('change', onReduce);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
