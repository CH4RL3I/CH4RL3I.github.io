import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy · Emilio Gappa',
  description: "Privacy notice for gappa.me and Emilio Gappa's personal tools.",
  alternates: { canonical: '/privacy.html' },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="display mb-3 mt-12 text-3xl text-text">{children}</h2>;
}

const link = 'text-text underline decoration-stroke underline-offset-4 hover:decoration-[#4e85bf]';

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-[15px] leading-relaxed text-muted sm:px-6 md:py-24">
      <a href="/" className="press inline-block rounded-full border border-stroke px-4 py-2 text-xs text-text">
        ← gappa.me
      </a>
      <h1 className="display mt-12 text-5xl leading-none text-text md:text-6xl">Privacy</h1>
      <p className="label mt-4">Last updated 5 November 2026</p>

      <H2>This website</H2>
      <p>
        gappa.me is a personal portfolio. It uses PostHog (EU servers) to count page views, CV download clicks, case study visits, walkthrough starts
        and completions, contact clicks, built-in terminal commands and Ask outcomes. Ask events contain the outcome category and entry point.
        The site keeps analytics state in memory and respects your browser&apos;s Do Not Track setting.
      </p>
      <p className="mt-4">
        Portfolio search matches your query against a public index in your browser. When generated answers are available, the site&apos;s server
        function sends your question and matching passages from Emilio&apos;s public project write-ups to Google&apos;s Gemini API to write an answer.
      </p>

      <H2>gog-cli (Google sign-in)</H2>
      <p>
        gog-cli is a private command-line tool that only Emilio Gappa uses on his own computer to read his own Gmail, for example to save attachments. It
        requests read-only access. Data it reads stays on that computer; it is not sent to any server operated for this tool, not shared with third
        parties, not sold, and not used for advertising or to train AI models. Access can be revoked at any time at{' '}
        <a className={link} href="https://myaccount.google.com/permissions">
          myaccount.google.com/permissions
        </a>
        .
      </p>
      <p className="mt-4">
        The use of information received from Google APIs adheres to the{' '}
        <a className={link} href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <H2>Contact</H2>
      <p>
        Emilio Gappa ·{' '}
        <a className={link} href="mailto:emilio@gappa.me">
          emilio@gappa.me
        </a>
      </p>
    </main>
  );
}
