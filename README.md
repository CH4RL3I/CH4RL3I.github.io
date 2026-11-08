# gappa.me

Personal site of Emilio Gappa: a Next.js app (App Router, TypeScript, Tailwind, GSAP, Framer Motion) with one server route, `/api/ask`, deployed on Vercel. Design base: motionsites prompt 15 ("Dark Portfolio Hero"), personalised; see `docs/design-direction.md`.

- `app/`: the page, `privacy` (also served at `/privacy.html`), `api/ask/route.ts`, icon, robots, sitemap.
- `components/`: hero (with the `DensityField` canvas), navbar, loader, Work, Resume, Ask, Say hi, and the hidden terminal (press `/`).
- `content/site.json`: every text that states a fact, typed by `content/types.ts`. Each number names its source in `sources`.
- `lib/ask/`: `core.mjs` (validation, per-IP guard, CORS, BM25 retrieval, Gemini call), `budget.mjs` (shared request budget), `contract.ts` (response shape), `client.ts` (browser search and answers).
- `lib/bm25.mjs`, `data/`: the search index built from the public READMEs. Refresh with `npm run index` (needs `gh auth login`); add repos with `node scripts/build-index.mjs <repo…>`; `--offline` rebuilds from `data/cache/`. The browser copy lands in `public/data/`.
- `public/`: Search Console file, analytics (cookieless PostHog, only on gappa.me), the terminal font, index copies.
- `legacy/`: the old terminal page, kept for reference until the switch.

## Ask configuration

- `GEMINI_API_KEY` enables generated answers. Set it as a server-only secret. `GEMINI_MODEL` optionally overrides the default model.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable the atomic shared request budget. Use a dedicated Redis database with scripting enabled and the write-capable REST token as a server-only secret. Without them, the `KV_REST_API_URL` and `KV_REST_API_TOKEN` pair that the Vercel Marketplace Upstash integration injects is used instead; the two pairs are never mixed, and a partly set `UPSTASH_*` pair disables generation.
- `ASK_DAILY_REQUEST_LIMIT` sets the maximum attempted generations per UTC day and defaults to `1000`. Instances of the same environment share one budget. Use a separate Redis database or environment namespace for previews.

Production requires both Gemini and Redis configuration for generated answers. Without them, visitors can search the public index in their browser. Both the homepage and terminal show source excerpts when Ask reaches a request limit or the answer service is temporarily unavailable. Local development can use a Gemini key with the per-instance guard alone.

Only a validated question with matching passages reserves a generation. Failed Gemini calls still count. A spent budget returns `429` with `Retry-After` until the next UTC day. Store failures return `503` and skip Gemini. The Redis request carries only an environment-scoped counter key and its limit.

## Local development

```
npm run dev        # local
npm test           # node --test test/*.test.mjs
npm run typecheck
npm run build
```

After staging a ready production deployment with `vercel deploy --prod --skip-domain`, run `npm run promote:production -- dpl_…` from the linked checkout. The command checks the project, promotes the deployment, verifies the `gappa.me` alias, and probes a known Ask answer and citation. Run `npm run check:production` on its own to repeat the public probe.
