import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3033', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3033',
    reuseExistingServer: !process.env.CI,
    env: { OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', LLM_PROVIDER: '' },
  },
  reporter: 'list',
});
