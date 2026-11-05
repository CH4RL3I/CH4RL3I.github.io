# Case-study content and walkthroughs

Reviewed 3 November 2026. The case studies use the project facts already approved for the portfolio, together with the author's CV and project-fact notes. Private source documents and project code are not shipped as case-study assets.

## Gonder operations

- Existing public facts: an operations platform and facility-management portal, two applications in production on Microsoft Azure; quoting, costing, fleet checks, contract extraction, tickets and inspection reports.
- The CV and project-fact notes support Emilio's role in product definition, architecture, AI-assisted implementation/review, the deterministic costing engine, and reference/golden-test checks against an established workbook.
- Outcomes describe available workflows and deployment status. No customer, fleet, transaction or financial volumes, customer identities, wage details, or new productivity estimates appear in this case study.
- The interactive quote uses **invented** work items, rates and quantities. Its simplified arithmetic is an explanatory example, not a replica of employer pricing logic.
- The engineering illustration compares the three-visit reference with a hypothetical omitted setup fee. The portfolio regression check compares the individual line amounts and total against that reference.

## Co-Driver

- Existing public facts: a private assistant/personal CRM, message triage, meeting briefs, reply drafts, a native SwiftUI app in internal TestFlight testing, and action-by-action phone approval.
- Project-fact notes support Emilio's product-owner/architect role, Reader / Planner / Executor separation, and device-signed approvals.
- The case study reports internal testing and explains the product's approval boundary. It makes no user-count, adoption or time-savings claim.
- The interactive message, draft and `.test` recipient are fictional. Approval is a local state transition. The demo does not create a cryptographic signature, call a model, contact a backend or send a message.
- Editing an approved demo draft clears approval and requires review again. Focused tests check this gate and blocked completion before approval.
- The engineering illustration shows these two states using fictional draft text. It documents the portfolio walkthrough's verification, with the real device approval described separately.

Both case studies and their explanatory copy are exported from `content/case-studies.ts` for the page renderer and the portfolio's Ask index. Do not index the invented demo amounts as project results.

## Adding product media

Place approved files under `public/work/<case-slug>/`, then add `media` to that case in `content/case-studies.ts`. Use `/work/<case-slug>/` URLs. A `recording` takes a video `src`, pixel `width` and `height`, a `description`, and optional `poster` and WebVTT `captions`. Each `screenshots` item takes a `src`, pixel `width` and `height`, descriptive `alt`, and a `caption` explaining what to look at. The page shows the section once at least one recording or screenshot is supplied.

Use approved captures with fictional records and identify the environment in the caption. Use a caption track for spoken content. Add measured outcomes with the measurement date, sample size and method when those results are available for publication.
