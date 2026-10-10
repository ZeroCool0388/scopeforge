import { z } from 'zod';
import { readBody, ApiError, guardLive } from '@/lib/api';
import { estimateEffort } from '@/lib/effort';
import { forge, forgeSection, getMode } from '@/lib/forge';
import { heuristicDraft } from '@/lib/heuristic';
import { buildMarkdown } from '@/lib/proposal';
import {
  BriefSchema,
  ScopeSchema,
  SectionSchema,
  sectors,
  type BriefInput,
  type ForgeResult,
  type Scope,
} from '@/lib/schema';
import { getFixture, getSamples } from '@/lib/samples';

// Recorded fixtures and local rules only. This module never calls a model.

const ENV_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'LLM_PROVIDER',
  'LLM_MODEL',
  'FORGE_ACCESS_TOKEN',
] as const;

const EnvSchema = z.record(z.string(), z.string()).optional();
const ForgeSchema = z.object({
  task: z.literal('forge'),
  sampleId: z.string().optional(),
  brief: z.string().optional(),
  collapseWhitespace: z.boolean().optional(),
  sector: z.enum(sectors).optional(),
  forceDemo: z.boolean().optional(),
  accessToken: z.string().optional(),
  env: EnvSchema,
});
const SectionTaskSchema = z.object({
  task: z.literal('section'),
  sampleId: z.string().optional(),
  brief: z.string().optional(),
  sector: z.enum(sectors).optional(),
  section: SectionSchema,
  alternate: z.boolean().default(true),
  editedTitle: z.string().optional(),
  forceDemo: z.boolean().optional(),
  env: EnvSchema,
});
const ParseSchema = z.object({
  task: z.literal('parse'),
  briefLength: z.number().int().min(1).max(20000),
});
const ModeSchema = z.object({
  task: z.literal('mode'),
  env: EnvSchema,
});
const ProposalSchema = z.object({
  task: z.literal('proposal'),
  sampleId: z.string(),
});

function noModel() {
  return { calledModel: false as const, networkRequests: 0 };
}

function issueText(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join('; ');
}

async function withEnv<T>(
  env: Record<string, string> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = ENV_KEYS.map((key) => [key, process.env[key]] as const);
  for (const key of ENV_KEYS) {
    const value = env?.[key];
    if (value) process.env[key] = value;
    else delete process.env[key];
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function gateRequest() {
  return new Request('http://127.0.0.1/api/forge', {
    method: 'POST',
    headers: { 'x-forwarded-for': crypto.randomUUID() },
  });
}

function inspectGate(input: { forceDemo?: boolean; accessToken?: string }) {
  const live = getMode().mode === 'live' && !input.forceDemo;
  try {
    guardLive(gateRequest(), input);
    return live ? 'open' : 'skipped';
  } catch (error) {
    if (error instanceof ApiError) return error.code;
    throw error;
  }
}

function modeFields() {
  const mode = getMode();
  return {
    configuredMode: mode.mode,
    configuredProvider: mode.provider,
    gated: mode.gated,
  };
}

function present(
  result: ForgeResult,
  brief: string,
  gate: string,
  extra: Record<string, unknown> = {},
) {
  const scope = result.scope;
  const groups: string[] = [];
  for (const question of scope.questions) {
    if (!groups.includes(question.group)) groups.push(question.group);
  }
  const again = estimateEffort(scope.effort);
  return {
    blockedLive: false,
    rejected: false,
    mode: result.mode,
    source: result.source,
    notice: result.notice,
    gate,
    ...modeFields(),
    customer: scope.customer,
    sector: scope.sector,
    title: scope.title,
    summary: scope.summary,
    goalCount: scope.goals.length,
    phaseCount: scope.phases.length,
    phaseNames: scope.phases.map((phase) => phase.name),
    groups,
    outOfScopeCount: scope.outOfScope.length,
    firstOut: scope.outOfScope[0] ?? null,
    assumptionCount: scope.assumptions.length,
    riskCount: scope.risks.length,
    metricCount: scope.metrics.length,
    effortSize: scope.effort.size,
    effortMin: scope.effort.min,
    effortMax: scope.effort.max,
    driverIds: scope.effort.drivers.map((driver) => driver.id),
    matchesModel: again.min === scope.effort.min && again.max === scope.effort.max,
    firstGoal: scope.goals[0] ?? null,
    firstQuestion: scope.questions[0]?.question ?? null,
    syntheticBanner: brief.startsWith(
      'SYNTHETIC DEMO DATA. Fictional company. Not real.',
    ),
    rangesValid:
      scope.effort.max >= scope.effort.min &&
      scope.phases.every((phase) => phase.duration.max >= phase.duration.min),
    error: null,
    ...extra,
    ...noModel(),
  };
}

function blocked(gate: string) {
  return {
    blockedLive: true,
    rejected: false,
    mode: 'live' as const,
    source: null,
    notice: null,
    gate,
    ...modeFields(),
    customer: null,
    title: null,
    summary: null,
    error: null,
    ...noModel(),
  };
}

async function loadSample(id: string) {
  const sample = (await getSamples()).find((item) => item.id === id);
  if (!sample) throw new Error(`Unknown sample brief: ${id}`);
  return sample;
}

async function resolveBrief(vars: {
  sampleId?: string;
  brief?: string;
  collapseWhitespace?: boolean;
}) {
  let brief = vars.brief;
  if (!brief) {
    if (!vars.sampleId) throw new Error('A brief or sample id is required.');
    brief = (await loadSample(vars.sampleId)).brief;
  }
  if (vars.collapseWhitespace) brief = brief.trim().replace(/\s+/g, ' ');
  return brief;
}

function briefInput(
  brief: string,
  vars: { sector?: BriefInput['sector']; forceDemo?: boolean; accessToken?: string },
) {
  return BriefSchema.safeParse({
    brief,
    ...(vars.sector ? { sector: vars.sector } : {}),
    ...(vars.forceDemo !== undefined ? { forceDemo: vars.forceDemo } : {}),
    ...(vars.accessToken !== undefined ? { accessToken: vars.accessToken } : {}),
  });
}

async function forgeTask(vars: z.infer<typeof ForgeSchema>) {
  return withEnv(vars.env, async () => {
    const brief = await resolveBrief(vars);
    const parsed = briefInput(brief, vars);
    if (!parsed.success) {
      return {
        blockedLive: false,
        rejected: true,
        error: issueText(parsed.error),
        mode: null,
        source: null,
        ...noModel(),
      };
    }
    if (getMode().mode === 'live' && !parsed.data.forceDemo) {
      return blocked(inspectGate(parsed.data));
    }
    const result = await forge(parsed.data);
    return present(result, brief, inspectGate(parsed.data));
  });
}

async function sectionTask(vars: z.infer<typeof SectionTaskSchema>) {
  return withEnv(vars.env, async () => {
    const brief = vars.brief ?? (await loadSample(vars.sampleId ?? '')).brief;
    const parsed = briefInput(brief, vars);
    if (!parsed.success) {
      return {
        blockedLive: false,
        rejected: true,
        error: issueText(parsed.error),
        ...noModel(),
      };
    }
    if (getMode().mode === 'live' && !parsed.data.forceDemo) {
      return blocked(inspectGate(parsed.data));
    }
    const current: Scope = vars.sampleId
      ? ((await getFixture(vars.sampleId)) as Scope)
      : heuristicDraft(parsed.data);
    if (!current) throw new Error(`No fixture for ${vars.sampleId}.`);
    const keptGoal = current.goals[2] ?? null;
    const keptFirstGoal = current.goals[0] ?? null;
    if (vars.editedTitle) current.title = vars.editedTitle;
    const result = await forgeSection(
      parsed.data,
      current,
      vars.section,
      vars.alternate,
    );
    return present(result, brief, inspectGate(parsed.data), {
      keptGoal,
      keptFirstGoal,
    });
  });
}

function parseEdges() {
  const message = (brief: string, sector?: string) => {
    const parsed = BriefSchema.safeParse(
      sector ? { brief, sector } : { brief },
    );
    return parsed.success ? null : issueText(parsed.error);
  };
  const emptyMessage = message('');
  const shortMessage = message('tiny');
  const blankMessage = message(' \n\t ');
  const badSectorMessage = message('x'.repeat(30), 'Retail');
  return {
    rejected: true,
    emptyMessage,
    shortMessage,
    blankMessage,
    badSectorMessage,
    error: null,
    ...noModel(),
  };
}

function parseLength(length: number) {
  const parsed = BriefSchema.safeParse({ brief: 'x'.repeat(length) });
  return {
    rejected: !parsed.success,
    overlongMessage: parsed.success ? null : issueText(parsed.error),
    error: null,
    ...noModel(),
  };
}

function effortTask() {
  const small = estimateEffort({ size: 'Small', drivers: [] });
  const medium = estimateEffort({ size: 'Medium', drivers: [] });
  const large = estimateEffort({ size: 'Large', drivers: [] });
  const duplicate = estimateEffort({
    size: 'Medium',
    drivers: [
      { id: 'integrations', detail: 'Two systems' },
      { id: 'sso', detail: 'Pilot identity' },
      { id: 'integrations', detail: 'Same driver' },
    ],
  });
  const full = estimateEffort({
    size: 'Large',
    drivers: [
      { id: 'integrations', detail: 'Systems' },
      { id: 'data-readiness', detail: 'Data' },
      { id: 'sso', detail: 'Identity' },
      { id: 'compliance', detail: 'Controls' },
      { id: 'residency', detail: 'Region' },
      { id: 'human-review', detail: 'Review' },
    ],
  });
  return {
    smallMin: small.min,
    smallMax: small.max,
    mediumMin: medium.min,
    mediumMax: medium.max,
    largeMin: large.min,
    largeMax: large.max,
    duplicateMin: duplicate.min,
    duplicateMax: duplicate.max,
    duplicateCount: duplicate.drivers.length,
    fullMin: full.min,
    fullMax: full.max,
    fullCount: full.drivers.length,
    error: null,
    ...noModel(),
  };
}

function unknownDriver() {
  try {
    estimateEffort({
      size: 'Medium',
      drivers: [{ id: 'unknown', detail: 'Bad' }],
    } as never);
    return { unknownRejected: false, unknownMessage: null, ...noModel() };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        unknownRejected: true,
        unknownMessage: issueText(error),
        error: null,
        ...noModel(),
      };
    }
    throw error;
  }
}

async function intakeErrors() {
  const capture = async (request: Request) => {
    try {
      await readBody(request);
      return { message: 'accepted', status: 200, code: null as string | null };
    } catch (error) {
      if (error instanceof ApiError) {
        return { message: error.message, status: error.status, code: error.code };
      }
      throw error;
    }
  };
  const empty = await capture(
    new Request('http://127.0.0.1/api/forge', { method: 'POST' }),
  );
  const invalid = await capture(
    new Request('http://127.0.0.1/api/forge', {
      method: 'POST',
      body: '{invalid',
    }),
  );
  const oversized = await capture(
    new Request('http://127.0.0.1/api/forge', {
      method: 'POST',
      body: JSON.stringify({ brief: 'x'.repeat(100001) }),
    }),
  );
  return {
    emptyMessage: empty.message,
    emptyStatus: empty.status,
    emptyCode: empty.code,
    invalidMessage: invalid.message,
    invalidStatus: invalid.status,
    invalidCode: invalid.code,
    oversizedMessage: oversized.message,
    oversizedStatus: oversized.status,
    oversizedCode: oversized.code,
    error: null,
    ...noModel(),
  };
}

async function modeTask(env: Record<string, string> | undefined) {
  return withEnv(env, async () => {
    const mode = getMode();
    return {
      blockedLive: mode.mode === 'live',
      configuredMode: mode.mode,
      configuredProvider: mode.provider,
      gated: mode.gated,
      error: null,
      ...noModel(),
    };
  });
}

async function proposalTask(sampleId: string) {
  const fixture = await getFixture(sampleId);
  if (!fixture) throw new Error(`No fixture for ${sampleId}.`);
  const scope = ScopeSchema.parse({
    ...fixture,
    effort: estimateEffort(fixture.effort),
  });
  return {
    markdown: buildMarkdown(scope),
    customer: scope.customer,
    effortMin: scope.effort.min,
    effortMax: scope.effort.max,
    error: null,
    ...noModel(),
  };
}

export async function runTask(vars: unknown): Promise<Record<string, unknown>> {
  try {
    const task = z.object({ task: z.string() }).parse(vars).task;
    switch (task) {
      case 'forge':
        return await forgeTask(ForgeSchema.parse(vars));
      case 'section':
        return await sectionTask(SectionTaskSchema.parse(vars));
      case 'parse-edges':
        return parseEdges();
      case 'parse':
        return parseLength(ParseSchema.parse(vars).briefLength);
      case 'effort':
        return effortTask();
      case 'effort-unknown':
        return unknownDriver();
      case 'intake':
        return await intakeErrors();
      case 'mode':
        return await modeTask(ModeSchema.parse(vars).env);
      case 'proposal':
        return await proposalTask(ProposalSchema.parse(vars).sampleId);
      default:
        throw new Error(`Unknown eval task: ${task}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        error.issues
          .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
          .join('; '),
      );
    }
    throw error;
  }
}
