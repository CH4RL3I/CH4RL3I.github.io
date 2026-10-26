import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://gappa.me/', changeFrequency: 'monthly', priority: 1 },
    { url: 'https://gappa.me/privacy.html', changeFrequency: 'yearly', priority: 0.2 },
  ];
}
