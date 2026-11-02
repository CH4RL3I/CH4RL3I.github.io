import { TerminalButton } from './TerminalButton';

export function Footer() {
  return (
    <footer className="max-w-md pb-16 text-sm text-muted sm:pb-0">
      <p className="leading-relaxed">
        Built with Next.js and Tailwind CSS, deployed on Vercel. Set in Schibsted Grotesk, Inter and Martian Mono. The background replays recorded training of a small neural network fitted to simulated moments.
        Grey paths show the Monte Carlo reference; blue paths use the model’s estimated moments, with distributions shown at several horizons.{' '}
        <a href="/background" className="link">Watch the background.</a>
      </p>
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>© 2026 Emilio Gappa</span>
        <a href="/privacy.html" className="transition-colors hover:text-text">
          Privacy
        </a>
        <TerminalButton className="hidden sm:inline" />
      </p>
    </footer>
  );
}
