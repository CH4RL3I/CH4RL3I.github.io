export const FOOTNOTE_REPLAY_PATH = '/work/footnote';

const report = 'https://github.com/CH4RL3I/footnote/blob/152acdd200898a39196d7711dc8f8cc3b4bdbe81/docs/evaluation-2026-10-31';

export const footnoteReplay = {
  question: "What was Coca-Cola's total stockholders' equity at the end of fiscal year 2025?",
  date: '2026-10-31',
  normalizedAnswer: '$32,169,000,000',
  sources: [
    { label: 'SEC 10-K balance sheet', href: 'https://www.sec.gov/Archives/edgar/data/21344/000162828026010047/ko-20251231.htm#ia2cb76fa2c6c4a82a91d7a0d2310cb54_130' },
    { label: 'Recorded answers (JSON)', href: `${report}/candidate/results.json` },
    { label: 'Development evaluation', href: `${report}/README.md` },
    { label: 'Run provenance', href: `${report}/provenance.json` },
  ],
  modes: [
    {
      id: 'retrieved',
      label: 'Retrieved context',
      description: 'Fixed windows ranked by dense retrieval',
      answer: '$80,382 million [KO-FY2025#0273]',
      normalized: '$80,382,000,000',
      cohort: '38/64 (59%)',
      error: 'Wrong line item',
      trace: [
        { chunk: 'KO-FY2025#0273', text: 'The cited chunk gives 80,382 as the year-end balance for reinvested earnings, one component of shareowners’ equity.' },
        { chunk: 'KO-FY2025#0274', text: 'The adjacent chunk contains the requested 32,169 row. The extractor received it, but it fell outside the six chunks passed to the fallback model.' },
      ],
      promptChunks: ['KO-FY2025#0222', 'KO-FY2025#0351', 'KO-FY2025#0223', 'KO-FY2025#0241', 'KO-FY2025#0273', 'KO-FY2024#0350'],
    },
    {
      id: 'supplied',
      label: 'Supplied context',
      description: 'Benchmark candidate matches and adjacent windows (oracle)',
      answer: '$32,169 [KO-FY2025#0268]',
      normalized: '$32,169',
      cohort: '63/64 (98%)',
      error: 'Missing scale',
      trace: [
        { chunk: 'KO-FY2025#0268', text: 'The cited balance-sheet window ends partway through the shareowners’ equity label. The 32,169 row appears in the next chunk (#0269) and again in the equity statement (#0274).' },
        { chunk: 'KO-FY2025#0267 / #0272', text: 'These omitted chunks carry the governing scale and year headers. The “In millions” caption visible in #0269 belongs to the cash-flow statement that starts below the equity row.' },
      ],
      promptChunks: ['KO-FY2025#0269', 'KO-FY2025#0274', 'KO-FY2025#0268', 'KO-FY2025#0270', 'KO-FY2025#0273', 'KO-FY2025#0275'],
    },
  ],
} as const;
