const trackedKeys = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'LLM_PROVIDER',
  'LLM_MODEL',
  'FORGE_ACCESS_TOKEN',
] as const;

for (const key of trackedKeys) delete process.env[key];

process.env.PROMPTFOO_DISABLE_TELEMETRY = '1';
process.env.PROMPTFOO_DISABLE_SHARING = '1';
process.env.PROMPTFOO_DISABLE_UPDATE = '1';

let networkRequests = 0;

globalThis.fetch = async (input: RequestInfo | URL) => {
  networkRequests += 1;
  const target =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  throw new Error(
    `Eval blocked a network request to ${target.slice(0, 120)}`,
  );
};

export function takeNetworkRequests() {
  const count = networkRequests;
  networkRequests = 0;
  return count;
}
