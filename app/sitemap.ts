import type { MetadataRoute } from 'next';
import { CASE_STUDIES } from '@/content/case-studies';
import { FOOTNOTE_REPLAY_PATH } from '@/content/footnote-replay';
import { siteUrl } from '@/public/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    ...CASE_STUDIES.map((study) => ({ url: siteUrl(`/work/${study.slug}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: siteUrl(FOOTNOTE_REPLAY_PATH), changeFrequency: 'monthly', priority: 0.8 },
    { url: siteUrl('/privacy.html'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
