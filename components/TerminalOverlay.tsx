'use client';

import { useEffect, useRef } from 'react';
import { mountTerminal } from '@/lib/terminal';
import './terminal.css';

// Opened from the keyboard many times a session, so it appears without animation.
export default function TerminalOverlay({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const before = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = 'hidden';
    // The page behind the dialog can't be focused or clicked while it is open.
    const page = document.querySelector<HTMLElement>('.page');
    page?.setAttribute('inert', '');
    const unmount = mountTerminal(el, { onClose });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = [...el.querySelectorAll<HTMLElement>('button, a[href], input')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || !el.contains(at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !el.contains(at))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      unmount();
      page?.removeAttribute('inert');
      document.removeEventListener('keydown', onKey);
      html.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div
      className="t-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={root} className="term" role="dialog" aria-modal="true" aria-labelledby="t-title">
        <div className="t-bar">
          <span id="t-title" className="t-title">emilio@gappa.me</span>
          <span className="t-hint">
            type <kbd>help</kbd> · <kbd>esc</kbd> to close
          </span>
          <button type="button" className="t-close" aria-label="Close the terminal" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="t-body">
          <div className="t-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Terminal output" />
          <form className="t-prompt" autoComplete="off" spellCheck={false}>
            <label htmlFor="t-cmd" className="sr-only">
              Command. Try help, ls, or ask followed by a question.
            </label>
            <span className="t-ps1" aria-hidden="true">$</span>
            <span className="t-field">
              <input
                id="t-cmd"
                className="t-cmd"
                type="text"
                enterKeyHint="send"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                placeholder="type a command, or tap one below"
              />
              <span className="t-caret" aria-hidden="true" />
            </span>
          </form>
        </div>
        <div className="t-chips" role="group" aria-label="Suggestions">
          <span className="t-chips-label">Try</span>
          <button type="button" className="t-chip" data-cmd="ls">ls</button>
          <button type="button" className="t-chip" data-cmd='ask "what has he built with computer vision?"'>ask &quot;what has he built with computer vision?&quot;</button>
          <button type="button" className="t-chip" data-cmd="cat touchdown">cat touchdown</button>
          <button type="button" className="t-chip" data-cmd="contact">contact</button>
        </div>
        <p className="t-status sr-only" role="status" />
      </div>
    </div>
  );
}
