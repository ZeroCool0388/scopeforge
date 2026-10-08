import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const providerMocks = vi.hoisted(() => ({
  openai: vi.fn(() => ({ provider: 'openai' })),
  anthropic: vi.fn(() => ({ provider: 'anthropic' })),
  generate: vi.fn(),
}));
vi.mock('ai', () => ({ generateObject: providerMocks.generate }));
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: () => providerMocks.openai }));
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: () => providerMocks.anthropic,
}));
import { POST } from '@/app/api/forge/route';
import { POST as sectionPOST } from '@/app/api/forge/section/route';
import { getMode } from '@/lib/forge';
const id = '04-fintech-kpi-narrative';
const brief = readFileSync(`data/briefs/${id}.md`, 'utf8');
const scope = JSON.parse(readFileSync(`data/mock-scopes/${id}.json`, 'utf8'));
function request(body: unknown) {
  return new Request('http://localhost/api/forge', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
  });
}
beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', '');
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.stubEnv('LLM_PROVIDER', '');
  vi.stubEnv('LLM_MODEL', '');
  vi.stubEnv('FORGE_ACCESS_TOKEN', '');
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllEnvs());
describe('forge APIs', () => {
  it('returns matching demo fixtures without credentials', async () => {
    const r = await POST(request({ brief, sampleId: id }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.mode).toBe('demo');
    expect(b.source).toBe('fixture');
    expect(b.scope.title).toBe(scope.title);
    expect(providerMocks.generate).not.toHaveBeenCalled();
  });
  it('does not let a sample ID override a changed brief', async () => {
    const r = await POST(
      request({
        brief: 'We need help summarising support tickets in a bounded pilot.',
        sampleId: id,
      }),
    );
    expect((await r.json()).source).toBe('heuristic');
  });
  it('regenerates only the requested section in demo mode', async () => {
    const current = { ...scope, title: 'My edited title' };
    const r = await sectionPOST(
      request({
        input: { brief },
        scope: current,
        section: 'questions',
        alternate: true,
      }),
    );
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.scope.title).toBe(current.title);
    expect(b.scope.questions).not.toEqual(scope.questions);
  });
  it('provides safe errors for malformed and overlarge requests', async () => {
    expect((await POST(request({ brief: 'tiny' }))).status).toBe(400);
    expect((await POST(request({ brief: 'x'.repeat(100001) }))).status).toBe(
      413,
    );
    const r = await POST(
      new Request('http://localhost/api/forge', {
        method: 'POST',
        body: '{invalid',
      }),
    );
    expect(r.status).toBe(400);
  });
  it.each(['openai', 'anthropic'])(
    'selects the %s provider and computes effort independently',
    async (provider) => {
      vi.stubEnv('LLM_PROVIDER', provider);
      vi.stubEnv(
        provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY',
        'test-only-placeholder',
      );
      providerMocks.generate.mockResolvedValue({
        object: { ...scope, effort: { ...scope.effort, min: 999, max: 999 } },
      });
      const r = await POST(request({ brief }));
      expect(r.status).toBe(200);
      const b = await r.json();
      expect(b.mode).toBe('live');
      expect(b.provider).toBe(provider);
      expect(b.scope.effort.min).toBe(12);
      expect(
        providerMocks[provider as 'openai' | 'anthropic'],
      ).toHaveBeenCalled();
    },
  );
  it('allows an explicit demo fallback when the live provider fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-only-placeholder');
    providerMocks.generate.mockRejectedValue(
      new Error('Confidential provider diagnostics'),
    );
    const failed = await POST(request({ brief }));
    expect(failed.status).toBe(502);
    expect(JSON.stringify(await failed.json())).not.toContain('Confidential');
    const fallback = await POST(request({ brief, forceDemo: true }));
    expect((await fallback.json()).mode).toBe('demo');
  });
  it('enforces an optional live gate but permits demo requests', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-only-placeholder');
    vi.stubEnv('FORGE_ACCESS_TOKEN', 'test-only-gate');
    expect(getMode().gated).toBe(true);
    expect((await POST(request({ brief }))).status).toBe(401);
    expect((await POST(request({ brief, forceDemo: true }))).status).toBe(200);
  });
});
