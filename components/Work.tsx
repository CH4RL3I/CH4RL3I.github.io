import { site, type Project } from '@/content/site';
import { Reveal } from './Reveal';
import { SectionHead } from './SectionHead';

function Card({ p, n }: { p: Project; n: number }) {
  const [primary, ...rest] = p.links;
  return (
    <article
      className={`group relative flex h-full flex-col rounded-[28px] border border-stroke bg-surface p-6 md:p-8 ${primary ? 'ring-accent [--ring-w:1px]' : ''}`}
    >
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="label tabular-nums">{String(n).padStart(2, '0')}</span>
        <span className="label">{p.kind === 'product' ? 'Product' : 'Research'}</span>
      </div>

      <h3 className="display mt-6 text-3xl leading-tight text-text md:text-4xl">
        {primary ? (
          // The name is the card's main link and stretches over the whole card.
          <a href={primary.href} target="_blank" rel="noopener" className="outline-none after:absolute after:inset-0 after:rounded-[28px] after:content-['']">
            {p.name}
          </a>
        ) : (
          p.name
        )}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{p.what}</p>

      <div className="mt-8">
        <p className="display flex items-center gap-3 text-5xl leading-none tracking-[-0.04em] text-text tabular-nums md:text-6xl">
          {p.kind === 'product' && (
            <span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--accent-grad)' }} />
          )}
          {p.figure}
        </p>
        <p className="label mt-3">{p.figureCaption}</p>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-text/85">{p.result}</p>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
        <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s} className="rounded-full border border-stroke px-2.5 py-1 text-[11px] text-muted">
              {s}
            </li>
          ))}
        </ul>
        <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs">
          {primary && (
            <span className="text-muted transition-colors group-hover:text-text">
              {primary.label} <span aria-hidden="true">↗</span>
            </span>
          )}
          {rest.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener" className="ring-accent press rounded-full border border-stroke px-3 py-1.5 text-text">
              {l.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
          {!primary && p.note && <span className="text-muted">{p.note}</span>}
        </div>
      </div>
    </article>
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-28 sm:px-6 md:py-40">
      <SectionHead id="work" eyebrow={`Selected work · ${String(site.projects.length).padStart(2, '0')}`} title="What I built, and what came of it." />
      <ol className="grid gap-4 md:grid-cols-2 md:gap-5">
        {site.projects.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 2) * 80}>
            <Card p={p} n={i + 1} />
          </Reveal>
        ))}
      </ol>
      <Reveal className="mt-12 flex justify-center">
        <a href={site.moreLink.href} target="_blank" rel="noopener" className="ring-accent press rounded-full border-2 border-stroke px-6 py-3 text-sm text-text">
          {site.moreLink.label} <span aria-hidden="true">↗</span>
        </a>
      </Reveal>
    </section>
  );
}
