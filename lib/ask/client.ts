// Browser side of `ask`, shared by the Ask section and the terminal.
import type { AskAnswer, AskSource } from './contract';

export const MAX_QUESTION = 300;
const TIMEOUT_MS = 12_000;

export type AskResult =
  | { kind: 'answer'; data: AskAnswer }
  | { kind: 'rate-limited'; retryAfter: number }
  | { kind: 'invalid'; message: string }
  | { kind: 'unavailable' };

const isStr = (x: unknown): x is string => typeof x === 'string';
// Links in an answer only ever point to his repos or this site.
const safeUrl = (u: string) => /^https:\/\/(github\.com\/CH4RL3I\/|gappa\.me\/)/.test(u);

function clean(d: unknown): AskAnswer | null {
  if (!d || typeof d !== 'object') return null;
  const o = d as Record<string, unknown>;
  if (!isStr(o.answer) || !Array.isArray(o.sources) || typeof o.answerable !== 'boolean') return null;
  const sources: AskSource[] = o.sources
    .filter((s): s is AskSource => !!s && typeof s === 'object' && typeof s.n === 'number' && isStr(s.id) && isStr(s.repo) && isStr(s.section) && isStr(s.url) && safeUrl(s.url))
    .slice(0, 6)
    .map((s) => ({ n: s.n, id: s.id.slice(0, 120), repo: s.repo.slice(0, 64), section: s.section.slice(0, 120), url: s.url }));
  return { answer: o.answer.slice(0, 1200), sources, answerable: o.answerable, model: isStr(o.model) ? o.model.slice(0, 48) : 'gemini' };
}

export async function askServer(question: string): Promise<AskResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: ctrl.signal,
    });
    if (r.status === 429) return { kind: 'rate-limited', retryAfter: Number(r.headers.get('Retry-After')) || 60 };
    if (r.status === 400 || r.status === 413) {
      const e = await r.json().catch(() => null);
      return { kind: 'invalid', message: isStr(e?.error) ? e.error.slice(0, 120) : 'That question could not be sent.' };
    }
    if (!r.ok) return { kind: 'unavailable' };
    const data = clean(await r.json());
    return data ? { kind: 'answer', data } : { kind: 'unavailable' };
  } catch {
    return { kind: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

/** Splits "text [1] more [2]" into text runs and citation numbers. */
export function splitCitations(answer: string): (string | number)[] {
  const out: (string | number)[] = [];
  const re = /\[(\d{1,2})\]/g;
  let last = 0;
  for (let m = re.exec(answer); m; m = re.exec(answer)) {
    if (m.index > last) out.push(answer.slice(last, m.index));
    out.push(Number(m[1]));
    last = m.index + m[0].length;
  }
  if (last < answer.length) out.push(answer.slice(last));
  return out;
}

// ---------- local fallback: BM25 over the same index, in the browser ----------
export type Chunk = { id: string; repo: string; section: string; url: string; text: string };
type Index = { chunks: Chunk[] } & Record<string, unknown>;
let indexP: Promise<Index | null> | null = null;

export function loadIndex(): Promise<Index | null> {
  indexP ??= fetch('/data/index.json', { signal: AbortSignal.timeout(8000) })
    .then((r) => (r.ok ? (r.json() as Promise<Index>) : null))
    .catch(() => null)
    .then((i) => { if (!i) indexP = null; return i; }); // a failed load may be retried later
  return indexP;
}

/** Closest passages by local BM25. Always settles: null if the index or the ranker can't load. */
export async function localPassages(question: string, k = 3): Promise<{ chunk: Chunk; score: number }[] | null> {
  try {
    const [index, bm25] = await Promise.all([loadIndex(), import('@/lib/bm25.mjs')]);
    if (!index) return null;
    const hits = bm25.search(index, question, 6) as { chunk: Chunk; score: number }[];
    if (!hits.length) return [];
    return hits.filter((h) => h.score >= hits[0].score * 0.65).slice(0, k);
  } catch {
    return null;
  }
}

/** A readable window of a passage around the first matching term. */
export function excerpt(text: string, question: string, n = 280): string {
  const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const flat = text.replace(/\s*\n\s*/g, ' ').trim();
  if (flat.length <= n) return flat;
  const low = flat.toLowerCase();
  let at = 0;
  for (const t of terms) {
    const i = low.indexOf(t);
    if (i > 0) { at = Math.max(0, i - 80); break; }
  }
  let s = flat.slice(at, at + n);
  if (at > 0) s = '…' + s.replace(/^\S*\s/, '');
  return s.replace(/\s+\S*$/, '') + '…';
}
