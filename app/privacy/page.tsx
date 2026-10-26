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
      <p className="label mt-4">Last updated 26 October 2026</p>

      <H2>This website</H2>
      <p>
        gappa.me is a personal portfolio. It uses PostHog (EU servers) in cookieless mode to count page views and which terminal commands are typed,
        including questions asked with <em>Ask my portfolio</em> or <code>ask</code>. PostHog stores nothing in your browser, no account is created, and your
        browser&apos;s Do Not Track setting is respected. The site remembers in your browser&apos;s session storage that you have seen the intro, so it
        plays only once per visit; that entry is deleted when you close the tab.
      </p>
      <p className="mt-4">
        Questions you ask go to a small server function on this site. It picks the matching passages from Emilio&apos;s public project write-ups and
        sends your question with those passages to Google&apos;s Gemini API, which writes the answer. That server function does not store or log your
        question; the analytics above record its text.
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
