import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('import module options smoke', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  await test.step('import module is present', async () => {
    const present = await page.evaluate(() => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.id = 'import-table'
      holder.style.width = '600px'
      root.appendChild(holder)

      window.tabulatorInstance = new Tabulator(holder, {
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' }
        ],
        dataLoader: false,
        dataLoaderLoading: false
      })
      return !!window.tabulatorInstance.modules.import
    })
    expect(present).toBe(true)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
