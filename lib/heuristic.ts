import { estimateEffort } from './effort';
import { ScopeSchema, type BriefInput, type Scope } from './schema';
export function heuristicDraft(input: BriefInput): Scope {
  const sentences = input.brief
    .replace(/^SYNTHETIC DEMO DATA[^\n]*\n?/i, '')
    .split(/[.!?\n]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 12);
  const lead = (sentences[0] || input.brief).slice(0, 140);
  const drivers: Scope['effort']['drivers'] = [
    {
      id: 'data-readiness',
      detail: 'Data access, quality and ownership are unconfirmed.',
    },
    { id: 'human-review', detail: 'A named owner reviews every pilot output.' },
  ];
  if (/integrat|api|systems|crm/i.test(input.brief))
    drivers.push({
      id: 'integrations',
      detail:
        'Integration requirements need discovery; no system count is assumed.',
    });
  if (/sso|identity|sign.on/i.test(input.brief))
    drivers.push({
      id: 'sso',
      detail: 'An identity owner must confirm the SSO requirements.',
    });
  if (/compliance|audit|regulat/i.test(input.brief))
    drivers.push({
      id: 'compliance',
      detail:
        'Control requirements must be confirmed by the responsible owner.',
    });
  if (/residency|region|retention/i.test(input.brief))
    drivers.push({
      id: 'residency',
      detail: 'Hosting region and retention requirements are unconfirmed.',
    });
  return ScopeSchema.parse({
    title: 'A focused pilot for a clearer next step',
    summary: `Explore the request: “${lead}”. Validate feasibility and value before a wider commitment.`,
    customer: 'Fictional demo customer',
    sector: input.sector || 'Finance',
    goals: [
      `Validate a practical outcome for: ${lead}.`,
      `Clarify the desired change: ${sentences[1]?.slice(0, 140) || 'a useful first pilot with measurable value'}.`,
      'Measure the pilot against an agreed baseline before deciding to expand.',
    ],
    inScope: [
      'Discovery of one agreed workflow, its users and data inputs.',
      'A bounded prototype using approved synthetic or test data.',
      'Human review, a measured pilot and a documented next-step decision.',
    ],
    outOfScope: [
      'Autonomous decisions or external communications.',
      'Production-wide deployment or new system commitments.',
      'Additional workflows beyond the agreed pilot boundary.',
    ],
    assumptions: [
      {
        text: 'A sponsor can nominate one priority workflow and pilot cohort.',
        confidence: 'Low',
      },
      {
        text: 'Suitable approved test data can be made available.',
        confidence: 'Low',
      },
      {
        text: 'A human owner reviews all pilot outputs.',
        confidence: 'Medium',
      },
    ],
    questions: [
      {
        group: 'Commercial',
        question:
          'Who funds the pilot, and what outcome would justify the next investment?',
        why: 'Establishes a decision-maker and a value threshold.',
      },
      {
        group: 'Technical',
        question:
          'Which inputs are authoritative, and how can a pilot access them?',
        why: 'Defines feasibility and integration effort.',
      },
      {
        group: 'Operational',
        question: 'Who will use, review and own the workflow?',
        why: 'Prevents an unowned prototype.',
      },
      {
        group: 'Compliance',
        question:
          'Which access, retention, hosting and approval controls apply?',
        why: 'Sets controls before any data processing.',
      },
    ],
    phases: [
      {
        name: 'Discover',
        objective: 'Clarify the brief and select one pilot workflow.',
        activities: [
          'Interview the sponsor and users.',
          'Inspect approved sample data.',
          'Agree baseline and pilot boundaries.',
        ],
        exitCriteria:
          'Sponsor approves a measurable pilot and confirms data access.',
        duration: { min: 1, max: 2 },
      },
      {
        name: 'Design',
        objective: 'Define the bounded workflow and control points.',
        activities: [
          'Map user and reviewer responsibilities.',
          'Specify data interfaces and failure handling.',
          'Review the design with accountable owners.',
        ],
        exitCriteria: 'Design and control owners sign off.',
        duration: { min: 1, max: 2 },
      },
      {
        name: 'Build',
        objective: 'Implement only the approved pilot.',
        activities: [
          'Build the agreed prototype.',
          'Add traceability and human review.',
          'Evaluate representative edge cases.',
        ],
        exitCriteria: 'Agreed quality thresholds pass on the reference cohort.',
        duration: { min: 2, max: 4 },
      },
      {
        name: 'Pilot',
        objective: 'Measure usefulness with the agreed users.',
        activities: [
          'Onboard pilot users.',
          'Measure against the baseline.',
          'Collect errors and review feedback.',
        ],
        exitCriteria: 'Sponsor decides to stop, iterate or expand.',
        duration: { min: 2, max: 3 },
      },
      {
        name: 'Handover',
        objective: 'Transfer the documented workflow and next step.',
        activities: [
          'Write the operating runbook.',
          'Transfer review responsibilities.',
          'Present findings and rollout options.',
        ],
        exitCriteria: 'Named owner accepts handover.',
        duration: { min: 1, max: 1 },
      },
    ],
    effort: estimateEffort({ size: 'Medium', drivers }),
    risks: [
      {
        risk: 'The problem remains too broad to evaluate.',
        mitigation: 'Agree one workflow and a decision gate in discovery.',
      },
      {
        risk: 'Poor inputs produce misleading output.',
        mitigation:
          'Check sample quality and retain evidence-linked human review.',
      },
      {
        risk: 'Pilot success is mistaken for production readiness.',
        mitigation:
          'Scope production controls and rollout as a separate decision.',
      },
    ],
    metrics: [
      {
        metric: 'Cycle time',
        target: 'Proposed: agree a baseline, then test a 25% reduction.',
      },
      {
        metric: 'Output quality',
        target:
          'Proposed: agree an acceptance rubric and achieve 90% on a test cohort.',
      },
      {
        metric: 'Review accountability',
        target: 'Proposed: 100% of outputs reviewed by the nominated owner.',
      },
    ],
  });
}
