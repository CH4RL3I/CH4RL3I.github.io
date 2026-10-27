'use client';

import { openTerminal } from './TerminalHost';

export function TerminalButton({ className = '' }: { className?: string }) {
  return (
    <button type="button" onClick={openTerminal} className={`text-sm text-muted transition-colors hover:text-text ${className}`}>
      Press <kbd className="mx-0.5 rounded border border-stroke-strong px-1.5 py-0.5 font-mono text-[10px] text-text">/</kbd> for the terminal
    </button>
  );
}
