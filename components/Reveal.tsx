'use client';

import { useEffect, useRef, useState } from 'react';

/** Fades and un-blurs its content the first time it scrolls into view. */
export function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'header';
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    document.documentElement.classList.add('reveal-ready');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-shown={shown}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
