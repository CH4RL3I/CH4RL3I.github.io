// Mock of POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
// with the same response envelope as the live API (candidates[0].content.parts[].text holds the JSON).
export function geminiEnvelope(obj) {
  return {
    candidates: [{ content: { role: 'model', parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 60, totalTokenCount: 960 },
  };
}

export const defaultReply = { on_topic: true, answerable: true, answer: 'Touchdown estimates pose with a Kalman filter [1]. It reaches high landing rates in simulation [2].', cited: [1, 2] };

/** reply: object (or raw string) the model "writes"; raw: whole response body, bypassing the envelope. */
export function mockFetch({ status = 200, delay = 0, capture, reply = defaultReply, raw } = {}) {
  return async (url, init) => {
    capture?.({ url, init, body: JSON.parse(init.body) });
    if (delay) await new Promise((res, rej) => {
      const t = setTimeout(res, delay);
      init.signal?.addEventListener('abort', () => { clearTimeout(t); const e = new Error('aborted'); e.name = 'AbortError'; rej(e); });
    });
    return { ok: status >= 200 && status < 300, status, json: async () => raw ?? geminiEnvelope(reply) };
  };
}
