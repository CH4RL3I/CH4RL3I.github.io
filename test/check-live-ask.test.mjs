import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REPORT, verifyAnswer } from '../scripts/check-live-ask.mjs';

const reply = (answer, sources = [{ n: 1, url: REPORT }]) => ({ answerable: true, answer, sources });

test('correct answers pass in several phrasings', () => {
  for (const answer of [
    'On 31 October 2026, Footnote answered 38/64 correctly with retrieved context and 63/64 with supplied evidence [1]. These were reused development questions, not held-out ones [1].',
    'With supplied evidence it reached 63 of 64, and with retrieved context only 38 of 64 [1]. No, these were development questions [1].',
    'With retrieved context, Footnote got 38 out of 64 [1]. With supplied candidate evidence it got 63 out of 64 [1]. The questions were not held out [1].',
    'Footnote scored 38/64 and 63/64 with retrieved and supplied evidence respectively [1]; the questions were reused [1].',
  ]) {
    assert.doesNotThrow(() => verifyAnswer(reply(answer)), answer);
  }
});

test('swapped, wrong or missing condition counts fail', () => {
  for (const answer of [
    'Retrieved context: 63/64; supplied context: 38/64. These were reused development questions [1].',
    'Footnote scored 63/64 and 38/64 with retrieved and supplied evidence respectively [1]; the questions were reused [1].',
    'With retrieved context, Footnote got 63 out of 64 [1]. With supplied evidence it got 38 out of 64 [1]. The questions were reused [1].',
    // Codex review, round 2: a wrong supplied count, or none, must not be rescued by an unlabelled 63/64.
    'Retrieved context: 38/64 [1]. Supplied evidence: 62/64 [1]. An earlier run scored 63/64 [1]. These were reused development questions.',
    'Retrieved context: 38/64 [1]. An earlier run scored 63/64 [1]. These were reused development questions.',
    'Retrieved context scored 38/64 and 30/64 [1]. Supplied evidence scored 63/64 [1]. These were reused development questions.',
    'Retrieved and supplied evidence both scored 38/64 [1]. Another run scored 63/64 [1]. The questions were reused.',
    // Codex review, round 3: both labels with three counts must not drop the extra one.
    'Retrieved context: 38/64; supplied evidence: 63/64 and 62/64 [1]. These were reused development questions.',
    // Codex review, round 4: a joint claim about both conditions, and three-digit counts.
    'Retrieved context: 38/64; supplied evidence: 63/64 [1]. Supplied and retrieved evidence both scored 38/64 [1]. These were reused development questions.',
    'Retrieved context: 38/64; supplied evidence: 63/64 [1]. Supplied evidence scored 100/64 [1]. These were reused development questions.',
  ]) {
    assert.throws(() => verifyAnswer(reply(answer)), /tie 38\/64 to retrieved/, answer);
  }
});

test('a missing count, a held-out claim or a missing qualification fails', () => {
  assert.throws(() => verifyAnswer(reply('Footnote got 38/64 with retrieved context [1]. The questions were reused [1].')), /both expected/);
  assert.throws(() => verifyAnswer(reply('Footnote got 38/64 with retrieved context and 63/64 with supplied evidence [1]. Yes, these were held-out questions [1].')), /reused development/);
  assert.throws(() => verifyAnswer(reply('Footnote got 38/64 with retrieved context and 63/64 with supplied evidence [1].')), /reused development/);
});

test('citations must exist and include the pinned report', () => {
  const answer = 'Footnote got 38/64 with retrieved context and 63/64 with supplied evidence [2]. The questions were reused [2].';
  assert.throws(() => verifyAnswer(reply(answer)), /cite the pinned/);
  assert.throws(() => verifyAnswer(reply(answer.replaceAll('[2]', '[1]'), [{ n: 1, url: 'https://example.com/other' }])), /cite the pinned/);
  assert.throws(() => verifyAnswer({ answerable: false, answer, sources: [] }), /generated answer/);
});
