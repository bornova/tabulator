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

  await test.step('module initializes allowed types', async () => {
    const value = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      return (
        Array.isArray(mod.allowedTypes) &&
        mod.allowedTypes.includes('data') &&
        mod.allowedTypes.includes('download') &&
        mod.allowedTypes.includes('clipboard')
      )
    })

    expect(value).toBe(true)
  })

  await test.step('lookupAccessor resolves string and direct function', async () => {
    const result = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      mod.constructor.accessors.test = (value) => `${value}-test`

      const stringAccessor = mod.lookupAccessor('test')
      const directFunc = (value) => value
      const directAccessor = mod.lookupAccessor(directFunc)

      return {
        stringAccessorWorks: typeof stringAccessor === 'function' && stringAccessor('value') === 'value-test',
        directAccessorWorks: directAccessor === directFunc
      }
    })

    expect(result.stringAccessorWorks).toBe(true)
    expect(result.directAccessorWorks).toBe(true)
  })

  await test.step('lookupAccessor warns on invalid accessor name', async () => {
    const result = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      const originalWarn = console.warn
      let warned = false

      console.warn = () => {
        warned = true
      }

      const invalidLookup = mod.lookupAccessor('invalid')
      console.warn = originalWarn

      return {
        warned,
        invalidLookupIsFalse: invalidLookup === false
      }
    })

    expect(result.warned).toBe(true)
    expect(result.invalidLookupIsFalse).toBe(true)
  })

  await test.step('initializeColumn sets nested accessor config', async () => {
    const result = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.accessor
      mod.constructor.accessors.test = (value) => value

      const mockColumn = {
        definition: {
          accessor: 'test',
          accessorParams: { test: true }
        },
        modules: {}
      }

      mod.initializeColumn(mockColumn)

      return (
        !!mockColumn.modules.accessor &&
        !!mockColumn.modules.accessor.accessor &&
        typeof mockColumn.modules.accessor.accessor.accessor === 'function'
      )
    })

    expect(result).toBe(true)
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
