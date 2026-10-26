import { site } from '@/content/site';
import { Reveal } from './Reveal';

export function SayHi() {
  const [primary, ...rest] = site.sayHi.links;
  return (
    <section id="say-hi" aria-labelledby="say-hi-title" className="relative mx-auto max-w-4xl scroll-mt-24 px-4 py-32 text-center sm:px-6 md:py-48">
      <Reveal>
        <p className="label mb-6">Say hi</p>
        <h2 id="say-hi-title" className="display text-balance text-5xl leading-[0.95] tracking-[-0.045em] text-text md:text-8xl">
          {site.sayHi.headline}
        </h2>
        <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-muted md:text-base">{site.sayHi.text}</p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {primary && (
            <a href={primary.href} target="_blank" rel="noopener" className="ring-accent press rounded-full bg-text px-8 py-4 text-sm text-bg hover:scale-105">
              {primary.label} <span aria-hidden="true">↗</span>
            </a>
          )}
          {rest.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener" className="ring-accent press rounded-full border-2 border-stroke px-8 py-4 text-sm text-text hover:scale-105">
              {l.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
