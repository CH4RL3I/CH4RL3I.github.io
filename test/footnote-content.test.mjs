import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8'));
const card = site.projects.find((project) => project.id === 'footnote');
const summary = readFileSync(new URL('../content/footnote-evaluation.md', import.meta.url), 'utf8');
const report = 'https://github.com/CH4RL3I/footnote/blob/152acdd200898a39196d7711dc8f8cc3b4bdbe81/docs/evaluation-2026-10-31/README.md';

test('Footnote card and chart report the same dated development cohort', () => {
  assert.equal(card.figure, '59% vs 98%');
  assert.match(card.figureCaption, /Development eval.*31 Oct 2026/);
  assert.deepEqual(card.visual.items, [
    { label: 'Retrieved', value: 38 / 64 * 100 },
    { label: 'Supplied', value: 63 / 64 * 100 },
  ]);
  assert.match(card.result, /38\/64 retrieved, 63\/64 with supplied evidence/);
  assert.match(card.result, /Hybrid pipeline/);
  assert.match(card.result, /Reused development questions; neither held-out results nor pure-model accuracy/);
  assert.ok(card.links.some((link) => link.href === report));
});

test('curated Ask evidence preserves the method and known remaining error', () => {
  assert.match(summary, /31 October 2026/);
  assert.match(summary, /hybrid source-extraction\/model-fallback pipeline/);
  assert.match(summary, /38 of 64 retrieved-context questions correctly: 59%/);
  assert.match(summary, /63 of 64 correctly: 98%/);
  assert.match(summary, /not held-out results or pure-model accuracy/);
  assert.match(summary, /unverified model fallback emitted `\$32,169 \[KO-FY2025#0268\]` instead of USD 32,169,000,000/);
  assert.match(summary, /published 63\/64 supplied-evidence score includes this failure/);
  assert.ok(summary.includes(report));
  assert.doesNotMatch(summary, /56%|92%|Retrieval is the bottleneck, not the model/);
});
