'use client';

import { useEffect, useState } from 'react';

const LINKS = [
  { id: 'top', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'resume', label: 'Resume' },
] as const;
const SECTIONS = ['top', 'work', 'resume', 'ask', 'say-hi'];

function Divider() {
  return <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-stroke sm:block" />;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('top');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  // The section crossing the middle of the viewport is the active one.
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-6">
      <nav
        aria-label="Main"
        className={`pointer-events-auto inline-flex items-center rounded-full border border-white/10 bg-surface/85 px-2 py-2 backdrop-blur-md transition-shadow duration-300 ${scrolled ? 'shadow-md shadow-black/10' : ''}`}
      >
        <a href="#top" aria-label="Emilio Gappa, back to top" className="group press relative mr-1 block h-9 w-9 shrink-0 rounded-full">
          {/* Rotating the ring by 180° swaps the gradient's ends. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full transition-transform duration-500 ease-out group-hover:rotate-180"
            style={{ background: 'var(--accent-grad)' }}
          />
          <span className="absolute inset-[2px] flex items-center justify-center rounded-full bg-bg">
            <span className="display text-[12px] tracking-[-0.04em] transition-transform duration-300 group-hover:scale-110">EG</span>
          </span>
        </a>
        <Divider />
        <ul className="flex items-center">
          {LINKS.map((l) => {
            const on = active === l.id;
            return (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  aria-current={on ? 'true' : undefined}
                  className={`press block rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm ${on ? 'bg-stroke/50 text-text' : 'text-muted hover:bg-stroke/50 hover:text-text'}`}
                >
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>
        <Divider />
        <a
          href="#say-hi"
          data-ring={active === 'say-hi' ? 'on' : undefined}
          className="ring-accent press ml-1 block rounded-full px-3 py-1.5 text-xs text-text hover:bg-stroke/50 sm:px-4 sm:py-2 sm:text-sm"
        >
          Say hi <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
