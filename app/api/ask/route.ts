// Thin Next.js adapter around lib/ask/core.mjs; all logic and tests live in the core.
import index from '@/data/index.json';
import { createRateLimiter, handleAsk, LIMITS, readBodyCapped } from '@/lib/ask/core.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const limiter = createRateLimiter();

async function run(request: Request): Promise<Response> {
  const h = request.headers;
  const ip = h.get('x-real-ip')?.trim() || h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const origin = h.get('origin') ?? undefined;
  const host = h.get('host') ?? undefined;
  // handleAsk calls this only after the origin and rate checks. A declared oversize body is refused
  // unread; a missing or lying content-length is caught while streaming.
  const readBody = async () => {
    const declared = Number(h.get('content-length') ?? 0) || 0;
    if (declared > LIMITS.maxBody) return { body: undefined, rawLength: declared };
    const read = await readBodyCapped(request.body, LIMITS.maxBody);
    if ('text' in read) return { body: read.text, rawLength: new TextEncoder().encode(read.text).length };
    if (read.error === 'too-large') return { body: undefined, rawLength: LIMITS.maxBody + 1 };
    return { body: '', rawLength: 0 }; // timed out or broken upload: answered as invalid JSON
  };
  const out = await handleAsk(
    {
      method: request.method,
      origin,
      host,
      ip,
      readBody,
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
