// Thin wrapper over public/analytics.js (cookieless PostHog, only on gappa.me).
declare global {
  interface Window { gmTrack?: (event: string, props?: Record<string, unknown>) => void }
}

export function track(event: string, props?: Record<string, unknown>) {
  try { window.gmTrack?.(event, props); } catch { /* analytics never breaks the page */ }
}
