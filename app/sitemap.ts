import type { MetadataRoute } from 'next';
import { CASE_STUDIES } from '@/content/case-studies';
import { siteUrl } from '@/public/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    ...CASE_STUDIES.map((study) => ({ url: siteUrl(`/work/${study.slug}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: siteUrl('/privacy.html'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}
