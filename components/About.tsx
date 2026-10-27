import { site } from '@/content/site';
import { Rich } from '@/lib/rich';
import { SectionLabel } from './SectionLabel';

const { about } = site;

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24">
      <SectionLabel id="about-title">About</SectionLabel>
      <div className="leading-relaxed">
        <p className="display text-2xl font-semibold text-text">{about.greeting}</p>
        <p className="mt-4">{about.intro}…</p>
        <ul className="mt-4 space-y-3">
          {about.items.map((item) => (
            <li key={item} className="relative pl-5">
              <span aria-hidden="true" className="absolute left-0 top-[0.8em] h-px w-2.5 bg-accent-b" />
              <Rich text={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
