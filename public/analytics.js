// Explicit portfolio events sent to PostHog (EU cloud) with in-memory persistence.
import { ANALYTICS_HOSTS } from './site-config.js';
const KEY = 'phc_keoWJ4yTHvDzBLyxuShjHAoLjJg3innUhnQxiPCxuQba';
const SRC = 'https://cdn.jsdelivr.net/npm/posthog-js@1.435.8/dist/module.js';

const CASE_STUDIES = new Map([
  ['/work/gonder-operations', 'gonder-operations'],
  ['/work/co-driver', 'co-driver'],
]);
const PROJECTS = new Set(CASE_STUDIES.values());
const OUTCOMES = new Set(['answer', 'fallback', 'search', 'no_match', 'off_topic', 'rate_limited', 'error']);
const COMMANDS = new Set(['help', 'whoami', 'ls', 'open', 'cat', 'ask', 'contact', 'clear', 'sudo', 'exit']);
const CONTACT_CHANNELS = new Set(['email', 'linkedin']);

let ph = null;
const queue = [];

// Keep analytics fields finite, including when an older cached client calls this script.
function eventProperties(event, props) {
  switch (event) {
    case 'cv_download_click': return {};
    case 'case_study_open':
    case 'demo_start':
    case 'demo_complete':
      return PROJECTS.has(props?.project) ? { project: props.project } : null;
    case 'contact_click':
      return CONTACT_CHANNELS.has(props?.channel) ? { channel: props.channel } : null;
    case 'ask_outcome':
      return OUTCOMES.has(props?.outcome) && (props.via === 'section' || props.via === 'terminal')
        ? { outcome: props.outcome, via: props.via } : null;
    case 'command': return COMMANDS.has(props?.name) ? { name: props.name } : null;
    default: return null;
  }
}

function track(event, props) {
  const properties = eventProperties(event, props);
  if (!properties) return;
  if (ph) ph.capture(event, properties);
  else if (queue.length < 50) queue.push([event, properties]);
}

function trackLink(event) {
  if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
  const link = event.composedPath().find((element) => element instanceof HTMLAnchorElement);
  if (!link?.hasAttribute('href')) return;

  if (link.protocol === 'https:' && ANALYTICS_HOSTS.includes(link.hostname) && link.pathname === '/emilio-gappa-cv.pdf') {
    track('cv_download_click');
    return;
  }

  const channel = link.dataset.trackContact;
  if (CONTACT_CHANNELS.has(channel)) track('contact_click', { channel });
  else if (link.protocol === 'mailto:') track('contact_click', { channel: 'email' });
  else if (link.protocol === 'https:' && ['linkedin.com', 'www.linkedin.com'].includes(link.hostname)
    && link.pathname.replace(/\/$/, '') === '/in/emilio-gappa-44448223a') {
    track('contact_click', { channel: 'linkedin' });
  }
}

if (ANALYTICS_HOSTS.includes(location.hostname) && navigator.doNotTrack !== '1' && window.doNotTrack !== '1') {
  window.gmTrack = track;
  document.addEventListener('click', trackLink);
  document.addEventListener('auxclick', trackLink);
  const project = CASE_STUDIES.get(location.pathname.replace(/\/$/, ''));
  if (project) track('case_study_open', { project });

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
