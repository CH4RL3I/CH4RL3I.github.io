import { readFileSync } from 'node:fs';
import { handleAsk, createRateLimiter } from '../lib/ask-core.mjs';

const load = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
const index = load('index.json');
const projects = load('projects.json');
const limiter = createRateLimiter(); // per warm instance; see README

export default async function handler(req, res) {
  const raw = req.body === undefined ? '' : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const out = await handleAsk(
    { method: req.method, origin: req.headers.origin, ip, body: req.body, rawLength: Number(req.headers['content-length'] || raw.length) },
    { index, projects, fetch, apiKey: process.env.OPENROUTER_API_KEY, limiter },
  );
  for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  res.status(out.status);
  if (out.body === null) return res.end();
  res.send(JSON.stringify(out.body));
}
