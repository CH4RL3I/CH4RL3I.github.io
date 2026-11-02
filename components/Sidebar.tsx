import { site } from '@/content/site';
import { LinkIcon } from './Icons';
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
        <nav aria-label="Quick links" className="mt-5 flex flex-wrap gap-x-6 lg:hidden">
          {[
            ['work', 'Work'],
            ['resume', 'Resume'],
            ['say-hi', 'Say hi'],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-text underline decoration-stroke-strong underline-offset-4 transition-colors hover:text-accent">
              {label} <span aria-hidden="true" className="text-muted">↓</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-8 lg:mt-0">
        <ul className="flex items-center gap-5" aria-label="Elsewhere">
          {sayHi.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener"
                aria-label={`${l.label} (opens in a new tab)`}
                title={l.label}
                className="press -ml-2 inline-flex min-h-11 min-w-11 items-center justify-center text-body hover:text-text"
              >
                <LinkIcon href={l.href} className="h-6 w-6" />
              </a>
            </li>
          ))}
          <li className="hidden lg:block">
            <TerminalButton icon />
          </li>
        </ul>
        <a href="/background" className="label mt-6 hidden max-w-sm transition-colors hover:text-text lg:block">Background: a neural network learning a Monte Carlo distribution. Watch the replay ↗</a>
      </div>
    </header>
  );
}
