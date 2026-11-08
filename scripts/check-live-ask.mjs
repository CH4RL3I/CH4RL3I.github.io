import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN } from '../public/site-config.js';

export const REPORT = 'https://github.com/CH4RL3I/footnote/blob/152acdd200898a39196d7711dc8f8cc3b4bdbe81/docs/evaluation-2026-10-31/README.md';
export const QUESTION = 'For Footnote’s 31 October 2026 development evaluation, give the exact correct counts out of 64 for retrieved and supplied evidence. Were these held-out questions?';

// Any count out of 64, so a wrong count next to a label is caught instead of ignored.
const COUNT = /\b(\d+)\s*(?:\/|out of|of)\s*64\b/gi;
const LABELS = { retrieved: /\bretriev\w*/gi, supplied: /\b(?:suppl\w*|oracle)\b/gi };
const EXPECTED = { retrieved: '38', supplied: '63' };
const QUALIFIED = [
  /\bre-?used\b/i,
  /\b(?:not|n['’]t|never|rather than|instead of)\b[^.!?]{0,40}\bheld[- ]?out\b/i,
  /\bno\b[^.!?]{0,60}\bdevelopment\b/i,
];
const CONTRADICTED = [/(?:^|[.!?]\s+)yes\b/i, /\b(?:were|are|was)\s+(?:indeed\s+|truly\s+|genuinely\s+)?held[- ]?out\b/i];

const spans = (text, pattern) => [...text.matchAll(pattern)].map((m) => ({ value: (m[1] ?? m[0]).toLowerCase(), start: m.index, end: m.index + m[0].length }));
const gap = (a, b) => Math.max(0, a.start - b.end, b.start - a.end);

/** The [condition, count] pairs one sentence states. Every count in a labelled sentence is checked or the sentence fails; counts in unlabelled sentences are ignored. */
function sentenceAssignments(sentence) {
  const counts = spans(sentence, COUNT);
  const labels = { retrieved: spans(sentence, LABELS.retrieved), supplied: spans(sentence, LABELS.supplied) };
  const kinds = Object.keys(labels).filter((kind) => labels[kind].length);
  if (!counts.length || !kinds.length) return [];
  const distance = (kind, count) => Math.min(...labels[kind].map((label) => gap(label, count)));

  // One condition named: every count in the sentence is credited to it, so a stray count fails safe.
  if (kinds.length === 1) return counts.map((count) => [kinds[0], count.value]);
  // Both conditions named but not exactly two counts: no pairing is reliable, so the sentence fails.
  if (counts.length !== 2) return kinds.map((kind) => [kind, 'ambiguous']);
  if (/\brespectively\b/i.test(sentence)) {
    const [first, second] = [...kinds].sort((a, b) => labels[a][0].start - labels[b][0].start);
    return [[first, counts[0].value], [second, counts[1].value]];
  }
  let best;
  for (const r of counts) {
    for (const s of counts) {
      if (r === s) continue;
      const cost = distance('retrieved', r) + distance('supplied', s);
      if (!best || cost < best.cost) best = { cost, pairs: [['retrieved', r.value], ['supplied', s.value]] };
    }
  }
  return best.pairs;
}

/** True only if both conditions are stated and every stated count is right: 38/64 retrieved, 63/64 supplied. */
export function countsMatchConditions(answer) {
  const stated = { retrieved: [], supplied: [] };
  for (const sentence of answer.split(/(?<=[.!?])\s+/)) {
    for (const [kind, value] of sentenceAssignments(sentence)) stated[kind].push(value);
  }
  return Object.entries(EXPECTED).every(([kind, value]) => stated[kind].length > 0 && stated[kind].every((v) => v === value));
}

/** Throws with a reason unless the Ask response is the expected cited answer. Pure, so tests run offline. */
export function verifyAnswer(data) {
  if (!data?.answerable || typeof data.answer !== 'string' || !Array.isArray(data.sources)) {
    throw new Error('Ask did not return a generated answer with sources.');
  }
  const { answer } = data;
  const markers = [...answer.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
  const sources = new Map(data.sources.map((source) => [source.n, source.url]));
  if (!markers.length || markers.some((n) => !sources.has(n)) || !markers.some((n) => sources.get(n) === REPORT)) {
    throw new Error('Ask did not cite the pinned evaluation report in its answer.');
  }
  const found = new Set(spans(answer, COUNT).map((c) => c.value));
  if (!found.has('38') || !found.has('63')) {
    throw new Error('Ask did not return both expected development evaluation counts.');
  }
  if (!countsMatchConditions(answer)) {
    throw new Error('Ask did not tie 38/64 to retrieved and 63/64 to supplied evidence.');
  }
  if (CONTRADICTED.some((p) => p.test(answer)) || !QUALIFIED.some((p) => p.test(answer))) {
    throw new Error('Ask did not identify the questions as reused development data.');
  }
}

async function check() {
  const response = await fetch(`${SITE_ORIGIN}/api/ask`, {
    method: 'POST',
    headers: { Origin: SITE_ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: QUESTION }),
    redirect: 'error',
    signal: AbortSignal.timeout(18_000),
  });
  if (!response.ok) throw new Error(`Ask returned HTTP ${response.status}.`);
  const data = await response.json();
  try {
    verifyAnswer(data);
  } catch (error) {
    error.message += `\nAnswer was: ${typeof data?.answer === 'string' ? data.answer : JSON.stringify(data)}`;
    throw error;
  }

  const source = await fetch(REPORT, { redirect: 'error', signal: AbortSignal.timeout(12_000) });
  await source.body?.cancel();
  if (!source.ok) throw new Error(`The pinned evaluation source returned HTTP ${source.status}.`);
  console.log(`Ask verified on ${SITE_ORIGIN}: 38/64 retrieved, 63/64 supplied, and a working citation.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await check();
  } catch (error) {
    console.error(`Live Ask check failed. ${error.message}`);
    process.exitCode = 1;
  }
}
