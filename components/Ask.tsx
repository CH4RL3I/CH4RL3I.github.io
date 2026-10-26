'use client';

import { useRef, useState } from 'react';
import { site } from '@/content/site';
import type { AskAnswer } from '@/lib/ask/contract';
import { askServer, excerpt, localPassages, splitCitations, MAX_QUESTION, type Chunk } from '@/lib/ask/client';
import { track } from '@/lib/track';
import { Reveal } from './Reveal';
import { SectionHead } from './SectionHead';

type State =
  | { kind: 'idle' }
  | { kind: 'loading'; q: string }
  | { kind: 'answer'; q: string; data: AskAnswer }
  | { kind: 'fallback'; q: string; hits: { chunk: Chunk }[] }
  | { kind: 'message'; q: string; text: string };

function Answer({ q, data }: { q: string; data: AskAnswer }) {
  const byN = new Map(data.sources.map((s) => [s.n, s]));
  return (
    <div className="rounded-[28px] border border-stroke bg-surface p-6 text-left md:p-8">
      <p className="display text-2xl leading-snug text-text/90 md:text-3xl">“{q}”</p>
      <p className={`mt-5 text-base leading-relaxed md:text-lg ${data.answerable ? 'text-text' : 'text-muted'}`}>
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
              className="mx-0.5 inline-flex h-5 min-w-5 -translate-y-1 items-center justify-center rounded-full border border-stroke px-1 align-baseline text-[11px] text-muted transition-colors hover:border-[#4e85bf] hover:text-text"
            >
              {s.n}
            </a>
          );
        })}
      </p>
      {data.sources.length > 0 && (
        <div className="mt-8 border-t border-stroke pt-5">
          <p className="label mb-3">Sources</p>
          <ol className="space-y-2 text-sm">
            {data.sources.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="w-4 shrink-0 text-muted tabular-nums">{s.n}</span>
                <a href={s.url} target="_blank" rel="noopener" className="text-text/85 underline decoration-stroke underline-offset-4 transition-colors hover:text-text hover:decoration-[#4e85bf]">
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

function Fallback({ q, hits }: { q: string; hits: { chunk: Chunk }[] }) {
  return (
    <div className="rounded-[28px] border border-stroke bg-surface p-6 text-left md:p-8">
      <p className="text-sm text-muted">
        The answer service is not reachable right now. {hits.length ? 'These passages match best:' : 'No passage in the index matches that.'}
      </p>
      <ul className="mt-5 space-y-5">
        {hits.map(({ chunk }) => (
          <li key={chunk.id} className="border-l border-stroke pl-4">
            <a href={chunk.url} target="_blank" rel="noopener" className="text-sm text-text underline decoration-stroke underline-offset-4 hover:decoration-[#4e85bf]">
              <span className="font-medium text-text">{chunk.repo}</span> · {chunk.section} <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{excerpt(chunk.text, q)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Ask() {
  const [q, setQ] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);
  const loading = state.kind === 'loading';

  async function submit(question: string) {
    const text = question.replace(/\s+/g, ' ').trim();
    if (!text || loading) return;
    if (text.length > MAX_QUESTION) {
      setState({ kind: 'message', q: text, text: `Questions are capped at ${MAX_QUESTION} characters.` });
      return;
    }
    setQ(text);
    setState({ kind: 'loading', q: text });
    track('ask', { question: text, via: 'section' });
    const r = await askServer(text);
    if (r.kind === 'answer') return setState({ kind: 'answer', q: text, data: r.data });
    if (r.kind === 'rate-limited') return setState({ kind: 'message', q: text, text: 'That was a lot of questions in a short time. Try again in a minute.' });
    if (r.kind === 'invalid') return setState({ kind: 'message', q: text, text: r.message });
    const hits = await localPassages(text);
    setState(hits ? { kind: 'fallback', q: text, hits } : { kind: 'message', q: text, text: 'The answer service is not reachable right now. Please try again later.' });
  }

  return (
    <section id="ask" aria-labelledby="ask-title" className="relative mx-auto max-w-3xl scroll-mt-24 px-4 py-28 sm:px-6 md:py-40">
      <SectionHead id="ask" center eyebrow="Ask" title="Ask my portfolio." intro={site.ask.intro} />
      <Reveal>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
        >
          <div className="ring-accent flex items-center gap-2 rounded-full border border-stroke bg-surface py-1.5 pl-5 pr-1.5">
            <label htmlFor="ask-input" className="sr-only">
              Your question about Emilio&apos;s work
            </label>
            <input
              id="ask-input"
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={MAX_QUESTION}
              enterKeyHint="send"
              autoComplete="off"
              placeholder={site.ask.examples[0] ?? 'Ask about a project'}
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-text outline-none placeholder:text-muted/70 md:text-sm"
            />
            {q.length > MAX_QUESTION - 50 && (
              <span className="shrink-0 text-[11px] text-muted tabular-nums" aria-live="polite">
                {MAX_QUESTION - q.length}
              </span>
            )}
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="press shrink-0 rounded-full bg-text px-5 py-2.5 text-sm text-bg disabled:opacity-40"
            >
              Ask <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="mx-6 mt-2 h-[2px] overflow-hidden rounded-full" aria-hidden="true">
            {loading && <div className="ask-bar h-full w-1/2" style={{ background: 'var(--accent-grad)' }} />}
          </div>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {site.ask.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => {
                setQ(ex);
                submit(ex);
              }}
              className="press rounded-full border border-stroke px-3.5 py-2 text-xs text-muted hover:border-[#2a2a2a] hover:text-text disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-10" aria-live="polite" aria-busy={loading}>
          {loading && <p className="text-center text-sm text-muted">Reading the project write-ups…</p>}
          {state.kind === 'answer' && <Answer q={state.q} data={state.data} />}
          {state.kind === 'fallback' && <Fallback q={state.q} hits={state.hits} />}
          {state.kind === 'message' && <p className="text-center text-sm text-muted">{state.text}</p>}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted/80">
          {site.ask.note} <a href="/privacy.html" className="underline underline-offset-4 hover:text-text">Privacy</a>.
        </p>
      </Reveal>
    </section>
  );
}
