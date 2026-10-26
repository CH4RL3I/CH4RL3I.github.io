// Response contract of POST /api/ask, shared by the route and the UI (Ask section and terminal).

export type AskSource = {
  /** 1-based; the answer cites it as [n]. */
  n: number;
  /** Chunk id from data/index.json. */
  id: string;
  repo: string;
  section: string;
  url: string;
};

export type AskAnswer = {
  /** 2 to 4 plain-text sentences, with [n] markers that point into `sources`. */
  answer: string;
  sources: AskSource[];
  /** False when the passages do not answer it or the question is off topic. */
  answerable: boolean;
  model: string;
};

export type AskError = { error: string };
