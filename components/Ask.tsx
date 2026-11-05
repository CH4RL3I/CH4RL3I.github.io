'use client';

import { useState } from 'react';
import { site } from '@/content/site';
import type { AskAnswer } from '@/lib/ask/contract';
import { askServer, excerpt, localPassages, splitCitations, MAX_QUESTION, type Chunk } from '@/lib/ask/client';
import { trackAskOutcome } from '@/lib/track';
import { Reveal } from './Reveal';
import { SectionLabel } from './SectionLabel';

type State =
  | { kind: 'idle' }
  | { kind: 'loading'; q: string }
  | { kind: 'answer'; q: string; data: AskAnswer }
  | { kind: 'passages'; q: string; hits: { chunk: Chunk }[]; fallback: boolean }
  | { kind: 'message'; q: string; text: string };

function Answer({ q, data }: { q: string; data: AskAnswer }) {
  const byN = new Map(data.sources.map((s) => [s.n, s]));
  return (
    <div className="rounded-md border border-stroke bg-tile p-5 text-left md:p-6">
      <p className="label normal-case tracking-[0.02em] text-body">“{q}”</p>
      <p className={`mt-3 leading-relaxed ${data.answerable ? 'text-text' : 'text-muted'}`}>
        {splitCitations(data.answer).map((part, i) => {
          if (typeof part === 'string') return <span key={i}>{part}</span>;
          const s = byN.get(part);
          if (!s) return null;
          return (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener"
              aria-label={`Source ${s.n}: ${s.repo}, ${s.section}`}
              className="mx-0.5 inline-flex h-5 min-w-5 -translate-y-0.5 items-center justify-center rounded-full bg-chip px-1 align-baseline text-[11px] text-chip-text transition-colors hover:text-text"
            >
              {s.n}
            </a>
          );
        })}
      </p>
      {data.sources.length > 0 && (
        <div className="mt-6 border-t border-stroke pt-4">
          <p className="label mb-3">Sources</p>
          <ol className="space-y-2 text-sm">
            {data.sources.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="w-4 shrink-0 text-muted tabular-nums">{s.n}</span>
                <a href={s.url} target="_blank" rel="noopener" className="text-body transition-colors hover:text-accent">
                  <span className="font-medium text-text">{s.repo}</span> · {s.section} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Passages({ q, hits, fallback }: { q: string; hits: { chunk: Chunk }[]; fallback: boolean }) {
  return (
    <div className="rounded-md border border-stroke bg-tile p-5 text-left md:p-6">
      <p className="text-sm text-muted">
        {fallback && 'Generated answers are temporarily unavailable. '}
        {hits.length ? 'Matching passages from the public write-ups.' : 'No passages match that search.'}
      </p>
      <ul className="mt-5 space-y-5">
        {hits.map(({ chunk }) => (
          <li key={chunk.id} className="border-l border-stroke-strong pl-4">
            <a href={chunk.url} target="_blank" rel="noopener" className="text-sm text-text transition-colors hover:text-accent">
              <span className="font-medium text-text">{chunk.repo}</span> · {chunk.section} <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{excerpt(chunk.text, q)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Ask({ answersEnabled }: { answersEnabled: boolean }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const loading = state.kind === 'loading';
  const title = answersEnabled ? 'Ask my portfolio' : 'Search my portfolio';

  async function submit(question: string) {
    const text = question.replace(/\s+/g, ' ').trim();
    if (!text || loading) return;
    if (text.length > MAX_QUESTION) {
      setState({ kind: 'message', q: text, text: `Questions are capped at ${MAX_QUESTION} characters.` });
      return;
    }
    setQ(text);
    setState({ kind: 'loading', q: text });
    const r = await askServer(text, answersEnabled);
    if (r.kind === 'answer') {
      trackAskOutcome(r.data.answerable ? 'answer' : 'no_match', 'section');
      return setState({ kind: 'answer', q: text, data: r.data });
    }
    if (r.kind === 'rate-limited') {
      trackAskOutcome('rate_limited', 'section');
      return setState({ kind: 'message', q: text, text: 'That was a lot of questions in a short time. Try again in a minute.' });
    }
    if (r.kind === 'invalid') {
      trackAskOutcome('error', 'section');
      return setState({ kind: 'message', q: text, text: r.message });
    }
    const fallback = r.kind === 'unavailable';
    const hits = await localPassages(text);
    if (!hits) {
      trackAskOutcome('error', 'section');
      return setState({ kind: 'message', q: text, text: 'The project index could not load. Please try again.' });
    }
    trackAskOutcome(hits.length ? (fallback ? 'fallback' : 'search') : 'no_match', 'section');
    setState({ kind: 'passages', q: text, hits, fallback });
  }

  return (
    <section id="ask" aria-labelledby="ask-title" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24">
      <SectionLabel id="ask-title">{title}</SectionLabel>
      <Reveal>
        <p className="display hidden text-2xl font-semibold text-text lg:block" aria-hidden="true">
          {title}.
        </p>
        <p className="mb-6 leading-relaxed lg:mt-3">{answersEnabled ? site.ask.intro : 'Find excerpts about my projects, work and studies. Each result links to its source.'}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
        >
          <div className="flex items-center gap-2 rounded-lg border border-stroke-strong bg-tile py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-accent-b">
            <label htmlFor="ask-input" className="sr-only">
              {answersEnabled ? 'Your question about Emilio’s work' : 'Search Emilio’s work'}
            </label>
            <input
              id="ask-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={MAX_QUESTION}
              enterKeyHint={answersEnabled ? 'send' : 'search'}
              autoComplete="off"
              placeholder={answersEnabled ? 'Ask about a project or a result' : 'Search for a project or a result'}
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-text outline-none placeholder:text-muted md:text-sm"
            />
            {q.length > MAX_QUESTION - 50 && (
              <span className="shrink-0 text-[11px] text-muted tabular-nums" aria-live="polite">
                {MAX_QUESTION - q.length}
              </span>
            )}
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="press shrink-0 rounded-md bg-text px-4 py-2 text-sm font-medium text-bg disabled:opacity-40"
            >
              {answersEnabled ? 'Ask' : 'Search'} <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="mx-2 mt-1.5 h-[2px] overflow-hidden rounded-full" aria-hidden="true">
            {loading && <div className="ask-bar h-full w-1/2" style={{ background: 'var(--accent-grad)' }} />}
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {site.ask.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => {
                setQ(ex);
                submit(ex);
              }}
              className="press rounded-full bg-chip px-3 py-1.5 text-left text-xs font-medium text-chip-text hover:text-text disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-6" aria-live="polite" aria-busy={loading}>
          {loading && <p className="text-sm text-muted">Reading the project write-ups…</p>}
          {state.kind === 'answer' && <Answer q={state.q} data={state.data} />}
          {state.kind === 'passages' && <Passages q={state.q} hits={state.hits} fallback={state.fallback} />}
          {state.kind === 'message' && <p className="text-sm text-muted">{state.text}</p>}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          {answersEnabled ? site.ask.note : 'Search runs in your browser over the public project index.'} <a href="/privacy.html" className="underline underline-offset-4 transition-colors hover:text-text">Privacy</a>.
        </p>
      </Reveal>
    </section>
  );
}
