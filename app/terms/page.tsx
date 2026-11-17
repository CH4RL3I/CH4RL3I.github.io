import type { Metadata } from 'next';
import { LegalLine } from '@/components/LegalLine';

export const metadata: Metadata = {
  title: 'Terms of use · Emilio Gappa',
  description: 'Terms of use for gappa.me, the personal portfolio of Emilio Gappa.',
  alternates: { canonical: '/terms' },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="display mb-3 mt-12 text-3xl text-text">{children}</h2>;
}

const link = 'text-text underline decoration-stroke underline-offset-4 hover:decoration-[#4e85bf]';

export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-[15px] leading-relaxed text-muted sm:px-6 md:py-24">
      <a href="/" className="press inline-flex min-h-11 items-center rounded-full border border-stroke px-4 text-xs text-text">
        ← gappa.me
      </a>
      <h1 className="display mt-12 text-5xl leading-none text-text md:text-6xl">Terms of use</h1>
      <p className="label mt-4">Last updated 17 November 2026</p>

      <H2>This website</H2>
      <p>
        gappa.me is the personal portfolio of Emilio Gappa. It shows his projects, research and CV. It offers no paid service, and using it creates
        no contract. These terms may change; the date above shows the current version.
      </p>

      <H2>Content</H2>
      <p>
        Project descriptions and results state what was measured on the date given, and may be out of date. Nothing on this site is investment,
        financial or legal advice. The trading and market studies are research exercises.
      </p>

      <H2>Ask</H2>
      <p>
        Ask searches the public project write-ups in your browser. When generated answers are on, Google Gemini writes the answer from those
        write-ups. Generated answers can be wrong or incomplete, so check the linked sources before you rely on one. Please do not enter personal
        or confidential information. Ask has a daily limit and can be switched off at any time.
      </p>

      <H2>Copyright</H2>
      <p>
        Texts, design and images on this site are © 2026 Emilio Gappa unless stated otherwise. Code in the linked public GitHub repositories is
        available under the license stated in each repository.
      </p>

      <H2>Links to other sites</H2>
      <p>Links to other websites are provided for convenience. Emilio Gappa has no control over their content and is not responsible for it.</p>

      <H2>Privacy</H2>
      <p>
        How this site handles data is described in the{' '}
        <a className={link} href="/privacy.html">
          privacy notice
        </a>
        .
      </p>

      <H2>Contact</H2>
      <p>
        Emilio Gappa ·{' '}
        <a className={link} href="mailto:emilio@gappa.me">
          emilio@gappa.me
        </a>
      </p>
      <LegalLine className="mt-16 border-t border-stroke pt-6" />
    </main>
  );
}
