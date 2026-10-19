// PostHog (EU cloud), cookieless: nothing is stored in the browser, so no consent banner is needed.
// Loaded lazily; if it fails or is blocked, track() is a no-op and the site works the same.
const KEY = 'phc_keoWJ4yTHvDzBLyxuShjHAoLjJg3innUhnQxiPCxuQba';
const SRC = 'https://cdn.jsdelivr.net/npm/posthog-js@1.435.8/dist/module.js';

let ph = null;
const queue = [];

export function track(event, props = {}) {
  if (ph) ph.capture(event, props);
  else if (queue.length < 50) queue.push([event, props]);
}

if (location.hostname === 'gappa.me') {
  import(SRC).then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: 'https://eu.i.posthog.com',
      persistence: 'memory',
      person_profiles: 'identified_only',
      respect_dnt: true,
      autocapture: false,
      capture_pageview: true,
      disable_session_recording: true,
    });
    ph = posthog;
    for (const [e, p] of queue.splice(0)) ph.capture(e, p);
  }).catch(() => {});
}
