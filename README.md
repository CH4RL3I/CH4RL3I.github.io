# gappa.me

Personal site of Emilio Gappa, served by GitHub Pages from this repo (branch `main`, root). A terminal-style page whose main command is `ask`, plus a plain project list that works without typing.

- `index.html`, `css/`, `js/app.js`, `fonts/`: the static front end (no build step, no framework).
- `data/projects.json`, `data/index.json`: generated from the public READMEs. Refresh with `node scripts/build-index.mjs` (needs `gh auth login`); add repos with `node scripts/build-index.mjs mood-weighted hivemap`; `--offline` rebuilds from `data/cache/`.
- `api-worker/`: the `ask` endpoint, deployed as its own Vercel project. See `api-worker/README.md`.
- Tests: `node --test test/*.test.mjs api-worker/test/*.test.mjs`.
- Set `ASK_ENDPOINT` at the top of `js/app.js` once the endpoint is deployed; while empty, `ask` uses local BM25 only.
