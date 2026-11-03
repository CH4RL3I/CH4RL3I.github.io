export type AssistantStep = 'inbox' | 'draft' | 'review' | 'approved' | 'complete';
export type AssistantDemoState = { step: AssistantStep; draft: string; approvedDraft: string | null };
export type AssistantDemoEvent =
  | { type: 'show-draft' | 'review' | 'approve' | 'complete' | 'reset' }
  | { type: 'edit'; text: string };

export const SAMPLE_REPLY = 'Thursday at 14:00 works for me. I’ll bring the updated flow and the open questions.';
export const initialAssistantDemo: AssistantDemoState = { step: 'inbox', draft: SAMPLE_REPLY, approvedDraft: null };

/** A local walkthrough state machine, without signing, network access or side effects. */
export function transitionAssistantDemo(state: AssistantDemoState, event: AssistantDemoEvent): AssistantDemoState {
  if (event.type === 'reset') return { ...initialAssistantDemo };
  if (event.type === 'edit' && state.step !== 'inbox' && state.step !== 'complete') {
    return { step: 'draft', draft: event.text, approvedDraft: null };
  }
  if (event.type === 'show-draft' && state.step === 'inbox') return { ...state, step: 'draft' };
  if (event.type === 'review' && state.step === 'draft' && state.draft.trim()) return { ...state, step: 'review' };
  if (event.type === 'approve' && state.step === 'review' && state.draft.trim()) return { ...state, step: 'approved', approvedDraft: state.draft };
  if (event.type === 'complete' && state.step === 'approved' && state.approvedDraft === state.draft) return { ...state, step: 'complete' };
  return state;
}

export function exampleQuote(visits: number) {
  if (!Number.isInteger(visits) || visits < 1 || visits > 30) return null;
  const lines = [
    { title: 'Scheduled service visits', quantity: visits, unit: 85 },
    { title: 'Materials allowance', quantity: 1, unit: 72 },
    { title: 'Setup and checks', quantity: 1, unit: 45 },
  ];
  return { lines, total: lines.reduce((sum, line) => sum + line.quantity * line.unit, 0) };
}
