import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAssistantDemo, transitionAssistantDemo as next } from '../lib/case-study-demo.ts';

test('the walkthrough cannot complete an action before review and simulated approval', () => {
  let state = { ...initialAssistantDemo };
  assert.equal(next(state, { type: 'complete' }).step, 'inbox');
  state = next(state, { type: 'show-draft' });
  assert.equal(next(state, { type: 'approve' }).step, 'draft');
  assert.equal(next(state, { type: 'complete' }).step, 'draft');
  state = next(state, { type: 'review' });
  assert.equal(next(state, { type: 'complete' }).step, 'review');
  state = next(state, { type: 'approve' });
  assert.equal(next(state, { type: 'complete' }).step, 'complete');
});

test('editing an approved draft invalidates its approval and requires another review', () => {
  let state = next(next(next({ ...initialAssistantDemo }, { type: 'show-draft' }), { type: 'review' }), { type: 'approve' });
  state = next(state, { type: 'edit', text: 'A different reply.' });
  assert.equal(state.step, 'draft');
  assert.equal(state.approvedDraft, null);
  assert.equal(next(state, { type: 'complete' }).step, 'draft');
  assert.equal(next(state, { type: 'approve' }).step, 'draft');
  state = next(next(state, { type: 'review' }), { type: 'approve' });
  assert.equal(state.approvedDraft, 'A different reply.');
  assert.equal(next(state, { type: 'complete' }).step, 'complete');
  const empty = next(next({ ...initialAssistantDemo }, { type: 'show-draft' }), { type: 'edit', text: '   ' });
  assert.equal(next(empty, { type: 'review' }).step, 'draft');
});
