'use client';

import { useEffect, useRef } from 'react';

const R = 600; // radius of the glow in px

/** A faint glow that follows the mouse. Moved with a transform, so it never repaints the page. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return; // stays where CSS put it
    let raf = 0, x = 0, y = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.transform = `translate3d(${x - R}px, ${y - R}px, 0)`;
        });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => {
      removeEventListener('pointermove', move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={ref}
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: R * 2,
          height: R * 2,
          transform: `translate3d(${-R * 0.55}px, ${-R * 0.75}px, 0)`,
          background: 'radial-gradient(closest-side, rgba(78,133,191,0.12), rgba(78,133,191,0.04) 55%, transparent)',
        }}
      />
    </div>
  );
}
