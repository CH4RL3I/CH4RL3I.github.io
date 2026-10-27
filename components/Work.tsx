import { site, type Project } from '@/content/site';
import { GitHubIcon, LinkIcon } from './Icons';
import { Reveal } from './Reveal';
import { SectionLabel } from './SectionLabel';
import { Visual } from './Visual';

/** The faint surface a row gets on hover (desktop only). */
export function HoverSurface() {
  return (
    <div
      aria-hidden="true"
      className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-[var(--surface-hover)] lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,175,210,0.1)]"
    />
  );
}

export const Arrow = () => (
  <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 motion-reduce:transition-none">
    ↗
  </span>
);

function Row({ p }: { p: Project }) {
  const [primary, ...rest] = p.links;
  return (
    <div className="group relative grid gap-4 pb-1 transition-opacity duration-200 sm:grid-cols-8 sm:gap-8 md:gap-4 lg:group-hover/list:opacity-50 lg:hover:!opacity-100">
      <HoverSurface />
      <div className="z-10 sm:order-2 sm:col-span-5">
        <p className="label">{p.kind === 'product' ? 'Product' : 'Research'}</p>
        <h3 className="mt-1.5 font-medium leading-snug text-text">
          {primary ? (
            <a
              href={primary.href}
              target="_blank"
              rel="noopener"
              className="group/link inline-flex items-baseline text-base font-medium leading-tight text-text transition-colors hover:text-accent focus-visible:text-accent lg:group-hover:text-accent"
            >
              {/* On desktop the title link covers the whole row. */}
              <span aria-hidden="true" className="absolute -inset-x-4 -inset-y-2.5 hidden rounded-md md:-inset-x-6 md:-inset-y-4 lg:block" />
              <span className="inline-flex items-center">
                {p.name}
                {/* A repo link shows the GitHub mark; anything else (a live demo) the arrow. */}
                {primary.href.includes('github.com') ? <GitHubIcon className="ml-2 h-4 w-4 opacity-70 transition-opacity group-hover/link:opacity-100" /> : <Arrow />}
              </span>
            </a>
          ) : (
            <span className="transition-colors duration-200 lg:group-hover:text-accent">{p.name}</span>
          )}
        </h3>
        <p className="mt-2 text-sm leading-normal">{p.what}</p>
        <p className="mt-2 text-sm leading-normal text-text/80">{p.result}</p>
        {(rest.length > 0 || (!primary && p.note)) && (
          <p className="mt-2 text-sm">
            {rest.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener"
                aria-label={`${p.name} on ${l.label}`}
                title={l.label}
                className="group/link press relative z-20 mr-4 inline-flex items-center gap-1.5 text-body hover:text-text"
              >
                <LinkIcon href={l.href} className="h-5 w-5" />
                {!/github\.com|linkedin\.com/.test(l.href) && (
                  <>
                    {l.label}
                    <Arrow />
                  </>
                )}
              </a>
            ))}
            {!primary && p.note && <span className="text-muted">{p.note}</span>}
          </p>
        )}
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s} className="rounded-full bg-chip px-3 py-1 text-xs font-medium leading-5 text-chip-text">
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="z-10 max-w-[250px] sm:order-1 sm:col-span-3 sm:max-w-none sm:translate-y-1">
        <Visual p={p} />
      </div>
    </div>
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="mb-16 scroll-mt-16 md:mb-24 lg:mb-36 lg:scroll-mt-24">
      <SectionLabel id="work-title">Work</SectionLabel>
      <ol className="group/list">
        {site.projects.map((p) => (
          <Reveal as="li" key={p.id} id={`work-${p.id}`} className="mb-14 scroll-mt-24">
            <Row p={p} />
          </Reveal>
        ))}
      </ol>
      <a href={site.moreLink.href} target="_blank" rel="noopener" className="group/link inline-flex items-center gap-2 font-medium leading-tight text-text transition-colors hover:text-accent">
        <GitHubIcon className="h-5 w-5" />
        {site.moreLink.label}
        <Arrow />
      </a>
    </section>
  );
}
