'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader } from './Loader';
import { TerminalHost } from './TerminalHost';

type Phase = 'unknown' | 'loading' | 'done';
const IntroContext = createContext<boolean>(false);

/** True once the intro loader is gone (or was skipped); the hero entrance waits for it. */
export const useIntroDone = () => useContext(IntroContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('unknown');

  // The head script already decided; read its verdict before the first client paint.
  useLayoutEffect(() => {
    setPhase(document.documentElement.getAttribute('data-loader') === 'on' ? 'loading' : 'done');
  }, []);

  const finish = useCallback(() => {
    try { sessionStorage.setItem('gm-intro', '1'); } catch { /* private mode: loader may show again, harmless */ }
    // Switching the attribute lets the CSS transition fade the page in under the fading loader.
    document.documentElement.setAttribute('data-loader', 'done');
    setPhase('done');
  }, []);

  return (
    <IntroContext.Provider value={phase === 'done'}>
      <AnimatePresence>{phase === 'loading' && <Loader key="loader" onComplete={finish} />}</AnimatePresence>
      <div className="page">{children}</div>
      <TerminalHost />
    </IntroContext.Provider>
  );
}
