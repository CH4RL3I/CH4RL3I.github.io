// Shared by search metadata, the Ask index and the browser analytics module.
export const SITE_ORIGIN = 'https://gappa.me';
export const ANALYTICS_HOSTS = ['gappa.me', 'www.gappa.me', 'gappa-me.vercel.app'];
export const siteUrl = (path = '/') => new URL(path, SITE_ORIGIN).toString();
