/* eslint-disable @typescript-eslint/no-require-imports -- Node require hook for the eval process */
const Module = require('node:module');
const path = require('node:path');

const stub = path.join(__dirname, 'server-only-stub.cjs');
const original = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'server-only') return stub;
  return original.call(this, request, parent, isMain, options);
};

for (const key of [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'LLM_PROVIDER',
  'LLM_MODEL',
  'FORGE_ACCESS_TOKEN',
]) {
  delete process.env[key];
}

process.env.PROMPTFOO_DISABLE_TELEMETRY = '1';
process.env.PROMPTFOO_DISABLE_SHARING = '1';
process.env.PROMPTFOO_DISABLE_UPDATE = '1';
