import { MonteCarloNet } from '@/components/MonteCarloNet';

export const metadata = {
  title: 'Background study · Emilio Gappa',
  robots: { index: false, follow: false },
};

export default function BackgroundStudy() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-bg">
      <MonteCarloNet />
      <div className="relative z-10 max-w-xl px-6 pt-8 sm:px-12 sm:pt-12 [@media(max-height:700px)]:pt-4">
        <a href="/" className="press inline-flex min-h-11 items-center text-sm text-body hover:text-text">← Back to portfolio</a>
        <p className="label mt-8 [@media(max-height:700px)]:mt-2">Background study</p>
        <h1 className="display mt-3 text-2xl text-text sm:text-3xl [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:text-xl">Neural network → Monte Carlo</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-body [@media(max-height:700px)]:mt-2">
          Recorded training of a small network. Its estimated distribution moves toward the Monte Carlo reference.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted [@media(max-height:700px)]:mt-2" aria-label="Animation legend">
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-px w-5 bg-muted" />Monte Carlo reference</li>
          <li className="flex items-center gap-2"><span aria-hidden="true" className="h-px w-5 bg-accent" />Model estimate</li>
        </ul>
      </div>
      <p className="label fixed inset-x-6 bottom-8 z-10 text-center text-[9px] sm:inset-x-12 sm:text-[11px] [@media(max-height:700px)]:bottom-4">
        Forward pass <span aria-hidden="true">→</span> sample <span aria-hidden="true">→</span> compare <span aria-hidden="true">→</span> feedback
      </p>
    </main>
  );
}
