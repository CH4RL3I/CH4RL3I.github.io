import { site, type TimelineEntry } from '@/content/site';
import { Reveal } from './Reveal';
import { SectionLabel } from './SectionLabel';
import { HoverSurface } from './Work';

function Entries({ title, items }: { title: string; items: TimelineEntry[] }) {
  return (
    <div>
      <h3 className="label mb-6 text-body">{title}</h3>
      <ol className="group/list">
        {items.map((e) => (
          <Reveal as="li" key={`${e.org}-${e.start}`} className="mb-10">
            <div className="group relative grid pb-1 transition-opacity duration-200 sm:grid-cols-8 sm:gap-8 md:gap-4 lg:group-hover/list:opacity-50 lg:hover:!opacity-100">
              <HoverSurface />
              <p className="label z-10 mb-2 mt-1 tabular-nums sm:col-span-2">
                {/* Each date stays whole; a narrow column breaks after the dash. */}
                <span className="whitespace-nowrap">
                  <time>{e.start}</time> —
                </span>{' '}
                <time className="whitespace-nowrap">{e.end}</time>
              </p>
              <div className="z-10 sm:col-span-6">
                <p className="font-medium leading-snug text-text">
                  <span className="transition-colors duration-200 lg:group-hover:text-accent">{e.org}</span>
                  {e.current && (
                    <span aria-label="current" className="ml-2 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-accent align-middle" />
                  )}
                </p>
                <p className="mt-0.5 text-sm text-text/75">
                  {e.role} <span className="text-muted">· {e.place}</span>
                </p>
                <p className="mt-2 text-sm leading-normal">{e.line}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

export function Resume() {
  return (
    <section id="resume" aria-labelledby="resume-title" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24">
      <SectionLabel id="resume-title">Resume</SectionLabel>
      <p className="mb-8 text-sm leading-relaxed">
        <a href="/emilio-gappa-cv.pdf" download className="inline-flex min-h-11 items-center gap-2 font-medium text-text underline decoration-stroke-strong underline-offset-4 hover:text-accent">Download CV <span aria-hidden="true">↓</span></a>
        <span className="ml-3 text-muted">PDF · 1 page · updated 3 Nov 2026</span>
      </p>
      <Entries title="Work" items={site.resume.work} />
      <div className="mt-6">
        <Entries title="Education" items={site.resume.education} />
      </div>
    </section>
  );
}
