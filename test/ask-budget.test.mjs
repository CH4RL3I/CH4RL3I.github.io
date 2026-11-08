import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askBudgetConfig, createGenerationBudget } from '../lib/ask/budget.mjs';

const env = {
  NODE_ENV: 'production',
  VERCEL_ENV: 'production',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
};

test('deployed environments require a complete shared budget configuration', () => {
  assert.equal(askBudgetConfig({ NODE_ENV: 'development' }), undefined);
  assert.equal(askBudgetConfig({ NODE_ENV: 'development', VERCEL: '1' }), null);
  assert.equal(askBudgetConfig({ NODE_ENV: 'production' }), null);
  assert.equal(askBudgetConfig({ ...env, UPSTASH_REDIS_REST_TOKEN: ' ' }), null);
  assert.equal(askBudgetConfig({ ...env, UPSTASH_REDIS_REST_URL: 'not a URL' }), null);
  assert.equal(askBudgetConfig({ ...env, UPSTASH_REDIS_REST_URL: 'http://redis.example.com' }), null);
  assert.equal(askBudgetConfig({ ...env, ASK_DAILY_REQUEST_LIMIT: '0' }), null);
  assert.equal(askBudgetConfig(env).limit, 1000);
  assert.equal(askBudgetConfig({ ...env, VERCEL_ENV: 'preview' }).keyPrefix, 'gappa-me:ask:preview:day');
});

test('the Marketplace KV pair works, but pairs are never mixed', () => {
  const kv = { NODE_ENV: 'production', VERCEL_ENV: 'production', KV_REST_API_URL: 'https://kv.example.com', KV_REST_API_TOKEN: 'kv-token' };
  assert.deepEqual(
    [askBudgetConfig(kv).url, askBudgetConfig(kv).token],
    ['https://kv.example.com/', 'kv-token'],
  );
  assert.equal(askBudgetConfig({ ...kv, KV_REST_API_TOKEN: '' }), null);
  assert.equal(askBudgetConfig({ ...kv, KV_REST_API_TOKEN: undefined, KV_REST_API_READ_ONLY_TOKEN: 'ro' }), null);
  // A complete UPSTASH_* pair wins over the KV pair.
  assert.deepEqual([askBudgetConfig({ ...kv, ...env }).url, askBudgetConfig({ ...kv, ...env }).token], ['https://redis.example.com/', 'test-token']);
  // A partly set UPSTASH_* pair fails closed instead of borrowing the other half from KV_*.
  assert.equal(askBudgetConfig({ ...kv, UPSTASH_REDIS_REST_URL: 'https://redis.example.com' }), null);
  assert.equal(askBudgetConfig({ ...kv, UPSTASH_REDIS_REST_TOKEN: 'test-token' }), null);
});

test('separate instances reserve against the same UTC day and share the denial', async () => {
  const countByDay = new Map();
  const request = async (url, init) => {
    assert.equal(url, 'https://redis.example.com/');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    assert.ok(!init.body.includes('test-token'));
    const [command, script, keyCount, key, limit] = JSON.parse(init.body);
    assert.equal(command, 'EVAL');
    assert.match(script, /redis\.call\('INCR', KEYS\[1\]\)/);
    assert.equal(keyCount, '1');
    assert.match(key, /^gappa-me:ask:production:day:2026-11-0[56]$/);
    const count = countByDay.get(key) ?? 0;
    if (count >= Number(limit)) return Response.json({ result: 0 });
    countByDay.set(key, count + 1);
    return Response.json({ result: 1 });
  };
  const config = askBudgetConfig({ ...env, ASK_DAILY_REQUEST_LIMIT: '2' });
  const first = createGenerationBudget(config, request);
  const second = createGenerationBudget(config, request);
  const now = Date.parse('2026-11-05T23:59:59.250Z');
  const reservations = await Promise.all([first(now), second(now), second(now), first(now)]);
  assert.equal(reservations.filter((r) => r.ok).length, 2);
  assert.ok(reservations.filter((r) => !r.ok).every((r) => r.retryAfter === 1));
  assert.deepEqual(await first(now + 750), { ok: true });
});

test('HTTP and protocol failures never produce a generation reservation', async () => {
  const config = askBudgetConfig(env);
  for (const response of [new Response(null, { status: 503 }), Response.json({ error: 'ERR' }), Response.json({ result: '1' })]) {
    await assert.rejects(createGenerationBudget(config, async () => response)(), /generation budget/);
  }
});
