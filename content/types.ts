// Shape of content/site.json. Every text on the page that states a fact comes from that file,
// and every number in it names its source in `sources` (not rendered).

export type Link = { label: string; href: string };

/** The left-hand visual of a Work row. Chart numbers come from the project's own result files (see `sources`). */
export type Visual =
  | { type: 'status' }
  | { type: 'image'; src: string; alt: string; width: number; height: number }
  /** One line per strategy, from its discovery value to its held-out value. */
  | { type: 'slope'; from: string; to: string; label: string; pairs: [number, number][] }
  /** Vertical bars in percent. */
  | { type: 'bars'; label: string; items: { label: string; value: number }[] }
  /** Two series compared on a few metrics, in percent. */
  | { type: 'paired'; label: string; series: [string, string]; rows: { label: string; values: [number, number] }[] }
  /** Point estimates with standard errors, drawn as 95% intervals around a reference value. */
  | { type: 'interval'; label: string; ref: number; refLabel: string; items: { label: string; value: number; se: number }[] };

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
  visual: Visual;
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
  /** The opening of the right column. `intro` ends mid-sentence and `items` complete it. Both allow **bold** and [links](#anchor). */
  about: { greeting: string; intro: string; items: string[]; sources: string[] };
  /** Exactly 8, in display order. */
  projects: Project[];
  moreLink: Link;
  resume: { work: TimelineEntry[]; education: TimelineEntry[] };
  ask: { intro: string; examples: string[]; note: string };
  sayHi: { headline: string; text: string; links: Link[] };
};
