# gappa.me redesign: design direction

Status: draft for Emilio's OK, 26.10.2026. Nothing is built until he approves this.

**Audience:** recruiters and hiring managers for internships from January 2027 (AI/tech, finance, strategy consulting, product). Most arrive from the CV or LinkedIn, look for half a minute and decide whether to read on. The page has to show within that time who he is, what he built and what came of it.

**Base:** motionsites prompt 15, "Dark Portfolio Hero" (licensed on a paid plan). We keep its visual system and personalise everything else. The background, sections and contents are our own.

---

## 1. Taken from prompt 15

- **Stack:** Next.js (App Router) with TypeScript, Tailwind, GSAP for the hero entrance and Framer Motion for the loader.
- **Theme:** dark only, no toggle. Tokens: `--bg #0a0a0a`, `--surface #141414`, `--text #f5f5f5`, `--muted #888888`, `--stroke #1f1f1f`.
- **Type:** Instrument Serif italic for display, Inter for body. Both self-hosted through `next/font`, so visitors make no request to Google Fonts.
- **The one accent:** `linear-gradient(90deg, #89AACC, #4E85BF)`, used only for the logo ring, hover rings on buttons and cards, the "Say hi" ring, the progress bar, and one highlighted curve in the background.
- **Floating pill navbar:** fixed and centred, `backdrop-blur`, 1 px `white/10` border. It gains a soft shadow after 100 px of scroll. Contents: logo, dividers, links, "Say hi ↗".
- **Hero layout:** eyebrow, the name very large in serif italic, the cycling role line, bio, two pill CTAs, and the "SCROLL" indicator with its sliding dot.
- **Hero entrance (GSAP, power3.out):** `name-reveal` (y 50 → 0, 1.2 s) and `blur-in` (blur 10 px → 0, staggered 0.1 s).
- **Loader structure:** label top left, rotating words in the centre, counter 000 → 100 bottom right, a 3 px gradient progress bar with a faint glow.

## 2. Personalised

| Element | Prompt 15 | gappa.me |
|---|---|---|
| Name | Michael Smith | **Emilio Gappa** |
| Logo | JA | **EG** |
| Eyebrow | COLLECTION '26 | **OPEN TO INTERNSHIPS · JAN 2027** (proposal, see open points) |
| Role line | A [Creative / Fullstack / Founder / Scholar] lives in Chicago. | **A Builder / An Analyst / A Founder / A Student based in Lisbon.** The article changes with the word, so it never reads "A Analyst". |
| Bio | (generic) | **"I build AI systems and test ideas against real data, then report what actually holds up."** (approved word for word) |
| CTAs | See Works / Reach out... | **See work** (to #work) / **Ask my portfolio** (to #ask) |
| Nav | Home, Work, Resume | **Home, Work, Resume, Say hi ↗** |
| Loader words | Design → Create → Inspire | **Build → Measure → Ship** |
| Loader timing | 2.7 s on every visit | **about 1.5 s, first visit per browser session only** (sessionStorage flag in try/catch, and skipped entirely with prefers-reduced-motion) |
| Loader label | Portfolio | **gappa.me** |
| Background | mux stock video | **our own animation, see 4** |

## 3. Out

- **The stock video, its poster and any third-party media.** Nothing is loaded from mux or an image CDN.
- **The 2.7 s loader on every visit.** It is shorter, shown once per session, and never blocks content for crawlers, no-JS visitors or reduced-motion users. The page is server-rendered underneath.
- **Generic AI styling beyond the one accent:** no purple-blue mesh gradients, glow blobs, glassmorphism cards, sparkle icons, "AI-powered" badges or typewriter intros. The only gradient is the accent from section 1.
- **Placeholder copy from the prompt** ("Michael Smith", "Chicago", "COLLECTION '26", "Design / Create / Inspire").
- **The Jev decision JSON in `ask`.** It is replaced by a short written answer with linked sources.

## 4. Background: own animation (hero only)

**Idea: "implied densities", built from fearcurve.** It is a slow, abstract surface of risk-neutral density curves, the kind fearcurve recovers from option prices.

- About 30 thin curves, one per maturity, stacked in oblique perspective: short maturities narrow and tall at the front, long ones wide and flat at the back. White at 4–10 % opacity. One front curve is drawn in the accent gradient.
- Motion: the skew parameter drifts on a period of about 20 s, so probability mass slides into the left tail and back, as markets price fear. The motion is barely noticeable, like breathing rather than playback.
- A tiny caption in the bottom corner in muted text, `fig. 1 implied density, after fearcurve`, links to the repo. The background is his own work, and that gives a recruiter something to ask about.
- Technique: one `<canvas>`, curves computed analytically (a skewed lognormal mix, no data files). Capped at 30 fps and at 2× device pixel ratio. It pauses when the tab is hidden or the hero is out of view, and draws one static frame under prefers-reduced-motion. No library.
- Fallback idea, if the surface feels too busy: honest-odds calibration lines, with dots drifting onto the diagonal.

```
            ___
          _/   \__                  ← long maturity: wide, flat (faint)
       __/  __    \___
     _/   _/  \__     \____
   _/  __/  _    \___      \______
 _/  _/   _/ \__     \___         \____   ← front curve in the accent
/___/____/_____\_______\_______________\___
                                fig. 1 implied density, after fearcurve
```

## 5. Sections

Every section uses the hero's language: a small uppercase eyebrow (`tracking-[0.3em]`, muted) above a large serif-italic heading, `surface` cards with a 1 px `stroke` border, and the gradient ring on hover only. Blur-in reveal on scroll, played once and switched off for reduced motion.

1. **Home (hero):** as in sections 2 and 4.
2. **Work, `#work`:** 8 cards, 2 columns (1 on mobile). Each card holds an index (`01`), the project name in serif italic, one line on what it is, **the result as the dominant element** (a large figure for research, a status for products), stack tags and a link (repo, live demo, or "private, walkthrough on request"). Below the grid: "All 15 public repos on GitHub ↗".
3. **Resume, `#resume`:** a vertical timeline. Dates on the left (Inter, tabular figures), role and organisation on the right with one line each. Thin stroke line; the current role's dot carries the accent. Two groups:
   - Work: Gonder Group (working student since Oct 2026, intern before that), Proaping Bicycles, ATLAS Vertriebsservice (DVAG Group), Ideal Standard International.
   - Education: NOVA SBE (Master in Management, Finance), TUM (B.Sc. Management & Technology).
4. **Ask my portfolio, `#ask`:** a pill input with a gradient ring on focus, "Ask ↗", and three example questions as chips. The answer card holds 2–4 sentences followed by "Sources" (repo · section links). While it waits, the loader's gradient bar runs under the input. If the service fails, the browser shows the closest passages from local BM25, as today. Small print: "Answers come only from my project write-ups."
5. **Say hi, `#say-hi`:** a large serif-italic line, LinkedIn as the main action (gradient ring), GitHub as the second.
6. **Footer:** © 2026 Emilio Gappa · Privacy · "press / for the terminal".

**Hidden terminal:** `/` opens the old terminal as an overlay (ported from `js/app.js`: help, ls, cat, open, ask, contact, `sudo hire emilio`). It ignores `/` while an input has focus, and Esc closes it. Its `ask` uses the new endpoint.

## 6. Project shortlist (8)

Numbers come only from the project READMEs and the verified CV project list. Product cards first (what he shipped), then research (what he tested).

| # | Project | What | Result line |
|---|---|---|---|
| 01 | **Operations platform at Gonder** | Lead-to-invoice platform and a facility-management customer portal for a facility-services group (employer work, private code) | Both run in production on Microsoft Azure; the portal has 591 passing tests. |
| 02 | **ImmoApp** (joint project with Jan) | Property management for German private landlords: tax forms, utility-cost statements, rent indexation, bank reconciliation | Live in production; iOS app in TestFlight beta. |
| 03 | **Co-Driver** | Private AI assistant and personal CRM: triages messages, briefs before meetings, drafts replies | Acts only after each action is approved and signed on his phone; iOS app on TestFlight. |
| 04 | **Apto** | START Unicorn Lisbon hackathon: students solve proctored company work samples, companies rank them. He built almost all of it. | Live demo online (apto-azure.vercel.app). |
| 05 | **alpha-graveyard** | Automated trading-strategy search, then held-out data and multiple-testing correction | 15,000 candidates. The best in-sample Sharpe of 1.65 fell to −0.12 held out, and none passed the Deflated Sharpe test. |
| 06 | **footnote** | Cited question answering over SEC 10-K filings, with an evaluation harness | 56 % end-to-end accuracy against 92 % when the right passages are given: retrieval, not the model, is the bottleneck. |
| 07 | **blind-committee** | LLM analyst agents, a risk manager and a portfolio manager on anonymised evidence | +41.3 % against +76.3 % for equal weight, but with half the drawdown (−9.2 % vs −17.7 %). |
| 08 | **honest-odds** | Are Polymarket prices calibrated? 2,946 resolved markets | Calibration slope 0.999 at 30 days; the recalibration edge does not survive costs. |

Alternates if one should go: touchdown (84/100 simulated landings within 25 cm, median 9.9 cm), mood-weighted (sentiment IC −0.008, trails equal weight after costs), claude-code-kit (eight tested Claude Code plugins).

## 7. Kept from the current site

- `/privacy.html` stays at the same URL, because it holds the gog-cli Google sign-in notice. Its `ask` paragraph gets updated for Gemini.
- The Search Console file `google1c8c8ddcd9fdff87.html` stays at the root.
- The cookieless PostHog analytics (EU) stays as it is.
- `data/`, `scripts/build-index.mjs` and the BM25 index stay the single source for `ask` and the terminal.
- No-JS works: every section is server-rendered HTML; animation is progressive enhancement.

## 8. Ask route (built later by a subagent, summary only)

Same project as the site: `/api/ask` on Vercel. BM25 retrieval, the 300-character question limit, the rate limit and CORS stay. The CORS check also accepts same-origin requests, so the preview URL works. Gemini Flash runs on the billed Google project and writes 2–4 sentences from the retrieved passages only, citing them. Off-topic questions get a fixed reply, and the system prompt holds no secrets. Besides the budget alert, a daily request quota on the API gives a hard stop, because a budget alert does not stop spending on its own.

## 9. Open points (defaults in bold)

1. Eyebrow text: **"OPEN TO INTERNSHIPS · JAN 2027"**, or something neutral like "PORTFOLIO '26".
2. Gonder card: **no internal company figures beyond "in production on Azure" and the test count**. The fleet and customer counts stay on the CV.
3. Resume: **also add a "Freelance, AI agents & web apps" row (Connecto / HyCharge, Rancyne, a Microsoft 365 knowledge agent for a client)**, which is on the CV. Hawaii Pacific exchange as a small line under TUM.
4. Say hi: **LinkedIn and GitHub, no e-mail address** (as today).
5. DNS later: **keep Namecheap as the DNS host and change only the A/CNAME records**, so mail records are not touched.
