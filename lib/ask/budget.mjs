const DAY_MS = 86_400_000;
const DEFAULT_DAILY_LIMIT = 1000;
const STORE_TIMEOUT_MS = 1500;

// One atomic operation across all server instances. Denied requests leave the count unchanged.
const RESERVE = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count >= tonumber(ARGV[1]) then return 0 end
if count == 0 then
  redis.call('SET', KEYS[1], 1, 'EX', 172800)
else
  redis.call('INCR', KEYS[1])
end
return 1`;

// The Vercel Marketplace Upstash integration injects KV_REST_API_*. Use one complete pair and never
// mix a URL from one pair with a token from the other; a partly set UPSTASH_* pair fails closed.
function restCredentials(env) {
  const pair = (urlName, tokenName) => [env[urlName]?.trim(), env[tokenName]?.trim()];
  const upstash = pair('UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN');
  return upstash[0] || upstash[1] ? upstash : pair('KV_REST_API_URL', 'KV_REST_API_TOKEN');
}

/** Returns null to disable generation or undefined for local development without the shared budget. */
export function askBudgetConfig(env) {
  const [endpoint, token] = restCredentials(env);
  if (!endpoint && !token && env.NODE_ENV === 'development' && !env.VERCEL) return undefined;
  if (!endpoint || !token) return null;

  const limit = Number(env.ASK_DAILY_REQUEST_LIMIT?.trim() || DEFAULT_DAILY_LIMIT);
  if (!Number.isSafeInteger(limit) || limit < 1) return null;

  let url;
  try { url = new URL(endpoint); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;

  const environment = env.VERCEL_ENV || (env.NODE_ENV === 'development' ? 'development' : 'production');
  return { url: url.href, token, limit, keyPrefix: `gappa-me:ask:${environment}:day` };
}

export function createGenerationBudget({ url, token, limit, keyPrefix }, request = fetch) {
  return async function reserve(now = Date.now()) {
    const day = new Date(now).toISOString().slice(0, 10);
    const response = await request(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', RESERVE, '1', `${keyPrefix}:${day}`, String(limit)]),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('generation budget unavailable');
    const { result } = await response.json();
    if (result === 1) return { ok: true };
    if (result === 0) return { ok: false, retryAfter: Math.ceil((DAY_MS - (now % DAY_MS)) / 1000) };
    throw new Error('unexpected generation budget response');
  };
}
