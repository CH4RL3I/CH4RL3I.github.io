// Shape of content/site.json. Every text on the page that states a fact comes from that file,
// and every number in it names its source in `sources` (not rendered).

export type Link = { label: string; href: string };

export type Project = {
  id: string;
  name: string;
  kind: 'product' | 'research';
  /** One line on what it is. At most 120 characters. */
  what: string;
  /** The dominant element of the card: a number for research ("0 / 15,000"), a status for products ("Live"). At most 14 characters. */
  figure: string;
  /** What the figure measures. At most 60 characters. */
  figureCaption: string;
  /** One sentence with the result. At most 160 characters. */
  result: string;
  /** 2 to 5 short tags. */
  stack: string[];
  /** Repo and live-demo links. Empty for private code. */
  links: Link[];
  /** For example "Private code, walkthrough on request". */
  note?: string;
  /** Files each number comes from. Not rendered. */
  sources: string[];
};

export type TimelineEntry = {
  /** "Jun 2026" */
  start: string;
  /** "Present", or "Feb 2026" */
  end: string;
  org: string;
  role: string;
  place: string;
  /** One line. At most 140 characters. */
  line: string;
  current?: boolean;
  sources: string[];
};

export type SiteContent = {
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    roles: { article: 'A' | 'An'; word: string }[];
    place: string;
    bio: string;
  };
  /** Exactly 8, in display order. */
  projects: Project[];
  moreLink: Link;
  resume: { work: TimelineEntry[]; education: TimelineEntry[] };
  ask: { intro: string; examples: string[]; note: string };
  sayHi: { headline: string; text: string; links: Link[] };
};
