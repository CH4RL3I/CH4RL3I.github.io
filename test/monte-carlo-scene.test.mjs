import test from 'node:test';
import assert from 'node:assert/strict';
import { brownianPaths, logPrice, PATH_STEPS, replayState, INTRO_SECONDS, STEP_SECONDS, REPLAY_STEPS, HOLD_SECONDS, CYCLE_SECONDS, fitScene } from '../lib/monte-carlo-scene.ts';

test('a replay delivers the signal before generation, compares before feedback, and updates last', () => {
  const phases = [0.08, 0.22, 0.4, 0.6, 0.74, 0.9].map((fraction) => replayState(INTRO_SECONDS + fraction * STEP_SECONDS).phase);
  assert.deepEqual(phases, ['forward', 'connect', 'generate', 'compare', 'feedback', 'update']);
  for (let step = 0; step < REPLAY_STEPS; step++) {
    const before = replayState(INTRO_SECONDS + (step + 0.75) * STEP_SECONDS);
    assert.equal(before.progress, step / REPLAY_STEPS);
    const after = replayState(INTRO_SECONDS + (step + 0.99) * STEP_SECONDS);
    assert.ok(after.progress > before.progress && after.progress <= (step + 1) / REPLAY_STEPS);
  }
  const holdStart = INTRO_SECONDS + REPLAY_STEPS * STEP_SECONDS;
  assert.equal(replayState(holdStart + HOLD_SECONDS - 0.01).opacity, 1);
  assert.equal(replayState(holdStart + 1).progress, 1);
  assert.equal(replayState(CYCLE_SECONDS).phase, 'initial');
  assert.equal(replayState(0, true).progress, 1);
  assert.equal(replayState(0, true).opacity, 1);
  assert.ok(Math.abs(replayState(CYCLE_SECONDS - 0.001).opacity - replayState(CYCLE_SECONDS + 0.001).opacity) < 0.0001);
});

test('common random paths stay fixed and identical parameters reproduce the reference exactly', () => {
  const reference = brownianPaths(28), blue = brownianPaths(12);
  assert.deepEqual(reference.slice(0, blue.length), blue);
  assert.deepEqual(reference, brownianPaths(28));
  for (let path = 0; path < 12; path++) for (let step = 0; step < PATH_STEPS; step++) {
    assert.equal(logPrice(reference, path, step, 0.06, 0.36), logPrice(blue, path, step, 0.06, 0.36));
  }
});

test('scene fitting keeps an entire silhouette on phone, landscape and desktop viewports', () => {
  const points = [[-1.4, -0.8], [0.7, 0.9], [-0.1, -0.3], [-1, 0.8]];
  for (const [w, h] of [[320, 568], [390, 844], [844, 390], [1280, 900], [2560, 1440]]) {
    const fit = fitScene(points, w, h);
    for (const [x, y] of points) {
      const px = fit.x + fit.scale * x, py = fit.y + fit.scale * y;
      assert.ok(px >= w * 0.059 && px <= w * 0.941, `horizontal bounds ${w}x${h}`);
      assert.ok(py >= h * 0.434 && py <= h * 0.926, `vertical bounds ${w}x${h}`);
    }
  }
});
