import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found · Emilio Gappa',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-16 text-[15px] leading-relaxed text-muted sm:px-6 md:py-24">
      <p className="label">404</p>
      <h1 className="display mt-4 text-5xl leading-none text-text md:text-6xl">This page does not exist.</h1>
      <p className="mt-6 max-w-md">The link may be out of date, or the address has a typo. Everything on the site starts from the home page.</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <a href="/" className="press inline-flex min-h-11 items-center rounded-full border border-stroke px-4 text-text">
          ← gappa.me
        </a>
        <a href="/#work" className="inline-flex min-h-11 items-center text-body hover:text-text">
          Selected work
        </a>
        <a href="/privacy.html" className="inline-flex min-h-11 items-center hover:text-text">
          Privacy
        </a>
      </div>
    </main>
  );
}
