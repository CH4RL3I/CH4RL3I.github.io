'use client';

import { useEffect, useState } from 'react';
import { site } from '@/content/site';

const { hero } = site;

/** "A Builder based in Lisbon.", with the role word cycling. */
export function RoleLine() {
  const [i, setI] = useState(0);
  const [cycle, setCycle] = useState(false);

  useEffect(() => {
    // Reduced motion: the line stays on the first role (no auto-updating text).
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setCycle(true);
    const id = setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % hero.roles.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const r = hero.roles[i];
  const all = hero.roles.map((x) => x.word.toLowerCase());
  const spoken = `A ${all.slice(0, -1).join(', ')} and ${all[all.length - 1]} based in ${hero.place}.`;
  return (
    <p className="mt-3 text-lg font-medium tracking-tight text-text/90 sm:text-xl">
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true">
        <span key={i} className={cycle ? 'role-in' : undefined}>
          {r.article} <span className="text-text">{r.word}</span>
        </span>{' '}
        based in {hero.place}
      </span>
    </p>
  );
}
