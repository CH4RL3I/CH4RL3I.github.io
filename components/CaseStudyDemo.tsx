'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { exampleQuote, initialAssistantDemo, transitionAssistantDemo } from '@/lib/case-study-demo';

const button = 'press inline-flex min-h-11 items-center justify-center rounded-md border border-stroke-strong bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stroke-strong disabled:hover:text-text';
const money = (value: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

function QuoteDemo() {
  const [quantity, setQuantity] = useState('12');
  const [step, setStep] = useState<'prepare' | 'review' | 'ready'>('prepare');
  const [checked, setChecked] = useState(false);
  const visitsRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef<HTMLParagraphElement>(null);
  const previousStep = useRef(step);
  const quote = exampleQuote(Number(quantity));
  const reset = () => {
    setQuantity('12'); setStep('prepare'); setChecked(false);
    if (step === 'prepare') visitsRef.current?.focus();
  };

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    if (step === 'prepare') visitsRef.current?.focus();
    else if (step === 'review') reviewRef.current?.focus();
    else completedRef.current?.focus();
  }, [step]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke pb-5">
        <p className="label text-accent">{step === 'prepare' ? '01 / Prepare' : step === 'review' ? '02 / Review' : '03 / Ready for handoff'}</p>
        <button type="button" onClick={reset} className="min-h-11 text-xs text-muted underline underline-offset-4 hover:text-text">Reset walkthrough</button>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="example-visits" className="block text-sm font-medium text-text">Scheduled service visits</label>
          <p id="visits-help" className="mt-1 text-xs leading-relaxed text-muted">Choose 1–30 visits. These are invented demonstration rates.</p>
          <input
            ref={visitsRef} id="example-visits" type="number" min="1" max="30" step="1" value={quantity}
            disabled={step !== 'prepare'} aria-describedby="visits-help" aria-invalid={!quote}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-3 min-h-11 w-24 rounded-md border border-stroke-strong bg-bg px-3 text-text disabled:opacity-70"
          />
        </div>
        <div className="sm:text-right">
          <p className="label">Example total</p>
          <p className="display mt-2 text-3xl tabular-nums text-text" aria-live="polite">{quote ? money(quote.total) : '—'}</p>
          <p className="mt-1 text-xs text-muted">Simplified mock calculation</p>
        </div>
      </div>
      {quote ? (
        <ul className="mt-6 divide-y divide-stroke border-y border-stroke" aria-label="Example quote calculation">
          {quote.lines.map((line) => (
            <li key={line.title} className="flex flex-wrap justify-between gap-x-5 gap-y-1 py-3 text-sm">
              <span>{line.title} <span className="text-muted">({line.quantity} × {money(line.unit)})</span></span>
              <span className="tabular-nums text-text">{money(line.quantity * line.unit)}</span>
            </li>
          ))}
        </ul>
      ) : <p role="alert" className="mt-5 text-sm text-text">Enter a whole number from 1 to 30 to calculate the example.</p>}
      {step === 'review' && (
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-stroke p-4 text-sm leading-relaxed text-text">
          <input ref={reviewRef} type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#89aacc]" />
          I checked the example work items and total.
        </label>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {step === 'prepare' && <button type="button" className={button} disabled={!quote} onClick={() => setStep('review')}>Review example quote →</button>}
        {step === 'review' && <button type="button" className={button} disabled={!checked} onClick={() => setStep('ready')}>Mark as reviewed →</button>}
        {step === 'ready' && <p ref={completedRef} role="status" tabIndex={-1} className="text-sm leading-relaxed text-text">Example reviewed. The calculation and its work items are ready for handoff.</p>}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted">This walkthrough stays in your browser. It uses fictional work items, rates and quantities.</p>
    </div>
  );
}

function AssistantDemo() {
  const [state, dispatch] = useReducer(transitionAssistantDemo, initialAssistantDemo);
  const initialRef = useRef<HTMLButtonElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const approvalRef = useRef<HTMLButtonElement>(null);
  const completeRef = useRef<HTMLButtonElement>(null);
  const completedRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(state.step);
  const labels = { inbox: '01 / Incoming request', draft: '02 / Draft', review: '03 / Review action', approved: '04 / Approval recorded', complete: '05 / Complete' };

  useEffect(() => {
    if (previousStep.current === state.step) return;
    previousStep.current = state.step;
    if (state.step === 'inbox') initialRef.current?.focus();
    else if (state.step === 'draft') draftRef.current?.focus();
    else if (state.step === 'review') approvalRef.current?.focus();
    else if (state.step === 'approved') completeRef.current?.focus();
    else completedRef.current?.focus();
  }, [state.step]);

  const reset = () => {
    dispatch({ type: 'reset' });
    if (state.step === 'inbox') initialRef.current?.focus();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke pb-5">
        <p className="label text-accent">{labels[state.step]}</p>
        <button type="button" onClick={reset} className="min-h-11 text-xs text-muted underline underline-offset-4 hover:text-text">Reset walkthrough</button>
      </div>
      <div className="mt-6 rounded-md border border-stroke bg-bg p-4">
        <p className="label">Fictional incoming message</p>
        <p className="mt-3 text-sm leading-relaxed text-text">“Can we move our design review to Thursday at 14:00?”</p>
        <p className="mt-2 text-xs text-muted">Project teammate · teammate@example.test</p>
      </div>
      {state.step !== 'inbox' && (
        <div className="mt-6">
          <label htmlFor="example-reply" className="block text-sm font-medium text-text">Sample reply</label>
          <textarea
            ref={draftRef} id="example-reply" rows={4} maxLength={500} value={state.draft} disabled={state.step === 'complete'}
            onChange={(event) => dispatch({ type: 'edit', text: event.target.value })}
            aria-describedby="reply-help"
            className="mt-3 block w-full resize-y rounded-md border border-stroke-strong bg-bg p-4 text-sm leading-relaxed text-text disabled:opacity-75"
          />
          <p id="reply-help" className="mt-2 text-xs leading-relaxed text-muted">Editing the text clears any demo approval and starts another review.</p>
        </div>
      )}
      {(state.step === 'review' || state.step === 'approved' || state.step === 'complete') && (
        <dl className="mt-6 grid gap-3 rounded-md border border-stroke p-4 text-sm sm:grid-cols-2">
          <div><dt className="label">Proposed action</dt><dd className="mt-1 text-text">Send this reply</dd></div>
          <div><dt className="label">Demo recipient</dt><dd className="mt-1 break-all text-text">teammate@example.test</dd></div>
        </dl>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {state.step === 'inbox' && <button ref={initialRef} type="button" className={button} onClick={() => dispatch({ type: 'show-draft' })}>Show sample draft →</button>}
        {state.step === 'draft' && <button type="button" className={button} disabled={!state.draft.trim()} onClick={() => dispatch({ type: 'review' })}>Review proposed action →</button>}
        {state.step === 'review' && <button ref={approvalRef} type="button" className={button} onClick={() => dispatch({ type: 'approve' })}>Simulate phone approval →</button>}
        {state.step !== 'inbox' && state.step !== 'complete' && <button ref={completeRef} type="button" className={button} disabled={state.step !== 'approved'} onClick={() => dispatch({ type: 'complete' })}>Complete demo action</button>}
      </div>
      <div ref={completedRef} className="mt-5 text-sm leading-relaxed" role="status" aria-live="polite" tabIndex={-1}>
        {state.step === 'review' && <p>Waiting for approval. The proposed action is ready for the user to inspect.</p>}
        {state.step === 'approved' && <p className="text-text">Demo approval recorded for this exact draft. You can now complete the walkthrough.</p>}
        {state.step === 'complete' && <p className="text-text">Demo complete. No message was sent.</p>}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted">This local walkthrough simulates approval. The product requires a device-signed approval on the phone. The draft and recipient here are fictional.</p>
    </div>
  );
}

export function CaseStudyDemo({ kind }: { kind: 'gonder' | 'co-driver' }) {
  return <div className="rounded-lg border border-stroke-strong bg-surface/65 p-5 sm:p-7">{kind === 'gonder' ? <QuoteDemo /> : <AssistantDemo />}</div>;
}
