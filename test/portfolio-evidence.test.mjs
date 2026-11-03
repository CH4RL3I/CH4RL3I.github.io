import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { search } from '../lib/bm25.mjs';
import { CASE_STUDIES } from '../content/case-studies.ts';
import { SITE_ORIGIN, ANALYTICS_HOSTS } from '../public/site-config.js';

const index = JSON.parse(readFileSync(new URL('../data/index.json', import.meta.url), 'utf8'));
const report = 'https://github.com/CH4RL3I/footnote/blob/152acdd200898a39196d7711dc8f8cc3b4bdbe81/docs/evaluation-2026-10-31/README.md';

test('Ask retrieves current Footnote results with their development-data qualification', () => {
  const hits = search(index, 'Footnote accuracy development evaluation 31 October 2026', 5);
  assert.ok(hits.some(({ chunk }) => /38 (?:of |\/)64/.test(chunk.text) && /63 (?:of |\/)64/.test(chunk.text) && /development/i.test(chunk.text)));
  const footnote = index.chunks.filter((chunk) => chunk.repo === 'footnote');
  assert.ok(footnote.length > 0);
  for (const chunk of footnote) {
    assert.equal(chunk.url, report);
    assert.doesNotMatch(chunk.text, /56(?:\.25)?\s*%|92(?:\.19)?\s*%/);
  }
});

test('case-study citations expose actual contributions and outcomes without indexing mock financial values', () => {
  for (const study of CASE_STUDIES) {
    const chunks = index.chunks.filter((chunk) => chunk.id.startsWith(`gappa.me#case-${study.slug}-`));
    assert.ok(chunks.some((chunk) => chunk.url === `${SITE_ORIGIN}/work/${study.slug}#contribution`));
    assert.ok(chunks.some((chunk) => chunk.url === `${SITE_ORIGIN}/work/${study.slug}#outcomes`));
    assert.ok(chunks.some((chunk) => /fictional|simulates/i.test(chunk.text)));
    for (const chunk of chunks) assert.doesNotMatch(chunk.text, /€|EUR|Northstar|Maya Chen/);
  }
});

test('the public CV is downloadable and internship availability is retrievable', () => {
  assert.equal(readFileSync(new URL('../public/emilio-gappa-cv.pdf', import.meta.url)).subarray(0, 5).toString(), '%PDF-');
  const cv = index.chunks.find((chunk) => chunk.id === 'gappa.me#public-cv');
  assert.ok(cv && cv.url === `${SITE_ORIGIN}/emilio-gappa-cv.pdf`);
  assert.match(cv.text, /January 2027/);
  assert.match(cv.text, /Applied AI/);
  assert.ok(ANALYTICS_HOSTS.includes(new URL(SITE_ORIGIN).hostname));
  assert.ok(ANALYTICS_HOSTS.includes('gappa-me.vercel.app'));
  assert.ok(!ANALYTICS_HOSTS.includes('localhost'));
});
