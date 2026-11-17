import type { Metadata } from 'next';
import { FOOTNOTE_REPLAY_PATH, footnoteReplay } from '@/content/footnote-replay';
import { LegalLine } from '@/components/LegalLine';
import styles from './replay.module.css';

const title = 'Footnote evidence replay · Emilio Gappa';
const description = 'Compare two recorded answers to a Coca-Cola 10-K question, then check the filing to see why both scored wrong.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: FOOTNOTE_REPLAY_PATH },
  openGraph: { title, description, url: FOOTNOTE_REPLAY_PATH, type: 'article' },
  twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export default function FootnoteReplayPage() {
  const { question, date, modes, sources, normalizedAnswer } = footnoteReplay;

  return (
    <main id="content" className="mx-auto max-w-screen-lg px-6 pb-20 pt-6 md:px-12 md:pt-10">
      <a href="/#work-footnote" className="press inline-flex min-h-11 items-center gap-2 text-sm text-body hover:text-text">← Back to Footnote</a>
      <header className="max-w-3xl pb-8 pt-10 sm:pt-14">
        <p className="label">Footnote · Evidence replay</p>
        <h1 className="display mt-4 text-4xl leading-tight text-text sm:text-5xl">When the right digits are wrong.</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
          Two answers to one SEC filing question. One picked the wrong line. The other dropped the unit that made the answer a million times larger.
        </p>
        <p className="label mt-6 text-accent">Development evaluation · <time dateTime={date}>31 October 2026</time></p>
      </header>

      <section aria-labelledby="replay-question" className="rounded-xl border border-stroke bg-tile p-5 sm:p-7">
        <p className="label text-accent">Coca-Cola · Form 10-K · FY2025</p>
        <h2 id="replay-question" className="display mt-3 max-w-3xl text-xl leading-snug text-text sm:text-2xl">{question}</h2>
      </section>

      <section aria-labelledby="replay-compare" className={`${styles.comparison} mt-10`}>
        <h2 id="replay-compare" className="display text-2xl text-text">Compare the recorded answers</h2>
        <fieldset className="mt-5 grid min-w-0 gap-2 sm:grid-cols-2">
          <legend className="sr-only">Choose an evaluation context</legend>
          {modes.map((mode) => (
            <label key={mode.id} className="block cursor-pointer">
              <input
                type="radio"
                name="footnote-replay-context"
                value={mode.id}
                defaultChecked={mode.id === 'retrieved'}
                aria-controls={`replay-${mode.id}`}
                className="peer sr-only"
              />
              <span className="flex h-full min-h-11 items-start gap-3 rounded-lg border border-stroke px-4 py-3 text-body hover:border-stroke-strong peer-checked:border-accent peer-checked:bg-chip peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-accent">{mode.id === 'retrieved' ? '01' : '02'}</span>
                <span>
                  <span className="block text-sm font-semibold">{mode.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed">{mode.description}</span>
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {modes.map((mode) => (
          <section key={mode.id} id={`replay-${mode.id}`} aria-label={mode.label} data-replay-mode={mode.id} className="mt-3 overflow-hidden rounded-xl border border-stroke">
            <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
              <div className="min-w-0 border-b border-stroke bg-tile p-5 sm:border-b-0 sm:border-r sm:p-6">
                <p className="label">Recorded model output</p>
                <code className="mt-4 block text-base leading-relaxed text-text [overflow-wrap:anywhere]">{mode.answer}</code>
                <p className="mt-4 text-sm font-semibold text-amber-200">Incorrect · {mode.error}</p>
                <p className="mt-2 text-sm leading-relaxed">The scorer read this as <span className="font-mono text-text">{mode.normalized}</span>.</p>
                <p className="mt-4 text-sm leading-relaxed">Source extraction could not verify an answer. The system returned an unverified model fallback and recorded no abstention.</p>
              </div>
              <div className="min-w-0 p-5 sm:p-6">
                <p className="label">Trace the evidence</p>
                <dl className="mt-4 space-y-4">
                  {mode.trace.map(({ chunk, text }) => (
                    <div key={chunk} className="border-l border-stroke-strong pl-4">
                      <dt className="font-mono text-xs text-accent">{chunk}</dt>
                      <dd className="mt-1 text-sm leading-relaxed">{text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <details className="border-t border-stroke px-5 sm:px-6">
              <summary className="min-h-11 cursor-pointer py-3 text-sm text-text hover:text-accent">Show reconstructed model prompt chunks</summary>
              <ol className="mb-4 grid gap-x-6 gap-y-2 pl-6 font-mono text-xs text-body sm:grid-cols-2">
                {mode.promptChunks.map((chunk) => <li key={chunk} className="list-decimal">{chunk}</li>)}
              </ol>
            </details>
          </section>
        ))}
      </section>

      <details id="filing-check" className="mt-8 scroll-mt-6 rounded-xl border border-accent/40 bg-tile">
        <summary className="min-h-11 cursor-pointer px-5 py-4 font-medium text-accent hover:text-text sm:px-6">Reveal the filing check</summary>
        <section aria-labelledby="filing-title" className="border-t border-stroke px-5 pb-6 pt-5 sm:px-6">
          <p className="label">Source verification · Balance sheet, p. 63</p>
          <h2 id="filing-title" className="display mt-2 text-xl text-text">Find the row, year and unit in the same statement.</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="border-l border-stroke-strong pl-4">
              <dt className="label">Line item</dt>
              <dd className="mt-2 text-sm leading-relaxed text-text">Equity Attributable to Shareowners of The Coca-Cola Company</dd>
            </div>
            <div className="border-l border-stroke-strong pl-4">
              <dt className="label">December 31, 2025</dt>
              <dd className="mt-2 font-mono text-sm text-text">32,169</dd>
            </div>
            <div className="border-l border-stroke-strong pl-4">
              <dt className="label">Scale caption</dt>
              <dd className="mt-2 text-sm leading-relaxed text-text">In millions except par value</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm leading-relaxed">The filing separately lists total equity of 34,275 million, which includes noncontrolling interests.</p>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-text">
            <span className="font-mono text-sm">32,169 × 1,000,000 =</span>
            <strong className="font-mono text-lg text-accent sm:text-xl">{normalizedAnswer}</strong>
          </p>
          <p className="mt-2 text-sm leading-relaxed">Verified from the filing for this replay. Both archived outputs above remain scored incorrect.</p>
          <a href={sources[0].href} className="mt-2 inline-flex min-h-11 items-center text-sm text-text underline decoration-stroke-strong underline-offset-4 hover:text-accent">Open the SEC balance sheet <span aria-hidden="true" className="ml-2">↗</span></a>
        </section>
      </details>

      <footer aria-labelledby="replay-sources" className="mt-10 border-t border-stroke pt-6">
        <h2 id="replay-sources" className="display text-xl text-text">Evaluation and sources</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed">
          On 31 October 2026 the full development set reused 64 questions across 10 SEC filings. Footnote scored {modes[0].cohort} with retrieved context and {modes[1].cohort} with supplied candidate evidence. This was the sole supplied-context miss in that cohort.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed">
          Answers are from the archived run. Prompt chunk IDs were reconstructed with the published pipeline, matching index files and a cached query embedding. Candidate labels match company and numeric magnitude. The benchmark uses them to select supplied chunks, and the filing provides the independent check of the claim.
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {sources.map(({ label, href }) => (
            <li key={href}>
              <a href={href} className="inline-flex min-h-11 items-center text-sm text-text underline decoration-stroke-strong underline-offset-4 hover:text-accent">{label} <span aria-hidden="true" className="ml-2">↗</span></a>
            </li>
          ))}
        </ul>
        <LegalLine className="mt-6" />
      </footer>
    </main>
  );
}
