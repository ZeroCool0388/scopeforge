import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import index from '@/data/briefs/index.json';
import { ScopeSchema, type SampleBrief } from './schema';
export async function getSamples(): Promise<SampleBrief[]> {
  return Promise.all(
    index.map(async (item) => ({
      ...item,
      sector: item.sector as SampleBrief['sector'],
      brief: await readFile(
        path.join(process.cwd(), 'data/briefs', item.filename),
        'utf8',
      ),
    })),
  );
}
export async function getFixture(id: string, alternate = false) {
  if (!index.some((s) => s.id === id)) return null;
  const raw = JSON.parse(
    await readFile(
      path.join(
        process.cwd(),
        'data/mock-scopes',
        `${id}${alternate ? '.alt' : ''}.json`,
      ),
      'utf8',
    ),
  );
  return ScopeSchema.parse(raw);
}
