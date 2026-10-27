'use client';

import { TerminalIcon } from './Icons';
import { openTerminal } from './TerminalHost';

export function TerminalButton({ className = '', icon = false }: { className?: string; icon?: boolean }) {
  if (icon)
    return (
      <button type="button" onClick={openTerminal} aria-label="Open the terminal (press /)" title="Terminal · press /" className={`press block text-body hover:text-text ${className}`}>
        <TerminalIcon className="h-6 w-6" />
      </button>
    );
  return (
    <button type="button" onClick={openTerminal} className={`text-sm text-muted transition-colors hover:text-text ${className}`}>
      Press <kbd className="mx-0.5 rounded border border-stroke-strong px-1.5 py-0.5 font-mono text-[10px] text-text">/</kbd> for the terminal
    </button>
  );
}
