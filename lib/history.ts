import { z } from 'zod';
import {
  ScopeSchema,
  BriefSchema,
  type ForgeResult,
  type BriefInput,
} from './schema';
const storedInput = BriefSchema.omit({ accessToken: true });
const EntrySchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  input: storedInput,
  result: z.object({
    scope: ScopeSchema,
    mode: z.enum(['demo', 'live']),
    source: z.enum(['fixture', 'heuristic', 'llm']),
    notice: z.string(),
    provider: z.string().optional(),
  }),
});
export type HistoryEntry = z.infer<typeof EntrySchema>;
const key = 'scopeforge.history.v1';
export function readHistory(): HistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return z.array(EntrySchema).parse(raw).slice(0, 5);
  } catch {
    return [];
  }
}
export function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(key, JSON.stringify(entries.slice(0, 5)));
}
export function historyEntry(
  input: BriefInput,
  result: ForgeResult,
): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input: storedInput.parse(input),
    result,
  };
}
export function clearHistory() {
  localStorage.removeItem(key);
}
