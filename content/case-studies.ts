type CaseMediaPath = `/work/${string}`;

export type CaseStudy = {
  slug: string;
  projectId: string;
  title: string;
  summary: string;
  status: string;
  role: string;
  problem: readonly string[];
  contribution: readonly string[];
  decision: { title: string; choice: string; tradeoff: string };
  workflow: readonly string[];
  outcomes: readonly { title: string; detail: string }[];
  engineering: {
    title: string;
    summary: string;
    examples: readonly {
      title: string;
      fields: readonly { label: string; value: string }[];
      result: string;
    }[];
    verification: string;
    reproduce: string;
  };
  media?: {
    recording?: {
      src: CaseMediaPath;
      poster?: CaseMediaPath;
      captions?: CaseMediaPath;
      width: number;
      height: number;
      description: string;
    };
    screenshots?: readonly {
      src: CaseMediaPath;
      width: number;
      height: number;
      alt: string;
      caption: string;
    }[];
  };
  demo: { kind: 'gonder' | 'co-driver'; title: string; description: string };
  stack: readonly string[];
  evidenceNote: string;
};

/** Publishable project facts. Fictional walkthrough values live in the demo helper. */
export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    slug: 'gonder-operations',
    projectId: 'gonder-platform',
    title: 'Turning operational rules into working software',
    summary: 'An operations platform and a facility-management portal for Gonder Group, taking quoting, costing and service workflows into two applications on Microsoft Azure.',
    status: 'Two applications in production',
    role: 'Product definition, architecture and delivery in the CEO Office. I directed AI-assisted implementation and independent code review.',
    problem: [
      'Facility services involve more than writing an offer. Costing rules, contracts, fleet exceptions and service tickets all need to remain understandable as a job moves between people.',
      'The challenge was to translate established operating and pricing rules into software while giving different roles the access and review steps their work requires.',
    ],
    contribution: [
      'I defined the product scope and workflows, chose the application architecture, and directed implementation and review with coding agents.',
      'For the operations platform, I worked on quoting and costing, a deterministic calculation engine, role-based access and fleet checks. Reference calculations and golden tests made changes to pricing rules inspectable.',
      'For the facility-management portal, I directed the path from the initial concept to contract-deadline tracking, AI-assisted extraction from PDFs, ticket intake and inspection reports, including the move to Azure.',
    ],
    decision: {
      title: 'Keep pricing rules deterministic and reviewable',
      choice: 'I translated the established costing workbook into explicit calculation rules and checked them against reference cases. AI can assist with documents and implementation; the pricing calculation remains a repeatable computation.',
      tradeoff: 'Changing a pricing rule also means maintaining its reference checks. That extra work makes a changed total explainable and gives reviewers a way to catch a rule being applied to the wrong item.',
    },
    workflow: ['Capture the work', 'Calculate with rules', 'Review the result', 'Hand off the job'],
    outcomes: [
      { title: 'Two applications on Azure', detail: 'The operations platform handles quoting, costing and fleet workflows. The facility-management portal covers contracts and service work. Both are in production on Microsoft Azure.' },
      { title: 'Repeatable costing checks', detail: 'Established calculation rules can be checked against reference results when the software changes. This provides a concrete review mechanism for pricing logic.' },
      { title: 'Exceptions reach a person', detail: 'Fuel-card checks surface transactions for investigation. Contract deadlines, tickets and inspection reports have dedicated workflows in the customer portal.' },
    ],
    engineering: {
      title: 'Catch a missing charge with a reference calculation',
      summary: 'I used reference cases to compare the costing engine with an established workbook. This fictional quote shows how the same check can pinpoint a missing setup fee.',
      examples: [
        {
          title: 'Reference calculation',
          fields: [
            { label: 'Three visits at €85', value: '€255' },
            { label: 'Materials allowance', value: '€72' },
            { label: 'Setup and checks', value: '€45' },
          ],
          result: 'Expected total €372',
        },
        {
          title: 'Simulated omission',
          fields: [
            { label: 'Three visits at €85', value: '€255' },
            { label: 'Materials allowance', value: '€72' },
            { label: 'Setup and checks', value: 'Omitted' },
          ],
          result: 'Incorrect total €327',
        },
      ],
      verification: 'Comparing the lines isolates the missing setup fee and explains the €45 difference. The portfolio’s automated check compares each line and the total against the fixed reference.',
      reproduce: 'Set the walkthrough to three visits and check for €372 before reviewing the quote.',
    },
    demo: {
      kind: 'gonder',
      title: 'From a work item to a reviewed quote',
      description: 'Change a quantity, inspect the calculation, then mark the example as reviewed. All work items, rates and amounts are invented for this walkthrough.',
    },
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Entra ID', 'Microsoft Azure'],
    evidenceNote: 'This case study describes employer work in general terms. The walkthrough uses fictional data and simplified rules; it is a demonstration of the workflow, not a company pricing tool.',
  },
  {
    slug: 'co-driver',
    projectId: 'co-driver',
    title: 'An assistant that waits for your approval',
    summary: 'Co-Driver is a private AI assistant and personal CRM for message triage, meeting briefs and reply drafts. Its central design decision is to keep the authority to act with the person using it.',
    status: 'Native iOS app in internal TestFlight testing',
    role: 'Product owner and architect. I defined the scope, interaction model and approval boundaries, then directed AI-assisted implementation and review.',
    problem: [
      'An assistant needs enough context to sort messages, prepare a useful meeting brief and suggest a reply. Reading that context and taking an action are different responsibilities.',
      'The product challenge was to make preparation useful while preserving a deliberate decision at the moment a draft becomes an action.',
    ],
    contribution: [
      'I defined the personal assistant and CRM product: cross-channel triage, meeting preparation, draft replies and a native iOS front door.',
      'I chose a Reader / Planner / Executor architecture with device-signed approvals. Preparing a suggested action does not, by itself, authorize the executor to carry it out.',
      'I directed the TypeScript and SwiftUI implementation and independent review of changes, with internal TestFlight builds for the iOS app.',
    ],
    decision: {
      title: 'Put an explicit approval between a plan and an action',
      choice: 'I separated reading and planning from execution. The product requires each action to be approved and signed on the phone before it can proceed.',
      tradeoff: 'A person has to take an extra step before an action runs. In exchange, the assistant can help with preparation while the user retains control over what actually happens.',
    },
    workflow: ['Read the context', 'Prepare a draft', 'Approve on the phone', 'Execute the action'],
    outcomes: [
      { title: 'Preparation becomes a reviewable action', detail: 'Message triage, meeting briefs and reply drafts are part of one product flow, ending in an action the user can inspect before approving.' },
      { title: 'A concrete boundary for automation', detail: 'The device-approval requirement separates an AI proposal from permission to act. A native iOS interface makes that approval a first-class part of the product.' },
      { title: 'A native app in TestFlight', detail: 'The iOS app has reached internal TestFlight testing, providing a native interface for the assistant and its approval workflow.' },
    ],
    engineering: {
      title: 'Require a new approval when a draft changes',
      summary: 'I separated preparation, approval and execution so the user can review the specific action they authorize. This browser example exercises that boundary with a fictional reply.',
      examples: [
        {
          title: 'After approval',
          fields: [
            { label: 'Current reply', value: 'Thursday at 14:00' },
            { label: 'Approved reply', value: 'Thursday at 14:00' },
          ],
          result: 'Completion enabled',
        },
        {
          title: 'After an edit',
          fields: [
            { label: 'Current reply', value: 'Friday at 10:00' },
            { label: 'Approved reply', value: 'Approval cleared' },
          ],
          result: 'Completion blocked',
        },
      ],
      verification: 'The portfolio’s automated checks cover attempts to complete before approval and after editing an approved reply. A new review and simulated approval enable completion again.',
      reproduce: 'Approve the sample reply, edit its text, and check that the completion button becomes disabled.',
    },
    demo: {
      kind: 'co-driver',
      title: 'A draft is a proposal until you approve it',
      description: 'Walk through a fictional reply. Edit the sample draft, review the proposed action and simulate phone approval. The demo stays in this browser and sends no messages.',
    },
    stack: ['TypeScript', 'SwiftUI', 'PostgreSQL', 'Claude API'],
    evidenceNote: 'The product requires a device-signed approval. This walkthrough simulates that step with local UI state; its message and recipient are fictional.',
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
