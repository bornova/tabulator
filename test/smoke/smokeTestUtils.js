import { expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export function getSmokeFixtureUrl(importMetaUrl) {
  const dirname = path.dirname(fileURLToPath(importMetaUrl))
  const localFixture = path.resolve(dirname, 'tabulator.smoke.html')

  if (existsSync(localFixture)) {
    return pathToFileURL(localFixture).toString()
  }

  return pathToFileURL(path.resolve(dirname, '../tabulator.smoke.html')).toString()
}

export function attachErrorCollectors(page) {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  return { pageErrors, consoleErrors }
}

export function expectNoBrowserErrors(pageErrors, consoleErrors) {
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
}
