// Thin Next.js adapter around lib/ask/core.mjs; all logic and tests live in the core.
import index from '@/data/index.json';
import { createRateLimiter, handleAsk, LIMITS, originAllowed, readBodyCapped } from '@/lib/ask/core.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const limiter = createRateLimiter();

async function run(request: Request): Promise<Response> {
  const h = request.headers;
  const ip = h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const origin = h.get('origin') ?? undefined;
  const host = h.get('host') ?? undefined;
  let body: string | undefined;
  let rawLength = Number(h.get('content-length') ?? 0) || 0;
  // Read the body only for allowed origins, and never more than the limit: a declared oversize body
  // is refused unread, and a missing or lying content-length is caught while streaming.
  if (request.method === 'POST' && originAllowed(origin, host) && rawLength <= LIMITS.maxBody) {
    const read = await readBodyCapped(request.body, LIMITS.maxBody);
    if ('text' in read) {
      body = read.text;
      rawLength = new TextEncoder().encode(body).length;
    } else if (read.error === 'too-large') {
      rawLength = LIMITS.maxBody + 1;
    } else {
      body = ''; // timed out or broken upload: answered as invalid JSON
    }
  }
  const out = await handleAsk(
    {
      method: request.method,
      origin,
      host,
      ip,
      body,
      rawLength,
    },
    {
      index,
      fetch,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || undefined,
      limiter,
    },
  );
  return new Response(out.body === null ? null : JSON.stringify(out.body), { status: out.status, headers: out.headers });
}

export const POST = run;
export const OPTIONS = run;
