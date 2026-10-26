import type { Metadata, Viewport } from 'next';
import { Inter, Schibsted_Grotesk } from 'next/font/google';
import { site } from '@/content/site';
import './globals.css';

// next/font downloads both at build time and serves them from this site: no request to Google.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const schibsted = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-schibsted', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://gappa.me'),
  title: site.meta.title,
  description: site.meta.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: site.meta.title,
    description: site.meta.description,
    url: 'https://gappa.me/',
    siteName: 'gappa.me',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Emilio Gappa: a builder based in Lisbon' }],
  },
  twitter: { card: 'summary_large_image', title: site.meta.title, description: site.meta.description, images: ['/og.png'] },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

// Runs before first paint. Marks JS as available and decides whether the intro loader plays:
// only on the first visit of a browser session, never with reduced motion.
const BOOT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(!sessionStorage.getItem('gm-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.setAttribute('data-loader','on')}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${schibsted.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="bg-bg font-body text-text">
        {children}
        <script type="module" src="/analytics.js" async />
      </body>
    </html>
  );
}
