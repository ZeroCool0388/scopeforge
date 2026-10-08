import type { Scope, Section } from './schema';
export const sectionKeys: Record<Section, (keyof Scope)[]> = {
  overview: ['title', 'summary'],
  goals: ['goals'],
  boundaries: ['inScope', 'outOfScope'],
  assumptions: ['assumptions'],
  questions: ['questions'],
  phases: ['phases'],
  effort: ['effort'],
  risks: ['risks'],
  metrics: ['metrics'],
};
export function replaceSection(
  current: Scope,
  next: Scope,
  section: Section,
): Scope {
  const patch = Object.fromEntries(
    sectionKeys[section].map((key) => [key, next[key]]),
  );
  return { ...current, ...patch };
}
