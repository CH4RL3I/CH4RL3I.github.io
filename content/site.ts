import data from './site.json';
import type { SiteContent } from './types';

export const site = data as SiteContent;
export type { SiteContent, Project, TimelineEntry, Link, Visual } from './types';
