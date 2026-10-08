import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import index from '@/data/briefs/index.json';
import { ScopeSchema, BriefSchema, questionGroups } from '@/lib/schema';
import { estimateEffort } from '@/lib/effort';
import { heuristicDraft } from '@/lib/heuristic';
import { buildMarkdown } from '@/lib/proposal';
import { replaceSection } from '@/lib/sections';
const fixture = (id: string, alt = false) =>
  JSON.parse(
    readFileSync(`data/mock-scopes/${id}${alt ? '.alt' : ''}.json`, 'utf8'),
  );
describe('sample data and commercial safeguards', () => {
  for (const item of index) {
    it(`${item.sector} has valid fixtures and a credible complete scope`, () => {
      for (const alt of [false, true]) {
        const scope = ScopeSchema.parse(fixture(item.id, alt));
        expect(scope.outOfScope.length).toBeGreaterThan(0);
        expect(scope.effort).toEqual(estimateEffort(scope.effort));
        expect(scope.phases).toHaveLength(5);
        for (const group of questionGroups)
          expect(scope.questions.some((q) => q.group === group)).toBe(true);
      }
      expect(
        readFileSync(`data/briefs/${item.filename}`, 'utf8').startsWith(
          'SYNTHETIC DEMO DATA. Fictional company. Not real.',
        ),
      ).toBe(true);
    });
  }
  it('rejects missing out-of-scope and absent question groups', () => {
    const s = fixture(index[0].id);
    expect(ScopeSchema.safeParse({ ...s, outOfScope: [] }).success).toBe(false);
    expect(
      ScopeSchema.safeParse({
        ...s,
        questions: s.questions.filter(
          (q: { group: string }) => q.group !== 'Compliance',
        ),
      }).success,
    ).toBe(false);
  });
  it('rejects inverted phase and effort ranges', () => {
    const s = fixture(index[0].id);
    s.phases[0].duration = { min: 4, max: 1 };
    expect(ScopeSchema.safeParse(s).success).toBe(false);
  });
  it('handles arbitrary free text without inventing a customer', () => {
    const s = heuristicDraft(
      BriefSchema.parse({
        brief:
          'We need AI to summarise support tickets. SSO and audit history matter. Can it integrate with our systems?',
      }),
    );
    expect(ScopeSchema.safeParse(s).success).toBe(true);
    expect(s.customer).toBe('Fictional demo customer');
    expect(s.effort.drivers.map((d) => d.id)).toContain('sso');
    expect(s.summary).toContain('support tickets');
  });
  it('exports edits, author and synthetic disclaimer', () => {
    const s = fixture(index[3].id);
    s.questions[0].question = 'Which sponsor approves the pilot?';
    const md = buildMarkdown(s);
    expect(md).toContain('Which sponsor approves the pilot?');
    expect(md).toContain('Steve Grady');
    expect(md).toContain('Synthetic demo — fictional customer');
    expect(md).toContain('not a quote');
  });
  it('section replacement preserves unrelated manual edits', () => {
    const s = fixture(index[3].id);
    s.goals[0] = 'Manual outcome agreed with sponsor';
    const updated = replaceSection(s, fixture(index[3].id, true), 'questions');
    expect(updated.goals[0]).toBe(s.goals[0]);
    expect(updated.questions).not.toEqual(s.questions);
  });
});
describe('deterministic effort engine', () => {
  it.each([
    ['Small', 3, 5],
    ['Medium', 6, 10],
    ['Large', 12, 20],
  ] as const)('maps %s to its base range', (size, min, max) =>
    expect(estimateEffort({ size, drivers: [] })).toMatchObject({ min, max }),
  );
  it('adds bounded drivers and ignores duplicate IDs', () => {
    expect(
      estimateEffort({
        size: 'Medium',
        drivers: [
          { id: 'integrations', detail: 'Two systems' },
          { id: 'sso', detail: 'Pilot identity' },
          { id: 'integrations', detail: 'Same driver' },
        ],
      }),
    ).toMatchObject({ min: 9, max: 16 });
  });
  it('rejects an unknown driver rather than producing NaN', () =>
    expect(() =>
      estimateEffort({
        size: 'Medium',
        drivers: [{ id: 'unknown', detail: 'Bad' }],
      } as never),
    ).toThrow());
});
