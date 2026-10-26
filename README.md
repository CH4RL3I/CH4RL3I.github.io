# gappa.me

Personal site of Emilio Gappa: a Next.js app (App Router, TypeScript, Tailwind, GSAP, Framer Motion) with one server route, `/api/ask`, deployed on Vercel. Design base: motionsites prompt 15 ("Dark Portfolio Hero"), personalised; see `docs/design-direction.md`.

- `app/`: the page, `privacy` (also served at `/privacy.html`), `api/ask/route.ts`, icon, robots, sitemap.
- `components/`: hero (with the `DensityField` canvas), navbar, loader, Work, Resume, Ask, Say hi, and the hidden terminal (press `/`).
- `content/site.json`: every text that states a fact, typed by `content/types.ts`. Each number names its source in `sources`.
- `lib/ask/`: `core.mjs` (validation, rate limit, CORS, BM25 retrieval, Gemini call; framework-free so `node --test` runs it), `contract.ts` (response shape), `client.ts` (browser side).
- `lib/bm25.mjs`, `data/`: the search index built from the public READMEs. Refresh with `npm run index` (needs `gh auth login`); add repos with `node scripts/build-index.mjs <repo…>`; `--offline` rebuilds from `data/cache/`. The browser copy lands in `public/data/`.
- `public/`: Search Console file, analytics (cookieless PostHog, only on gappa.me), the terminal font, index copies.
- `legacy/`: the old terminal page, kept for reference until the switch.

Env on Vercel: `GEMINI_API_KEY` (billed Google project), optional `GEMINI_MODEL`.

```
npm run dev        # local
npm test           # node --test test/*.test.mjs
npm run typecheck
npm run build
```
