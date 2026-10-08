import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  historyEntry,
  saveHistory,
  readHistory,
  clearHistory,
} from '@/lib/history';
import { BriefSchema, ScopeSchema } from '@/lib/schema';
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());
function entry() {
  return historyEntry(
    BriefSchema.parse({
      brief: 'A synthetic pilot brief for a customer support workflow.',
      accessToken: 'test-only-never-persist',
    }),
    {
      scope: ScopeSchema.parse(
        JSON.parse(
          readFileSync(
            'data/mock-scopes/04-fintech-kpi-narrative.json',
            'utf8',
          ),
        ),
      ),
      mode: 'demo',
      source: 'fixture',
      notice: 'Synthetic fixture',
    },
  );
}
it('caps saved drafts at five and excludes access tokens', () => {
  saveHistory(Array.from({ length: 7 }, entry));
  const saved = readHistory();
  expect(saved).toHaveLength(5);
  expect(JSON.stringify(saved)).not.toContain('test-only-never-persist');
  expect(saved[0].result.scope.outOfScope.length).toBeGreaterThan(0);
});
it('clears drafts and recovers from malformed local storage', () => {
  saveHistory([entry()]);
  clearHistory();
  expect(readHistory()).toEqual([]);
  localStorage.setItem('scopeforge.history.v1', '{invalid');
  expect(readHistory()).toEqual([]);
});
