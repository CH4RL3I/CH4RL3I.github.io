# Apto

**Don't apply to jobs. Prove yourself, and jobs apply to you.**

Students solve real, proctored work samples from startups and Mittelstand companies. Strong submissions turn into interview invites, so the work sample replaces the cover letter. Built at the START Unicorn Lisbon hackathon.

**[Live demo → apto-azure.vercel.app](https://apto-azure.vercel.app)**

![Apto landing page](docs/landing.png)

## How it works

**For students**
1. A short questionnaire (optionally with a CV upload) matches them to career paths.
2. They pick a company case study and solve it as a multi-step challenge in the browser.
3. Each submission is scored against the case's rubric, and the result lands on a public profile.

**For companies**
1. They publish a case study once, and it doubles as employer branding.
2. A portal ranks candidates by score and integrity signals, with the full submission and CV attached.
3. They reach out to the shortlist directly.

## What's in the box

- **AI scoring and CV parsing:** Gemini 2.5 Flash scores submissions against a rubric and extracts structured data from uploaded CVs.
- **Integrity signals:** paste count, fullscreen exits and tab switches are recorded during a challenge and shown to the company next to the score, which makes the result credible as a hiring signal.
- **Two-sided app:** student area (dashboard, challenges, results, connections, messages, events) and a company portal, plus an admin area.
- **Production plumbing:** Supabase (Postgres, auth, row-level security, edge functions), Sentry, PostHog analytics, Resend email, Playwright end-to-end tests.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Gemini API · Vercel

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Gemini keys; PostHog/Resend/Sentry are optional
npm run dev
```

End-to-end tests: `npm run test:e2e`.

## Team

Built by [@CH4RL3I](https://github.com/CH4RL3I), [@selin71414](https://github.com/selin71414), [@janisfrancis](https://github.com/janisfrancis) and [@milenakurtiak](https://github.com/milenakurtiak) at NOVA SBE.
