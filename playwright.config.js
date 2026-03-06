import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium', channel: 'msedge' }
    }
  ]
})
