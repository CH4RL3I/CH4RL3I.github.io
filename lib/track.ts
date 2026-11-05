// Thin wrapper over public/analytics.js.
declare global {
  interface Window { gmTrack?: (event: string, props?: Record<string, unknown>) => void }
}

export function track(event: string, props?: Record<string, unknown>) {
  try { window.gmTrack?.(event, props); } catch { /* analytics never breaks the page */ }
}

type AskOutcome = 'answer' | 'fallback' | 'search' | 'no_match' | 'off_topic' | 'rate_limited' | 'error';

export function trackAskOutcome(outcome: AskOutcome, via: 'section' | 'terminal') {
  track('ask_outcome', { outcome, via });
}
