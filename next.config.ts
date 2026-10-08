import type { NextConfig } from 'next';
const config: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: { root: process.cwd() },
  devIndicators: false,
  outputFileTracingIncludes: {
    '/api/forge': ['./data/briefs/**/*', './data/mock-scopes/**/*'],
    '/api/forge/section': ['./data/briefs/**/*', './data/mock-scopes/**/*'],
    '/': ['./data/briefs/**/*'],
  },
};
export default config;
