// Local harness: runs the real handler on http://localhost:8787/api/ask.
//   MOCK_JEV=1 node dev-server.mjs          (Jev mocked, no key needed)
//   OPENROUTER_API_KEY=... node dev-server.mjs   (live Jev)
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { handleAsk, createRateLimiter } from './lib/ask-core.mjs';
import { mockFetch } from './test/mock-jev.mjs';

const load = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
const index = load('./index.json');
const projects = load('./projects.json');
const limiter = createRateLimiter();
const mock = process.env.MOCK_JEV === '1';
const delay = Number(process.env.MOCK_DELAY || 0);

createServer(async (req, res) => {
  if (!req.url.startsWith('/api/ask')) { res.writeHead(404).end(); return; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  const out = await handleAsk(
    { method: req.method, origin: req.headers.origin, ip: req.socket.remoteAddress, body: raw || undefined, rawLength: raw.length },
    { index, projects, limiter, fetch: mock ? mockFetch({ delay }) : fetch, apiKey: mock ? 'mock' : process.env.OPENROUTER_API_KEY },
  );
  res.writeHead(out.status, out.headers);
  res.end(out.body === null ? undefined : JSON.stringify(out.body));
}).listen(8787, () => console.log(`ask endpoint on http://localhost:8787/api/ask ${mock ? '(mock Jev)' : ''}`));
