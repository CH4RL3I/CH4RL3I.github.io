import { About } from '@/components/About';
import { MonteCarloNet } from '@/components/MonteCarloNet';
import { AppShell } from '@/components/AppShell';
import { Ask } from '@/components/Ask';
import { Footer } from '@/components/Footer';
import { Resume } from '@/components/Resume';
import { SayHi } from '@/components/SayHi';
import { Sidebar } from '@/components/Sidebar';
import { Spotlight } from '@/components/Spotlight';
import { Work } from '@/components/Work';

export default function Home() {
  return (
    <AppShell>
      <a href="#content" className="sr-only-focusable fixed left-4 top-4 z-[60] rounded-md bg-text px-4 py-2 text-sm font-medium text-bg">
        Skip to content
      </a>
      <MonteCarloNet />
      <Spotlight />
      <div className="relative z-10 mx-auto min-h-screen max-w-screen-xl px-6 py-12 md:px-12 md:py-16 lg:px-24 lg:py-0">
        <div className="lg:flex lg:justify-between lg:gap-4">
          <Sidebar />
          <main id="content" className="pt-20 lg:w-[54%] lg:py-24 lg:[@media(max-height:760px)]:py-12">
            <About />
            <Work />
            <Resume />
            <Ask />
            <SayHi />
            <Footer />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
