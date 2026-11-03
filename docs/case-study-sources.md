# Case-study content and walkthroughs

Reviewed 3 November 2026. The case studies use the project facts already approved for the portfolio, together with the author's CV and project-fact notes. Private source documents and project code are not shipped as case-study assets.

## Gonder operations

- Existing public facts: an operations platform and facility-management portal, two applications in production on Microsoft Azure; quoting, costing, fleet checks, contract extraction, tickets and inspection reports.
- The CV and project-fact notes support Emilio's role in product definition, architecture, AI-assisted implementation/review, the deterministic costing engine, and reference/golden-test checks against an established workbook.
- Outcomes describe available workflows and deployment status. No customer, fleet, transaction or financial volumes, customer identities, wage details, or new productivity estimates appear in this case study.
- The interactive quote uses **invented** work items, rates and quantities. Its simplified arithmetic is an explanatory example, not a replica of employer pricing logic.

## Co-Driver

- Existing public facts: a private assistant/personal CRM, message triage, meeting briefs, reply drafts, a native SwiftUI app in internal TestFlight testing, and action-by-action phone approval.
- Project-fact notes support Emilio's product-owner/architect role, Reader / Planner / Executor separation, and device-signed approvals.
- The case study reports internal testing and explains the product's approval boundary. It makes no user-count, adoption or time-savings claim.
- The interactive message, draft and `.test` recipient are fictional. Approval is a local state transition. The demo does not create a cryptographic signature, call a model, contact a backend or send a message.
- Editing an approved demo draft clears approval and requires review again. Focused tests check this gate and blocked completion before approval.

Both case studies and their explanatory copy are exported from `content/case-studies.ts` for the page renderer and the portfolio's Ask index. Do not index the invented demo amounts as project results.
