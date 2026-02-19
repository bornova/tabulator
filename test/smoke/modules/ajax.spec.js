import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('ajax module', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  const result = await page.evaluate(() => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'ajax-module-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    const table = new Tabulator(holder, {
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
      ]
    })
    return { modulePresent: !!table.modules.ajax }
  })
  expect(result.modulePresent).toBe(true)
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
