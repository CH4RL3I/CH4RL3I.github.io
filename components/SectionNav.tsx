'use client';

import { useEffect, useState } from 'react';

export const SECTIONS = [
  ['about', 'About'],
  ['work', 'Work'],
  ['resume', 'Resume'],
  ['ask', 'Ask'],
  ['say-hi', 'Say hi'],
] as const;

type Id = (typeof SECTIONS)[number][0];

/** The left column's section list. The line of the section being read grows; that is the page's scroll feedback. */
export function SectionNav() {
  const [active, setActive] = useState<Id>('about');

  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = innerHeight * 0.35;
      let cur = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id;
      // At the very bottom the last section counts as read, even when it is too short to reach the line.
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = els[els.length - 1].id;
      setActive(cur as Id);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <nav aria-label="Sections" className="hidden lg:block">
      <ul className="mt-14 w-max [@media(max-height:760px)]:mt-8">
        {SECTIONS.map(([id, label]) => {
          const on = active === id;
          return (
            <li key={id}>
              <a href={`#${id}`} aria-current={on ? 'location' : undefined} data-on={on} className="group flex items-center py-2.5">
                <span
                  aria-hidden="true"
                  className="mr-4 h-px w-16 origin-left scale-x-50 bg-muted transition-[scale,background-color] duration-200 ease-out group-hover:scale-x-100 group-hover:bg-text group-focus-visible:scale-x-100 group-focus-visible:bg-text group-data-[on=true]:scale-x-100 group-data-[on=true]:bg-text motion-reduce:transition-none"
                />
                {/* The line is scaled, not resized, so the label is moved with it: both stay on the compositor. */}
                <span className="-translate-x-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-[translate,color] duration-200 ease-out group-hover:translate-x-0 group-hover:text-text group-focus-visible:translate-x-0 group-focus-visible:text-text group-data-[on=true]:translate-x-0 group-data-[on=true]:text-text motion-reduce:transition-none">
                  {label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
