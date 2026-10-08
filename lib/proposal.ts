import type { Scope } from './schema';
export const footer = 'Synthetic demo — fictional customer';
export function proposalSections(s: Scope) {
  return [
    { heading: '01 / Outcomes', lines: s.goals },
    {
      heading: '02 / Scope boundaries',
      lines: [
        ...s.inScope.map((x) => `In: ${x}`),
        ...s.outOfScope.map((x) => `Out: ${x}`),
      ],
    },
    {
      heading: '03 / Delivery approach',
      lines: s.phases.map(
        (p) =>
          `${p.name} (${p.duration.min === p.duration.max ? p.duration.min : `${p.duration.min}–${p.duration.max}`} ${p.duration.max === 1 ? 'week' : 'weeks'}): ${p.objective} Activities: ${p.activities.map((activity) => activity.trim().replace(/[.;]+$/, '')).join('; ')}. Exit: ${p.exitCriteria}`,
      ),
    },
    {
      heading: '04 / Planning estimate',
      lines: [
        `${s.effort.size} engagement · ${s.effort.min}–${s.effort.max} person-weeks. Planning estimate, not a quote; elapsed time depends on staffing and dependencies.`,
        ...s.effort.drivers.map((d) => d.detail),
      ],
    },
    {
      heading: '05 / Assumptions to confirm',
      lines: s.assumptions.map((a) => `${a.confidence}: ${a.text}`),
    },
    {
      heading: '06 / Decisions needed',
      lines: s.questions.map((q) => `${q.group}: ${q.question} ${q.why}`),
    },
    {
      heading: '07 / Risks & controls',
      lines: s.risks.map((r) => `${r.risk} ${r.mitigation}`),
    },
    {
      heading: '08 / Measuring success',
      lines: s.metrics.map((m) => `${m.metric}: ${m.target}`),
    },
  ];
}
export function buildMarkdown(s: Scope) {
  return `# ${s.title}\n\n**Prepared for ${s.customer} · ${s.sector}**\n\n${s.summary}\n\n${proposalSections(
    s,
  )
    .map(
      (section) =>
        `## ${section.heading.replace(/^\d+ \/ /, '')}\n\n${section.lines.map((x) => `- ${x}`).join('\n')}`,
    )
    .join('\n\n')}\n\n---\n\nPrepared by **Steve Grady**\n\n${footer}\n`;
}
export function filename(s: Scope, extension: string) {
  return `${
    s.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 70)
      .replace(/-$/, '') || 'scopeforge-proposal'
  }.${extension}`;
}
