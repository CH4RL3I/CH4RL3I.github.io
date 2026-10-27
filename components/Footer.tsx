import { TerminalButton } from './TerminalButton';

export function Footer() {
  return (
    <footer className="max-w-md pb-16 text-sm text-muted sm:pb-0">
      <p className="leading-relaxed">
        Built with Next.js and Tailwind CSS, deployed on Vercel. Set in Schibsted Grotesk, Inter and Martian Mono. The background is an animated sketch: grey Monte Carlo price paths and the histogram of where they end,
        and in blue a small neural network whose own paths and density converge on them.
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
