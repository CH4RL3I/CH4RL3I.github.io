import { TerminalButton } from './TerminalButton';

export function Footer() {
  return (
    <footer className="max-w-md pb-16 text-sm text-muted sm:pb-0">
      <p className="leading-relaxed">
        Built with Next.js and Tailwind CSS, deployed on Vercel. Set in Schibsted Grotesk, Inter and Martian Mono. The figure on the left is an animated sketch
        after{' '}
        <a href="https://github.com/CH4RL3I/fearcurve" target="_blank" rel="noopener" className="font-medium text-body transition-colors hover:text-text">
          fearcurve
        </a>
        , which recovers implied probability distributions from option prices.
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
