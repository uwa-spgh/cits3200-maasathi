import { defineConfig, devices } from '@playwright/test';

/**
 * MVP E2E harness for MaaSathi (browser / Vite / localStorage path).
 * Journeys: see docs/e2e-p0-acceptance-journeys.md
 *
 * Browser selection:
 * - Local/dev default: system Google Chrome (`channel: 'chrome'`) — no Playwright browser download.
 * - Other machine / CI: set CI=1 (or PW_BROWSER=playwright) and run `playwright install chromium`.
 */
const useSystemChrome =
  process.env.PW_BROWSER !== 'playwright' && process.env.CI !== 'true' && process.env.CI !== '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'en-GB'
  },
  projects: [
    {
      name: useSystemChrome ? 'chrome' : 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemChrome ? { channel: 'chrome' as const } : {})
      }
    }
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
