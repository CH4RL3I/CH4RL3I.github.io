'use client';

import { openTerminal } from './TerminalHost';

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-stroke px-4 py-8 text-xs text-muted sm:flex-row sm:px-6">
      <p>© 2026 Emilio Gappa</p>
      <div className="flex items-center gap-5">
        <a href="/privacy.html" className="transition-colors hover:text-text">
          Privacy
        </a>
        <button type="button" onClick={openTerminal} className="transition-colors hover:text-text">
          <span className="hidden sm:inline">
            Press <kbd className="rounded border border-stroke px-1.5 py-0.5 font-mono text-[10px] text-text">/</kbd> for the terminal
          </span>
          <span className="sm:hidden">Open the terminal</span>
        </button>
      </div>
    </footer>
  );
}
