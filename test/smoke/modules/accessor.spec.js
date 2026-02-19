import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('accessor module', async ({ page }) => {
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
    holder.id = 'accessor-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.tabulatorInstance = new Tabulator(holder, {
      data: [
        { id: 1, value: 10 },
        { id: 2, value: 20 }
      ],
      columns: [
        {
          title: 'ID',
          field: 'id'
        },
        {
          title: 'Value',
          field: 'value',
          accessor: (v) => v * 2,
          accessorParams: {},
          accessorData: (v) => v + 1,
          accessorDataParams: {},
          accessorDownload: (v) => v + 100,
          accessorDownloadParams: {},
          accessorClipboard: (v) => v + 200,
          accessorClipboardParams: {},
          accessorPrint: (v) => v + 300,
          accessorPrintParams: {},
          accessorHtmlOutput: (v) => v + 400,
          accessorHtmlOutputParams: {}
        }
      ]
    })
  })

  await test.step('accessor option applies function', async () => {
    const actual = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const row = window.tabulatorInstance.getRows()[0]
      return mod.transformRow(row._row, '').value
    })
    expect(actual).toBe(20)
  })

  await test.step('accessorData option applies function', async () => {
    const value = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const row = window.tabulatorInstance.getRows()[0]
      return mod.transformRow(row._row, 'data').value === 11
    })
    expect(value).toBe(true)
  })

  await test.step('accessorDownload option applies function', async () => {
    const value = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const row = window.tabulatorInstance.getRows()[0]
      return mod.transformRow(row._row, 'download').value === 110
    })
    expect(value).toBe(true)
  })

  await test.step('accessorClipboard option applies function', async () => {
    const value = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const row = window.tabulatorInstance.getRows()[0]
      return mod.transformRow(row._row, 'clipboard').value === 210
    })
    expect(value).toBe(true)
  })

  await test.step('accessorPrint option applies function', async () => {
    const value = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const row = window.tabulatorInstance.getRows()[0]
      return mod.transformRow(row._row, 'print').value === 310
    })
    expect(value).toBe(true)
  })

  await test.step('accessorHtmlOutput option applies function', async () => {
    const value = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const row = window.tabulatorInstance.getRows()[0]
      return mod.transformRow(row._row, 'htmlOutput').value === 410
    })
    expect(value).toBe(true)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
