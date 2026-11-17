// The copyright and legal links under every subpage. Padding with an equal negative margin gives each link a 44 px tap target.
const item = '-mx-1 inline-flex min-h-11 items-center px-1 transition-colors hover:text-text';

export function LegalLine({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      © 2026 Emilio Gappa ·{' '}
      <a href="/privacy.html" className={item}>
        Privacy
      </a>{' '}
      ·{' '}
      <a href="/terms" className={item}>
        Terms
      </a>
    </p>
  );
}
