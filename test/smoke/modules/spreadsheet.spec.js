import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('spreadsheet module', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  await page.evaluate(() => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'spreadsheet-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.tabulatorInstance = new Tabulator(holder, {
      spreadsheet: true,
      spreadsheetRows: 3,
      spreadsheetColumns: 3,
      spreadsheetData: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ],
      spreadsheetColumnDefinition: { width: 120 },
      spreadsheetOutputFull: false,
      spreadsheetSheets: false,
      spreadsheetSheetTabs: false,
      spreadsheetSheetTabsElement: false,
      columns: []
    })
  })

  await test.step('spreadsheet option enables module', async () => {
    const modulePresent = await page.evaluate(() => !!window.tabulatorInstance.modules.spreadsheet)
    expect(modulePresent).toBe(true)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
