// Thin Next.js adapter around lib/ask/core.mjs; all logic and tests live in the core.
import index from '@/data/index.json';
import { createRateLimiter, handleAsk, LIMITS } from '@/lib/ask/core.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const limiter = createRateLimiter();

async function run(request: Request): Promise<Response> {
  const h = request.headers;
  const ip = h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  let body: string | undefined;
  let rawLength = Number(h.get('content-length') ?? 0) || 0;
  // Only read the body when it can fit; a declared oversize body is answered 413 without reading it.
  if (request.method === 'POST' && rawLength <= LIMITS.maxBody) {
    body = await request.text();
    rawLength = new TextEncoder().encode(body).length;
  }
  const out = await handleAsk(
    {
      method: request.method,
      origin: h.get('origin') ?? undefined,
      host: h.get('host') ?? undefined,
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
