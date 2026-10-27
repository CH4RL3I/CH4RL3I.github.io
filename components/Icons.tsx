// Inline icons, so no icon font or CDN request.
// GitHub: Simple Icons 16.30.0 (CC0). Terminal: Lucide 1.50.0 "square-terminal" (ISC).
// LinkedIn is no longer in Simple Icons; this is the standard "in" mark, drawn for this site.

type P = { className?: string };

export const GitHubIcon = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export const LinkedInIcon = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path
      fillRule="evenodd"
      d="M20.45 2H3.55A1.55 1.55 0 0 0 2 3.55v16.9C2 21.31 2.69 22 3.55 22h16.9c.86 0 1.55-.69 1.55-1.55V3.55C22 2.69 21.31 2 20.45 2ZM8.09 18.6H5.2V9.6h2.89v9Zm-1.44-10.23a1.68 1.68 0 1 1 0-3.35 1.68 1.68 0 0 1 0 3.35ZM18.8 18.6h-2.88v-4.38c0-1.05-.02-2.39-1.46-2.39-1.46 0-1.68 1.14-1.68 2.32v4.45H9.9V9.6h2.76v1.23h.04c.39-.73 1.33-1.5 2.73-1.5 2.92 0 3.46 1.92 3.46 4.42v4.85Z"
    />
  </svg>
);

export const TerminalIcon = ({ className = 'h-5 w-5' }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="m7 11 2-2-2-2" />
    <path d="M11 13h4" />
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
  </svg>
);

/** Picks the icon for a link by its host. */
export function LinkIcon({ href, className }: { href: string; className?: string }) {
  if (href.includes('github.com')) return <GitHubIcon className={className} />;
  if (href.includes('linkedin.com')) return <LinkedInIcon className={className} />;
  return null;
}
