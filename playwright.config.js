import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/smoke',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', channel: 'msedge' }
    }
  ]
})
