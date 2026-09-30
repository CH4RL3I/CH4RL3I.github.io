import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, search, tokenize } from '../js/bm25.mjs';

const toy = buildIndex([
  { id: 'a#1', repo: 'alpha', section: 'Results', text: 'The drone landing pipeline reaches 86 of 100 landings with a Kalman filter.' },
  { id: 'b#1', repo: 'beta', section: 'Method', text: 'Option prices give an implied distribution of returns.' },
  { id: 'c#1', repo: 'gamma', section: 'Notes', text: 'Landing page copy and assorted notes about pages and landing zones zones zones.' },
]);

test('tokenizer drops stopwords, stems plurals', () => {
  assert.deepEqual(tokenize('What are the landings?'), ['landing']);
  assert.deepEqual(tokenize('Kalman filters'), ['kalman', 'filter']);
});
test('ranks the relevant chunk first', () => {
  assert.equal(search(toy, 'drone kalman filter')[0].chunk.id, 'a#1');
  assert.equal(search(toy, 'implied distribution from option prices')[0].chunk.id, 'b#1');
});
test('unknown or stopword-only queries return nothing', () => {
  assert.deepEqual(search(toy, 'zzzqqq'), []);
  assert.deepEqual(search(toy, 'what is the'), []);
});
test('heading matches boost ranking', () => {
  const i = buildIndex([{ id: '1', repo: 'x', section: 'Limitations', text: 'foo bar baz' }, { id: '2', repo: 'x', section: 'Other', text: 'limitation appears once in a long body of words words words words' }]);
  assert.equal(search(i, 'limitations')[0].chunk.id, '1');
});
test('k limits results', () => assert.equal(search(toy, 'landing', 1).length, 1));

const real = JSON.parse(readFileSync(new URL('../data/index.json', import.meta.url), 'utf8'));
const top = (q) => search(real, q, 3).map((h) => h.chunk.repo);
test('real index: known questions hit the right repo', () => {
  assert.equal(top('how does the drone landing work')[0], 'touchdown');
  assert.equal(top('option prices implied distribution')[0], 'fearcurve');
  assert.equal(top('probability of backtest overfitting')[0], 'fluke');
  assert.equal(top('10-K filings question answering citations')[0], 'footnote');
  assert.equal(top('Polymarket calibration longshot bias')[0], 'honest-odds');
  assert.equal(top('15000 candidates zero survive out of sample')[0], 'alpha-graveyard');
  assert.equal(top('LLM agents lookahead bias')[0], 'blind-committee');
  assert.equal(top('hackathon students work samples startups')[0], 'Apto');
  assert.equal(top('neuron MNIST from scratch numpy')[0], 'spike-and-gradient');
  assert.ok(top('what has he built with Swift').includes('profile'));
  assert.ok(top('TestFlight beta iOS app landlords').includes('immoapp'));
});
test('api-worker ships the same index and bm25 as the site', () => {
  const r = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
  assert.equal(r('../api-worker/index.json'), r('../data/index.json'));
  assert.equal(r('../api-worker/lib/bm25.mjs'), r('../js/bm25.mjs'));
});
test('every chunk has repo, section, text, url anchor', () => {
  for (const c of real.chunks) assert.ok(c.id && c.repo && c.section && c.text && /^https:\/\/github\.com\/CH4RL3I/.test(c.url), c.id);
});
