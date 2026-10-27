# gappa.me redesign: design direction

Revision 2, 27.10.2026. It replaces the prompt-15 look (centred hero, pill navbar, intro loader), which Emilio approved on 26.10. and then rejected after seeing it built. The content, the project shortlist and the ask route from revision 1 stay.

**Audience:** recruiters and hiring managers for internships from January 2027 (AI/tech, finance, strategy consulting, product). Most arrive from the CV or LinkedIn, look for half a minute and decide whether to read on. The page has to show within that time who he is, what he built and what came of it.

**References:** Emilio picked them from nine live personal sites. The screenshots, links and notes are in his private reference folder, not in this repo. What he chose:

- **Main reference, the design style:** a minimal two-column developer portfolio. He likes how calm it is and how it responds to scrolling.
- **The opening:** a site that starts with "Hi, I'm …" plus a few bullets of what the person does, with monospace dates in its lists.
- **Showing the work:** a site where each project is shown by what it produced. He called it the best all-in-one page but too laggy, so we take the idea and keep it light.
- **Not wanted:** sideways scrolling (he was unsure), cards with small revenue charts and emoji, and the very sparse sites (too little to see).

---

## 1. Rules taken from the main reference

- **Two columns from 1024 px.** The left column (48 %) is sticky and fills the screen height: name, role line, bio, a status line, the section nav and, at the bottom, the links. The right column (52 %) scrolls: About, Work, Resume, Ask, Say hi. Container max 1280 px, side padding 24 / 48 / 96 px.
- **Name:** 48 px, bold, tight tracking. Role line 20 px. Bio max 320 px wide, 16/24.
- **Section nav that follows the scroll:** a thin line and an uppercase label per section. The active section's line grows from 32 to 64 px and its label brightens. This is the "scroll animation" he liked; there is no other scroll effect apart from a gentle fade-in of rows.
- **Lists that light up:** hovering a row gives it a faint surface and an inset top highlight, brightens its title to the accent, and dims the other rows to 50 %. Only with a fine pointer.
- **Date gutter:** in Resume, dates sit in a narrow left column (2 of 8), monospace, uppercase.
- **Chips:** small rounded pills for the stack, in an accent tint.
- **Pointer glow:** a large, very faint radial glow follows the mouse over the page. It is moved with a transform, so it costs no repaint. Not on touch devices, and static under reduced motion.
- **Mobile:** one column. The left column becomes the top of the page, the nav is hidden, and each section gets a sticky label bar with a backdrop blur.

## 2. Our own, not the reference's

- **Colour:** deep blue ink instead of the reference's navy and teal. Tokens: `--bg #0b111b`, `--text #e6ebf2`, `--body #9aa6b8`, `--muted #6d7a8d`, `--stroke #1b2533`, accent `#89AACC → #4E85BF`.
- **Type:** Schibsted Grotesk for the name and titles, Inter for body text, Martian Mono for dates, labels and figure captions.
- **Texts:** all his own, from `content/site.json`. No copy, logos or assets from any reference.

## 3. The opening (About)

"Hi, I'm Emilio." Then one sentence on where he works and studies, and four bullets with bold leads and links into the Work list: build products, test ideas against held-out data, freelance, looking for an internship from January 2027. The approved bio stays word for word in the left column.

## 4. Work: show what each project produced

Each of the 8 projects is a row: a visual on the left (3 of 8 columns), then kind, name, one line on what it is, the result, and stack chips.

- **Research projects get a small chart drawn from their own result files**, as inline SVG in the site's colours:
  - alpha-graveyard: the top 10 strategies by discovery Sharpe, each a line from discovery to held-out Sharpe (`results/top_strategies.csv`).
  - footnote: answer accuracy, 56 % on retrieved passages against 92 % with the right passages given (`docs/results.json`).
  - blind-committee: total return and maximum drawdown, agents against equal weight (`results/run/summary.json`).
  - honest-odds: calibration slope by horizon with its 95 % interval against the calibrated line at 1.0 (README table).
- **Apto** shows its landing page screenshot from the public repo (mock data only).
- **Private products** (Gonder, ImmoApp, Co-Driver) get a status tile with the figure ("Live on Azure", "Live", "TestFlight"). No screenshots: they would show client or personal data.
- Charts draw in once when the row scrolls into view (CSS only, 600 ms) and are static under reduced motion. No chart library.

## 5. Kept from revision 1

- **The density animation after fearcurve**, now as a small figure in the left column above the links (desktop only), with its caption linking to the repo. Capped at 30 fps and 2× DPR, paused when hidden, one still frame under reduced motion.
- **The role line** "A Builder / An Analyst / A Founder / A Student based in Lisbon", in the role slot under the name.
- **Resume** with Work and Education (including the Freelance row), **Ask my portfolio**, **Say hi** (LinkedIn first, GitHub second, no e-mail), the hidden terminal on `/`, the footer with Privacy.

## 6. Out

- **The intro loader** ("Build → Measure → Ship"), the pill navbar, the centred full-screen hero, the CTA pills and the scroll indicator. The reference has none of them, and they cost a recruiter time. GSAP and Framer Motion go with them.
- Horizontal scrolling, emoji, revenue-style charts, large blur effects, and anything that animates continuously in the reading area.

## 7. Project shortlist (8)

Numbers come only from the project READMEs, their result files and the verified CV project list. Products first (what he shipped), then research (what he tested).

| # | Project | What | Result line |
|---|---|---|---|
| 01 | **Operations platform at Gonder** | Operations platform and a facility-management portal (employer work, private code) | Both run in production on Microsoft Azure; the portal has 591 passing tests. |
| 02 | **ImmoApp** (joint project with Jan) | Property management for German private landlords | Live in production; iOS app in TestFlight beta. |
| 03 | **Co-Driver** | Private AI assistant and personal CRM | Acts only after each action is approved and signed on his phone; iOS app on TestFlight. |
| 04 | **Apto** | START Unicorn Lisbon hackathon app. He built almost all of it. | Live demo online. |
| 05 | **alpha-graveyard** | Automated trading-strategy search, then held-out data | 15,000 candidates; the best in-sample Sharpe of 1.65 fell to −0.12, none passed the Deflated Sharpe test. |
| 06 | **footnote** | Cited question answering over SEC 10-K filings | 56 % end-to-end accuracy against 92 % with the right passages given. |
| 07 | **blind-committee** | LLM analyst agents, a risk manager and a portfolio manager | +41.3 % against +76.3 % for equal weight, with half the drawdown. |
| 08 | **honest-odds** | Are Polymarket prices calibrated? 2,946 resolved markets | Calibration slope 0.999 at 30 days; the recalibration edge does not survive costs. |

## 8. Kept from the current site

- `/privacy.html` stays at the same URL (gog-cli Google sign-in notice).
- The Search Console file `google1c8c8ddcd9fdff87.html` stays at the root.
- The cookieless PostHog analytics (EU) stays as it is.
- `data/`, `scripts/build-index.mjs` and the BM25 index stay the single source for `ask` and the terminal.
- No-JS works: every section is server-rendered HTML; motion is progressive enhancement.

## 9. Ask route

Unchanged from revision 1: `/api/ask` on Vercel, BM25 retrieval, 300-character limit, rate limit, CORS with same-origin, Gemini Flash on the billed Google project, 2–4 sentences from the retrieved passages with sources, a fixed reply for off-topic questions, no secrets in the prompt, a budget alert plus a daily request quota.

## 10. Open points (defaults in bold)

1. Light mode: **dark only**, as in the main reference.
2. Photo: **none for now**. A small portrait under the name is easy to add if he wants one.
3. DNS later: **keep Namecheap as the DNS host and change only the A/CNAME records**, so mail records are not touched.
