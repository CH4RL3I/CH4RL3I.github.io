import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelState, TARGET, MODEL_LAYERS, TRAINING_CHECKPOINTS } from '../lib/monte-carlo-model.ts';

test('recorded training improves the displayed distribution toward its reference', () => {
  const initial = modelState(0);
  const final = modelState(1);
  assert.ok(Math.abs(initial.mu - TARGET.mu) > 0.2, 'initial drift is visibly wrong');
  assert.ok(initial.sigma < TARGET.sigma * 0.6, 'initial distribution is visibly too narrow');
  assert.ok(Math.abs(final.mu - TARGET.mu) < 0.012, 'final mean parameter agrees with reference');
  assert.ok(Math.abs(final.sigma - TARGET.sigma) < 0.012, 'final spread agrees with reference');
  assert.ok(final.loss < initial.loss / 1000, 'displayed-scenario fit improves materially');
  assert.ok(TRAINING_CHECKPOINTS.at(-1).loss < TRAINING_CHECKPOINTS[0].loss / 1000, 'whole training grid improves too');
});

test('interpolated playback keeps actual layers finite and volatility positive', () => {
  for (let i = 0; i <= 400; i++) {
    const state = modelState(i / 400);
    assert.deepEqual(state.activations.map((layer) => layer.length), MODEL_LAYERS);
    assert.ok(state.activations.flat().every(Number.isFinite));
    assert.ok(Number.isFinite(state.mu) && Number.isFinite(state.loss));
    assert.ok(state.sigma > 0 && state.sigma < 1);
    for (let l = 0; l < state.weights.length; l++) {
      assert.equal(state.weights[l].length, MODEL_LAYERS[l + 1]);
      assert.ok(state.weights[l].every((row) => row.length === MODEL_LAYERS[l] && row.every(Number.isFinite)));
    }
  }
});

test('playback is deterministic and safely clamps invalid or out-of-range progress', () => {
  assert.deepEqual(modelState(0.37), modelState(0.37));
  assert.deepEqual(modelState(-1), modelState(0));
  assert.deepEqual(modelState(2), modelState(1));
  assert.deepEqual(modelState(Number.NaN), modelState(0));
  assert.deepEqual(modelState(Number.POSITIVE_INFINITY), modelState(0));
});
