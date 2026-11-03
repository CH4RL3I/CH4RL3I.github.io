import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudyDemo } from '@/components/CaseStudyDemo';
import { CASE_STUDIES, getCaseStudy } from '@/content/case-studies';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  return {
    title: `${study.title} · Emilio Gappa`,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: {
      title: `${study.title} · Emilio Gappa`,
      description: study.summary,
      url: `/work/${study.slug}`,
      type: 'article',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Emilio Gappa portfolio' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${study.title} · Emilio Gappa`,
      description: study.summary,
      images: ['/og.png'],
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();
  const other = CASE_STUDIES.find((entry) => entry.slug !== study.slug);

  return (
    <main id="content" className="mx-auto max-w-screen-xl px-6 pb-16 pt-6 md:px-12 md:pt-10 lg:px-24 lg:pb-24">
      <a href="#case-content" className="sr-only-focusable fixed left-4 top-4 z-50 rounded-md bg-text px-4 py-2 text-sm font-medium text-bg">Skip to case study</a>
      <a href="/#work" className="press inline-flex min-h-11 items-center gap-2 text-sm text-body hover:text-text">← Back to selected work</a>
      <header className="max-w-3xl pb-12 pt-10 md:pt-16">
        <p className="label">Case study · {study.projectId === 'gonder-platform' ? 'Gonder Group' : 'Co-Driver'}</p>
        <h1 className="display mt-4 text-3xl leading-tight text-text sm:text-4xl lg:text-5xl">{study.title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-body sm:text-lg">{study.summary}</p>
        <p className="label mt-6 text-accent">{study.status}</p>
      </header>
      <div className="grid gap-12 border-t border-stroke pt-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside aria-label="Case study details" className="lg:sticky lg:top-10 lg:self-start">
          <h2 className="label">My role</h2>
          <p className="mt-3 text-sm leading-relaxed text-text">{study.role}</p>
          <h2 className="label mt-7">Stack</h2>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Technology stack">
            {study.stack.map((item) => <li key={item} className="rounded-full bg-chip px-2.5 py-1 text-xs leading-relaxed text-chip-text">{item}</li>)}
          </ul>
          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-x-5 gap-y-1 text-sm lg:block">
            {[['problem', 'The problem'], ['contribution', 'My contribution'], ['decision', 'The decision'], ['outcomes', 'What changed'], ['demo', 'Try the walkthrough']].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="flex min-h-11 items-center text-body underline decoration-stroke-strong underline-offset-4 hover:text-text">{label}</a>
            ))}
          </nav>
        </aside>
        <article id="case-content" className="min-w-0 max-w-3xl scroll-mt-10">
          <section id="problem" aria-labelledby="problem-title" className="scroll-mt-10">
            <h2 id="problem-title" className="display text-2xl text-text">The problem</h2>
            {study.problem.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-relaxed sm:text-base">{paragraph}</p>)}
          </section>
          <section id="contribution" aria-labelledby="contribution-title" className="mt-12 scroll-mt-10">
            <h2 id="contribution-title" className="display text-2xl text-text">My contribution</h2>
            <ul className="mt-5 space-y-5">
              {study.contribution.map((item) => <li key={item} className="border-l border-stroke-strong pl-5 text-sm leading-relaxed sm:text-base">{item}</li>)}
            </ul>
          </section>
          <section id="decision" aria-labelledby="decision-title" className="mt-12 scroll-mt-10">
            <p className="label">A design decision</p>
            <h2 id="decision-title" className="display mt-3 text-2xl text-text">{study.decision.title}</h2>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">{study.decision.choice}</p>
            <p className="mt-4 text-sm leading-relaxed sm:text-base">{study.decision.tradeoff}</p>
            <ol aria-label="Product workflow" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {study.workflow.map((item, index) => (
                <li key={item} className="rounded-md border border-stroke p-3">
                  <span className="label text-accent" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <p className="mt-2 text-xs leading-relaxed text-text">{item}</p>
                </li>
              ))}
            </ol>
          </section>
          <section id="outcomes" aria-labelledby="outcomes-title" className="mt-12 scroll-mt-10">
            <h2 id="outcomes-title" className="display text-2xl text-text">What changed</h2>
            <dl className="mt-5 divide-y divide-stroke border-y border-stroke">
              {study.outcomes.map((outcome) => <div key={outcome.title} className="py-5"><dt className="font-medium text-text">{outcome.title}</dt><dd className="mt-2 text-sm leading-relaxed">{outcome.detail}</dd></div>)}
            </dl>
          </section>
          <section id="demo" aria-labelledby="demo-title" className="mt-12 scroll-mt-10">
            <p className="label text-accent">Interactive walkthrough · mock data</p>
            <h2 id="demo-title" className="display mt-3 text-2xl text-text">{study.demo.title}</h2>
            <p className="mb-6 mt-4 text-sm leading-relaxed">{study.demo.description}</p>
            <CaseStudyDemo kind={study.demo.kind} />
            <noscript><p className="mt-4 text-sm text-muted">The interactive walkthrough needs JavaScript. All project details above remain available.</p></noscript>
          </section>
          <footer className="mt-10 border-t border-stroke pt-6">
            <p className="text-xs leading-relaxed text-muted">{study.evidenceNote}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
              <a href="/#say-hi" className="inline-flex min-h-11 items-center text-text underline decoration-stroke-strong underline-offset-4 hover:text-accent">Discuss this project →</a>
              {other && <a href={`/work/${other.slug}`} className="inline-flex min-h-11 items-center text-body hover:text-text">Next case study →</a>}
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
