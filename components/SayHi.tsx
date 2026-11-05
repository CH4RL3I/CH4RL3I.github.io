import { site } from '@/content/site';
import { LinkIcon } from './Icons';
import { Reveal } from './Reveal';
import { SectionLabel } from './SectionLabel';
import { Arrow } from './Work';

export function SayHi() {
  const [primary, ...rest] = site.sayHi.links;
  const primaryIsEmail = primary?.href.startsWith('mailto:');
  return (
    <section id="say-hi" aria-labelledby="say-hi-title" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-28 lg:scroll-mt-24">
      <SectionLabel id="say-hi-title">Say hi</SectionLabel>
      <Reveal>
        <p className="display text-4xl font-semibold tracking-[-0.03em] text-text sm:text-5xl">{site.sayHi.headline}</p>
        <p className="mt-4 max-w-md leading-relaxed">{site.sayHi.text}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {primary && (
            <a href={primary.href} target={primaryIsEmail ? undefined : '_blank'} rel={primaryIsEmail ? undefined : 'noopener'} className="group/link press inline-flex items-center gap-2 rounded-md bg-text px-5 py-3 text-sm font-medium text-bg hover:bg-white">
              <LinkIcon href={primary.href} className="h-4 w-4" />
              {primary.label}
              <Arrow />
            </a>
          )}
          {rest.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener" className="group/link inline-flex items-center gap-2 text-sm font-medium text-text transition-colors hover:text-accent">
              <LinkIcon href={l.href} className="h-4 w-4" />
              {l.label}
              <Arrow />
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
