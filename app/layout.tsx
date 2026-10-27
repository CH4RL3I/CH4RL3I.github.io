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
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Emilio Gappa: builder and analyst based in Lisbon' }],
  },
  twitter: { card: 'summary_large_image', title: site.meta.title, description: site.meta.description, images: ['/og.png'] },
};

export const viewport: Viewport = {
  themeColor: '#0b111b',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${schibsted.variable}`} suppressHydrationWarning>
      <body className="bg-bg font-body text-body">
        {children}
        <script type="module" src="/analytics.js" async />
      </body>
    </html>
  );
}
