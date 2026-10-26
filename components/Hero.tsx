'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { site } from '@/content/site';
import { useIntroDone } from './AppShell';
import { DensityField } from './DensityField';

gsap.registerPlugin(useGSAP);

const { hero } = site;

function RoleLine() {
  const [i, setI] = useState(0);
  const [cycle, setCycle] = useState(false);

  useEffect(() => {
    // Reduced motion: the line stays on the first role (no auto-updating text).
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setCycle(true);
    const id = setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % hero.roles.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const r = hero.roles[i];
  const all = hero.roles.map((x) => x.word.toLowerCase());
  const spoken = `A ${all.slice(0, -1).join(', ')} and ${all[all.length - 1]} based in ${hero.place}.`;
  return (
    <p className="blur-in mb-10 text-lg text-muted md:text-xl lg:text-2xl">
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true">
        <span key={i} className={cycle ? 'role-in' : undefined}>
          {r.article} <span className="display font-medium text-text">{r.word}</span>
        </span>{' '}
        based in {hero.place}.
      </span>
    </p>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const introDone = useIntroDone();

  useGSAP(
    () => {
      if (!introDone) return;
      const html = document.documentElement;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || html.classList.contains('late')) {
        html.classList.add('hero-go');
        return;
      }
      gsap.set('.name-reveal', { opacity: 0, y: 50 });
      gsap.set('.blur-in', { opacity: 0, y: 20, filter: 'blur(10px)' });
      html.classList.add('hero-go');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.name-reveal', { opacity: 1, y: 0, duration: 1.2 }, 0.1).to(
        '.blur-in',
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.1, clearProps: 'filter' },
        0.3,
      );
    },
    { scope: root, dependencies: [introDone] },
  );

  return (
    <section id="top" ref={root} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <DensityField />
        {/* A soft scrim keeps the text readable over the curves; the fade hands over to the page. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_48%,rgba(10,10,10,0.82)_0%,rgba(10,10,10,0.45)_55%,rgba(10,10,10,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-bg to-transparent" />
      </div>

      <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
        <p className="blur-in label mb-8">{hero.eyebrow}</p>
        <h1 className="name-reveal display mb-6 text-[3.6rem] leading-[0.9] tracking-[-0.05em] text-text sm:text-7xl md:text-8xl lg:text-9xl">
          Emilio Gappa
        </h1>
        <RoleLine />
        <p className="blur-in mb-12 max-w-md text-sm leading-relaxed text-muted md:text-base">{hero.bio}</p>
        <div className="blur-in flex flex-wrap items-center justify-center gap-3">
          <a href="#work" className="ring-accent press rounded-full bg-text px-7 py-3.5 text-sm text-bg hover:scale-105">
            See work
          </a>
          <a href="#ask" className="ring-accent press rounded-full border-2 border-stroke bg-bg px-7 py-3.5 text-sm text-text hover:scale-105">
            Ask my portfolio
          </a>
        </div>
      </div>

      <a
        href="https://github.com/CH4RL3I/fearcurve"
        target="_blank"
        rel="noopener"
        className="blur-in label absolute bottom-7 left-4 z-10 hidden text-muted/80 transition-colors hover:text-text sm:left-8 sm:block"
      >
        fig. 1 · implied density, after fearcurve <span aria-hidden="true">↗</span>
      </a>

      <div className="blur-in absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3" aria-hidden="true">
        <span className="label">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-stroke">
          <span className="scroll-dot absolute -left-px top-0 h-1.5 w-[3px] rounded-full bg-text/70" />
        </span>
      </div>
    </section>
  );
}
