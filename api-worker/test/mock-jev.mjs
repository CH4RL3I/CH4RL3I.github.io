// Mock of POST https://openrouter.ai/api/alpha/decisions, same response shape as the live API.
export function mockJevResponse(reqBody, { overrides = {} } = {}) {
  const q = reqBody.questions;
  const pKeys = Object.keys(q.passage.criteria).filter((k) => k !== 'none');
  const first = pKeys[0];
  const projectOf = reqBody.state.passages[first]?.project;
  const projOptions = Object.keys(q.project.criteria);
  const choice = projOptions.includes(projectOf) ? projectOf : 'none';
  const projProbs = Object.fromEntries(projOptions.map((k) => [k, 0]));
  projProbs[choice] = 0.86;
  projProbs.none = choice === 'none' ? 1 : 0.14;
  const passProbs = Object.fromEntries(Object.keys(q.passage.criteria).map((k) => [k, 0]));
  passProbs[first] = 0.7;
  if (pKeys[1]) passProbs[pKeys[1]] = 0.3;
  return {
    id: 'gen-dec-mock',
    model: 'typesafe/jev-1.13-20260917',
    provider: 'TypeSafe',
    answers: {
      project: { type: 'choice', choice, probabilities: projProbs, confidence: 0.81 },
      passage: { type: 'choice', choice: first, probabilities: passProbs, confidence: 0.6 },
      answerable: { type: 'noul', noul: 0.93 },
      ...overrides,
    },
    usage: { input_tokens: 900, output_tokens: 40, cost: 3.6e-5 },
  };
}

export function mockFetch({ status = 200, delay = 0, capture, overrides, raw } = {}) {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    capture?.({ url, init, body });
    if (delay) await new Promise((res, rej) => {
      const t = setTimeout(res, delay);
      init.signal?.addEventListener('abort', () => { clearTimeout(t); const e = new Error('aborted'); e.name = 'AbortError'; rej(e); });
    });
    return { ok: status >= 200 && status < 300, status, json: async () => raw ?? mockJevResponse(body, { overrides }) };
  };
}
