import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('localize module is present', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)
  const present = await page.evaluate(() => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'localize-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    const table = new Tabulator(holder, {
      columns: [{ title: 'Name', field: 'name' }],
      data: []
    })
    return !!table.modules.localize
  })
  expect(present).toBe(true)
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
