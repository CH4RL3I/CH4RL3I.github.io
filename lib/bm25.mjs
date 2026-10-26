// BM25 over a prebuilt JSON index. Runs unchanged in the browser and in Node.
// Canonical copy lives here; scripts/build-index.mjs mirrors it to api-worker/lib/.

export const K1 = 1.4;
export const B = 0.75;

const STOP = new Set(('a an and are as at be been but by can did do does for from had has have he her his how i in is it its ' +
  'me my of on or our she so than that the their them then there these they this to us was we were what when where which who ' +
  'whom why will with would you your about any also into just more most not only other some such too very').split(' '));

/** Lowercase, split on non-alphanumerics, drop stopwords, strip simple plural/-ing/-ed suffixes. */
export function tokenize(text) {
  const out = [];
  for (const raw of String(text).toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw || STOP.has(raw)) continue;
    out.push(stem(raw));
  }
  return out;
}

export function stem(w) {
  if (w.length <= 3 || /^\d+$/.test(w)) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 4 && /(s|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/** Turn chunks [{id, repo, section, text, ...}] into an index with precomputed tf/idf stats. */
export function buildIndex(chunks) {
  const df = {};
  let total = 0;
  const docs = chunks.map((c) => {
    // heading + repo get double weight by being repeated in the token stream
    const toks = tokenize(`${c.repo} ${c.section} ${c.section} ${c.text}`);
    const tf = {};
    for (const t of toks) tf[t] = (tf[t] || 0) + 1;
    for (const t of Object.keys(tf)) df[t] = (df[t] || 0) + 1;
    total += toks.length;
    return { ...c, len: toks.length, tf };
  });
  const N = docs.length;
  const idf = {};
  for (const [t, n] of Object.entries(df)) idf[t] = Math.log(1 + (N - n + 0.5) / (n + 0.5));
  return { version: 1, N, avgdl: +(total / Math.max(N, 1)).toFixed(3), idf: roundMap(idf), chunks: docs };
}

function roundMap(m) {
  const o = {};
  for (const k of Object.keys(m)) o[k] = +m[k].toFixed(4);
  return o;
}

/** Rank chunks for a query. Returns [{chunk, score}] best first, score > 0 only. */
export function search(index, query, k = 6) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const out = [];
  for (const c of index.chunks) {
    let score = 0;
    for (const t of terms) {
      const f = c.tf[t];
      if (!f) continue;
      const idf = index.idf[t] ?? 0;
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * c.len) / index.avgdl)));
    }
    if (score > 0) out.push({ chunk: c, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, k);
}
