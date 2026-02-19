import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('export module', async ({ page }) => {
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
    holder.id = 'export-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.tabulatorInstance = new Tabulator(holder, {
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' }
      ],
      columns: [
        { title: 'ID', field: 'id', htmlOutput: true, titleHtmlOutput: 'Identifier' },
        { title: 'Value', field: 'value' }
      ],
      htmlOutputConfig: { delimiter: ',' }
    })
  })

  await test.step('getHtml API function is present', async () => {
    const present = await page.evaluate(() => typeof window.tabulatorInstance.getHtml === 'function')
    expect(present).toBe(true)
  })

  await test.step('getHtml returns HTML table output', async () => {
    const html = await page.evaluate(() => window.tabulatorInstance.getHtml('active', false))
    expect(html).toContain('<table')
    expect(html).toContain('Identifier')
    expect(html).toContain('A')
    expect(html).toContain('B')
  })

  await test.step('column htmlOutput and titleHtmlOutput options present', async () => {
    const colOpts = await page.evaluate(() => {
      const col = window.tabulatorInstance.getColumn('id')
      return {
        htmlOutput: col.getDefinition().htmlOutput,
        titleHtmlOutput: col.getDefinition().titleHtmlOutput
      }
    })
    expect(colOpts.htmlOutput).toBe(true)
    expect(colOpts.titleHtmlOutput).toBe('Identifier')
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
