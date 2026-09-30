// Framework-free core of the /api/ask endpoint so it can be unit-tested with a mocked fetch.
import { search } from './bm25.mjs';

export const LIMITS = {
  maxQuestion: 300,          // characters
  maxBody: 2048,             // bytes of request body we are willing to parse
  topK: 6,                   // passages sent to Jev
  passageChars: 600,         // per passage, caps the input tokens (and therefore the cost) per call
  timeoutMs: 4000,
  ratePerMinute: 6,
  ratePerHour: 40,
  maxTrackedIps: 5000,
};

export const JEV_URL = 'https://openrouter.ai/api/alpha/decisions';
export const JEV_MODEL = 'typesafe/jev-1.13';

const ALLOWED = [/^https:\/\/gappa\.me$/, /^http:\/\/localhost(:\d+)?$/];
export const originAllowed = (o) => !!o && ALLOWED.some((re) => re.test(o));

export function corsHeaders(origin) {
  const h = { Vary: 'Origin', 'Cache-Control': 'no-store' };
  if (originAllowed(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

// ---- per-IP rate limit, in memory. Per serverless instance only: the real hard cap is the
// spending limit on the OpenRouter key. This just stops a single client hammering one instance.
export function createRateLimiter({ perMinute = LIMITS.ratePerMinute, perHour = LIMITS.ratePerHour, maxIps = LIMITS.maxTrackedIps } = {}) {
  const hits = new Map(); // ip -> number[] (timestamps, ms)
  return function check(ip, now = Date.now()) {
    const arr = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
    const lastMin = arr.filter((t) => now - t < 60_000).length;
    if (lastMin >= perMinute || arr.length >= perHour) {
      hits.set(ip, arr);
      const oldest = lastMin >= perMinute ? arr.filter((t) => now - t < 60_000)[0] + 60_000 : arr[0] + 3600_000;
      return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest - now) / 1000)) };
    }
    arr.push(now);
    hits.delete(ip); hits.set(ip, arr);            // refresh insertion order
    if (hits.size > maxIps) hits.delete(hits.keys().next().value); // evict least recently seen
    return { ok: true };
  };
}

export function validateQuestion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'body must be a JSON object' };
  const q = body.question;
  if (typeof q !== 'string') return { error: 'question must be a string' };
  const question = q.replace(/\s+/g, ' ').trim();
  if (!question) return { error: 'question is empty' };
  if (question.length > LIMITS.maxQuestion) return { error: `question is longer than ${LIMITS.maxQuestion} characters` };
  return { question };
}

/** Build the typed questions for Jev from server-side retrieved passages. */
export function buildDecisionRequest(question, hits, projects) {
  const passages = {};
  const passageCriteria = {};
  hits.forEach((h, i) => {
    const key = `p${i + 1}`;
    passages[key] = { project: h.chunk.repo, section: h.chunk.section, text: h.chunk.text.slice(0, LIMITS.passageChars) };
    passageCriteria[key] = `Passage ${key}, ${h.chunk.repo} / ${h.chunk.section}: the best single passage to answer with.`;
  });
  passageCriteria.none = 'None of the passages answer the question.';
  const projectCriteria = {};
  for (const p of projects) projectCriteria[p.id] = `${p.name}: ${p.pitch}`.slice(0, 220);
  projectCriteria.none = 'The question is not about any one project (general question about Emilio, or off topic).';
  return {
    model: JEV_MODEL,
    state: { question, passages },
    questions: {
      project: {
        type: 'choice',
        instructions: "Which of Emilio Gappa's projects is this question mainly about?",
        criteria: projectCriteria,
      },
      passage: {
        type: 'choice',
        instructions: 'Which passage best answers the question?',
        criteria: passageCriteria,
      },
      answerable: {
        type: 'noul',
        instructions: 'Do the passages contain enough information to answer the question?',
        criteria: { true: 'The passages state the answer.', false: 'The passages do not state the answer.' },
      },
    },
  };
}

/** Map Jev's answers back to a typed decision the front end can trust. Returns null if malformed. */
export function interpretAnswers(resp, hits, projects) {
  const a = resp && resp.answers;
  if (!a || a.project?.type !== 'choice' || a.passage?.type !== 'choice' || a.answerable?.type !== 'noul') return null;
  const ids = new Set(projects.map((p) => p.id));
  const project = ids.has(a.project.choice) ? a.project.choice : 'none';
  const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
  const byKey = {};
  hits.forEach((h, i) => { byKey[`p${i + 1}`] = h.chunk.id; });
  const probs = a.passage.probabilities && typeof a.passage.probabilities === 'object' ? a.passage.probabilities : {};
  const ranked = Object.keys(byKey)
    .map((k) => ({ k, p: num(probs[k]) }))
    .filter((x) => x.p >= 0.15 || x.k === a.passage.choice)
    .sort((x, y) => y.p - x.p);
  const passage_ids = a.passage.choice === 'none' && !ranked.length ? [] : ranked.map((x) => byKey[x.k]).slice(0, 3);
  const confidence = +num(a.project.confidence).toFixed(2);
  const answerable = num(a.answerable.noul) >= 0.5 && a.passage.choice !== 'none';
  const pp = a.project.probabilities && typeof a.project.probabilities === 'object' ? a.project.probabilities : {};
  // Choice picks one option; its per-option probabilities surface the runners-up.
  const also = [...ids]
    .filter((id) => id !== project && num(pp[id]) >= 0.1)
    .sort((x, y) => num(pp[y]) - num(pp[x]))
    .slice(0, 2)
    .map((id) => ({ project: id, p: +num(pp[id]).toFixed(2) }));
  return {
    project, passage_ids, confidence, answerable, also,
    probability: +num(a.project.probabilities?.[a.project.choice]).toFixed(2),
    model: typeof resp.model === 'string' ? resp.model.slice(0, 64) : JEV_MODEL,
  };
}

/**
 * req: { method, origin, ip, body (parsed JSON or string), rawLength }
 * deps: { index, projects, fetch, apiKey, limiter, now }
 * returns { status, headers, body }
 */
export async function handleAsk(req, deps) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(req.origin) };
  const reply = (status, body, extra = {}) => ({ status, headers: { ...headers, ...extra }, body });

  if (req.method === 'OPTIONS') {
    return originAllowed(req.origin) ? { status: 204, headers, body: null } : reply(403, { error: 'origin not allowed' });
  }
  if (req.method !== 'POST') return reply(405, { error: 'POST only' }, { Allow: 'POST, OPTIONS' });
  if (!originAllowed(req.origin)) return reply(403, { error: 'origin not allowed' });

  const limit = deps.limiter(req.ip || 'unknown', deps.now?.());
  if (!limit.ok) return reply(429, { error: 'rate limited' }, { 'Retry-After': String(limit.retryAfter) });

  if ((req.rawLength ?? 0) > LIMITS.maxBody) return reply(413, { error: 'request too large' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return reply(400, { error: 'invalid JSON' }); } }
  const v = validateQuestion(body);
  if (v.error) return reply(400, { error: v.error });

  if (!deps.apiKey) return reply(503, { error: 'endpoint not configured' });

  // Retrieval happens here, from our own index. Nothing passage-like is ever taken from the client.
  const hits = search(deps.index, v.question, LIMITS.topK);
  if (!hits.length) return reply(200, { project: 'none', passage_ids: [], confidence: 0, answerable: false, also: [], probability: 0, model: JEV_MODEL });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIMITS.timeoutMs);
  try {
    const r = await deps.fetch(JEV_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${deps.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gappa.me',
        'X-Title': 'gappa.me ask',
      },
      body: JSON.stringify(buildDecisionRequest(v.question, hits, deps.projects)),
    });
    if (!r.ok) return reply(502, { error: 'upstream error', upstream: r.status });
    const out = interpretAnswers(await r.json(), hits, deps.projects);
    if (!out) return reply(502, { error: 'unexpected upstream response' });
    return reply(200, out);
  } catch (e) {
    return e && e.name === 'AbortError' ? reply(504, { error: 'upstream timeout' }) : reply(502, { error: 'upstream failure' });
  } finally {
    clearTimeout(timer);
  }
}
