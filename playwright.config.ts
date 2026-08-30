import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'line' : [['list'], ['html', { open: 'never' }]],
  use: {
    // The IPv4 literal on both sides. Vite binds [::1] by default while
    // Chromium resolves `localhost` to 127.0.0.1 first, so the browser is
    // refused by a server that was running the whole time and the suite reports
    // every test failing for one missing bind.
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5288',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          // `npx vite`, not `pnpm vite`: Playwright kills the process it
          // spawned, and spawning pnpm means it kills pnpm while vite carries
          // on orphaned, holding the port.
          command: process.env.BUILT
            ? 'npx vite preview --host 127.0.0.1 --port 5288 --strictPort'
            : 'npx vite --host 127.0.0.1 --port 5288 --strictPort',
          url: 'http://127.0.0.1:5288',
          // Reuse is the default and it is what makes a suite unreliable: the
          // same tree reports a different number of failures each run, none of
          // them about the code.
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
})
