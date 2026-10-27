import { site } from '@/content/site';
import { DensityField } from './DensityField';
import { RoleLine } from './RoleLine';
import { SectionNav } from './SectionNav';
import { TerminalButton } from './TerminalButton';

const { hero, sayHi } = site;

/** The left column: sticky on desktop, the top of the page on mobile. */
export function Sidebar() {
  return (
    <header className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:min-h-screen lg:w-[46%] lg:flex-col lg:justify-between lg:py-24 lg:[@media(max-height:760px)]:py-12">
      <div>
        <h1 className="display text-4xl font-bold tracking-[-0.035em] text-text sm:text-5xl">
          <a href="/">Emilio Gappa</a>
        </h1>
        <RoleLine />
        <p className="mt-4 max-w-xs leading-normal">{hero.bio}</p>
        <p className="label mt-6 flex items-center gap-2.5 text-body">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(137,170,204,0.15)]" />
          {hero.eyebrow}
        </p>
        <SectionNav />
      </div>

      <div className="mt-8 lg:mt-0">
        {/* Only where the column is tall enough; otherwise the links below would be pushed off screen. */}
        <figure className="hidden lg:block lg:[@media(max-height:879px)]:hidden">
          <div className="h-[132px] w-full max-w-[380px]">
            <DensityField />
          </div>
          <figcaption className="mt-2">
            <a href="https://github.com/CH4RL3I/fearcurve" target="_blank" rel="noopener" className="label transition-colors hover:text-text">
              fig. 1 · implied density, after fearcurve <span aria-hidden="true">↗</span>
            </a>
          </figcaption>
        </figure>
        <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm" aria-label="Elsewhere">
          {sayHi.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener" className="group inline-flex items-baseline font-medium text-text/90 transition-colors hover:text-accent">
                {l.label}
                <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  ↗
                </span>
              </a>
            </li>
          ))}
          <li className="hidden lg:block">
            <TerminalButton />
          </li>
        </ul>
      </div>
    </header>
  );
}
