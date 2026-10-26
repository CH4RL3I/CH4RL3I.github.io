'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const WORDS = ['Build', 'Measure', 'Ship'];
const COUNT_MS = 1300; // counter 000 → 100
const HOLD_MS = 200; //   then a short hold: about 1.5 s in all
const EASE = [0.4, 0, 0.2, 1] as const;

export function Loader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const t0 = performance.now();
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onComplete();
    };
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / COUNT_MS);
      setCount(Math.round(p * 100));
      setWord(Math.min(WORDS.length - 1, Math.floor(p * WORDS.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else hold = setTimeout(finish, HOLD_MS);
    };
    raf = requestAnimationFrame(tick);
    // Any key or click skips the intro.
    const skip = () => finish();
    addEventListener('keydown', skip);
    addEventListener('pointerdown', skip);
    return () => {
      cancelAnimationFrame(raf);
      if (hold) clearTimeout(hold);
      removeEventListener('keydown', skip);
      removeEventListener('pointerdown', skip);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-bg"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <motion.p
        className="label absolute left-8 top-8 md:left-12 md:top-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      >
        gappa.me
      </motion.p>

      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={WORDS[word]}
            className="display text-4xl text-text/80 md:text-6xl lg:text-7xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {WORDS[word]}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.p
        className="display absolute bottom-8 right-8 text-6xl tabular-nums tracking-[-0.05em] text-text md:bottom-12 md:right-12 md:text-8xl lg:text-9xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      >
        {String(count).padStart(3, '0')}
      </motion.p>

      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-stroke/50">
        <div
          className="h-full origin-left"
          style={{
            transform: `scaleX(${count / 100})`,
            background: 'var(--accent-grad)',
            boxShadow: '0 0 8px rgba(137, 170, 204, 0.35)',
          }}
        />
      </div>
    </motion.div>
  );
}
