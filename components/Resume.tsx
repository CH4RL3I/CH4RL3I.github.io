import { site, type TimelineEntry } from '@/content/site';
import { Reveal } from './Reveal';
import { SectionHead } from './SectionHead';

function Timeline({ label, items }: { label: string; items: TimelineEntry[] }) {
  return (
    <div>
      <h3 className="label mb-8">{label}</h3>
      <ol className="relative ml-[5px] border-l border-stroke">
        {items.map((e, i) => (
          <Reveal as="li" key={`${e.org}-${e.start}`} delay={i * 60} className="relative pb-12 pl-8 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute -left-[6px] top-[7px] h-[11px] w-[11px] rounded-full border-2 border-bg ${e.current ? '' : 'bg-stroke'}`}
              style={e.current ? { background: 'var(--accent-grad)', boxShadow: '0 0 0 4px rgba(137,170,204,0.12)' } : undefined}
            />
            <p className="label tabular-nums">
              <time>{e.start}</time> – <time>{e.end}</time>
            </p>
            <p className="display mt-2 text-2xl leading-tight text-text md:text-3xl">{e.org}</p>
            <p className="mt-1 text-sm text-text/85">
              {e.role}
              <span className="text-muted"> · {e.place}</span>
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{e.line}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

export function Resume() {
  return (
    <section id="resume" aria-labelledby="resume-title" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-28 sm:px-6 md:py-40">
      <SectionHead id="resume" eyebrow="Resume" title="Where I have worked and studied." />
      <div className="grid gap-16 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
        <Timeline label="Work" items={site.resume.work} />
        <Timeline label="Education" items={site.resume.education} />
      </div>
    </section>
  );
}
