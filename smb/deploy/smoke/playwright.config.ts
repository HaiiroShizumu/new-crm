import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.STAGING_URL ?? 'https://dev.crm-systems-ai.ru';

const httpCredentials =
  process.env.STAGING_BASIC_AUTH_USER && process.env.STAGING_BASIC_AUTH_PASSWORD
    ? {
        username: process.env.STAGING_BASIC_AUTH_USER,
        password: process.env.STAGING_BASIC_AUTH_PASSWORD,
      }
    : undefined;

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    httpCredentials,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
});
