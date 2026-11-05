'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// The terminal is an extra: its code loads only when someone opens it.
const TerminalOverlay = dynamic(() => import('./TerminalOverlay'), { ssr: false });

const OPEN_EVENT = 'gm:terminal';
export function openTerminal() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function typingIn(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export function TerminalHost({ answersEnabled }: { answersEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || typingIn(e.target)) return;
      e.preventDefault();
      show();
    };
    addEventListener('keydown', onKey);
    addEventListener(OPEN_EVENT, show);
    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener(OPEN_EVENT, show);
    };
  }, []);

  return open ? <TerminalOverlay onClose={close} answersEnabled={answersEnabled} /> : null;
}
