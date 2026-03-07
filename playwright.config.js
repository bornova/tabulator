import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', channel: 'chromium', headless: true }
    }
  ]
})
