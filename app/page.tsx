import { AppShell } from '@/components/AppShell';
import { Ask } from '@/components/Ask';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { Resume } from '@/components/Resume';
import { SayHi } from '@/components/SayHi';
import { Work } from '@/components/Work';

export default function Home() {
  return (
    <AppShell>
      <a href="#work" className="sr-only-focusable fixed left-4 top-4 z-[60] rounded-full bg-text px-4 py-2 text-sm text-bg">
        Skip to work
      </a>
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Resume />
        <Ask />
        <SayHi />
      </main>
      <Footer />
    </AppShell>
  );
}
