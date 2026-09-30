# gappa-ask

Serverless endpoint behind `ask` on gappa.me. Deploy as its own Vercel project with this folder as the root; set `OPENROUTER_API_KEY` in the project env.

`POST /api/ask` with `{"question": "..."}`:

1. Validates the question (string, at most 300 characters, body under 2 KB).
2. Re-runs BM25 retrieval on the bundled `index.json` (the client never sends passages).
3. Calls Jev through OpenRouter: `POST https://openrouter.ai/api/alpha/decisions` with `{model: "typesafe/jev-1.13", state: {question, passages}, questions: {project: choice, passage: choice, answerable: noul}}`. Jev returns typed answers with probabilities, not text.
4. Returns `{project, passage_ids, confidence, answerable, probability, model}`; ids are always real chunk ids from the index.

Guards: CORS only for `https://gappa.me` and `http://localhost:*`; 4 s upstream timeout; at most 6 passages of 600 characters per call (input is the only cost, output is free); nothing is logged or stored.

The per-IP rate limit (6 per minute, 40 per hour) lives in memory per serverless instance, so it is best-effort only. The real hard cap is the spending limit on the OpenRouter key: set a low one.

Local run with Jev mocked: `MOCK_JEV=1 node dev-server.mjs` (port 8787). Tests: `npm test`.
`index.json` and `lib/bm25.mjs` are copies written by `scripts/build-index.mjs`; do not edit them by hand.
