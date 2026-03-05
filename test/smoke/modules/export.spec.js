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

  await test.step('columnVisCheck handles explicit values, function, defaults, and row headers', async () => {
    const result = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.export
      mod.colVisProp = 'htmlOutput'
      mod.config = {}

      const visibleColumn = {
        definition: { htmlOutput: true },
        visible: true,
        field: 'name'
      }

      const hiddenColumn = {
        definition: { htmlOutput: false },
        visible: true,
        field: 'name'
      }

      let functionCalled = false
      const funcColumn = {
        definition: {
          htmlOutput() {
            functionCalled = true
            return true
          }
        },
        visible: true,
        field: 'name',
        getComponent: () => ({})
      }

      const defaultColumn = {
        definition: {},
        visible: true,
        field: 'name'
      }

      mod.config.rowHeaders = false
      const rowHeaderColumn = {
        definition: {},
        visible: true,
        field: 'name',
        isRowHeader: true
      }

      return {
        visibleResult: mod.columnVisCheck(visibleColumn),
        hiddenResult: mod.columnVisCheck(hiddenColumn),
        functionResult: mod.columnVisCheck(funcColumn),
        functionCalled,
        defaultResult: mod.columnVisCheck(defaultColumn),
        defaultExpected: defaultColumn.visible && defaultColumn.field,
        rowHeaderResult: mod.columnVisCheck(rowHeaderColumn)
      }
    })

    expect(result.visibleResult).toBe(true)
    expect(result.hiddenResult).toBe(false)
    expect(result.functionResult).toBe(true)
    expect(result.functionCalled).toBe(true)
    expect(result.defaultResult).toBe(result.defaultExpected)
    expect(result.rowHeaderResult).toBe(false)
  })

  await test.step('rowLookup resolves string and function ranges', async () => {
    const result = await page.evaluate(() => {
      const table = window.tabulatorInstance
      const mod = table.modules.export
      const rows = table.getRows().map((row) => row._row)

      const originalFindRow = table.rowManager.findRow
      table.rowManager.findRow = (lookup) => {
        if (lookup === 1) return rows[0]
        if (lookup === 2) return rows[1]
        return false
      }

      const originalRowLookups = mod.constructor.rowLookups
      mod.constructor.rowLookups = {
        ...originalRowLookups,
        active: () => rows
      }

      const stringLookup = mod.rowLookup('active')
      const functionLookup = mod.rowLookup(() => [1, 2])

      table.rowManager.findRow = originalFindRow
      mod.constructor.rowLookups = originalRowLookups

      return {
        stringLookupCount: stringLookup.length,
        functionLookupCount: functionLookup.length,
        functionLookupIds: functionLookup.map((row) => row.data.id)
      }
    })

    expect(result.stringLookupCount).toBe(2)
    expect(result.functionLookupCount).toBe(2)
    expect(result.functionLookupIds).toEqual([1, 2])
  })

  await test.step('generateExportList sets module state and assembles header/body rows', async () => {
    const result = await page.evaluate(() => {
      const table = window.tabulatorInstance
      const mod = table.modules.export

      const originalColumnLookups = mod.constructor.columnLookups
      const originalColumnVisCheck = mod.columnVisCheck
      const originalHeadersToExportRows = mod.headersToExportRows
      const originalBodyToExportRows = mod.bodyToExportRows
      const originalRowLookup = mod.rowLookup
      const originalGenerateColumnGroupHeaders = mod.generateColumnGroupHeaders

      const columns = table.columnManager.columnsByIndex
      mod.constructor.columnLookups = {
        ...originalColumnLookups,
        active: () => columns
      }

      let columnVisCheckCalled = false
      mod.columnVisCheck = () => {
        columnVisCheckCalled = true
        return true
      }
      mod.headersToExportRows = () => ['header1', 'header2']
      mod.bodyToExportRows = () => ['row1', 'row2']
      mod.rowLookup = () => ['rowData1', 'rowData2']
      mod.generateColumnGroupHeaders = () => ['group1', 'group2']

      const output = mod.generateExportList({}, true, 'active', 'htmlOutput')

      mod.constructor.columnLookups = originalColumnLookups
      mod.columnVisCheck = originalColumnVisCheck
      mod.headersToExportRows = originalHeadersToExportRows
      mod.bodyToExportRows = originalBodyToExportRows
      mod.rowLookup = originalRowLookup
      mod.generateColumnGroupHeaders = originalGenerateColumnGroupHeaders

      return {
        output,
        cloneTableStyle: mod.cloneTableStyle,
        colVisProp: mod.colVisProp,
        colVisPropAttach: mod.colVisPropAttach,
        columnVisCheckCalled
      }
    })

    expect(result.output).toEqual(['header1', 'header2', 'row1', 'row2'])
    expect(result.cloneTableStyle).toBe(true)
    expect(result.colVisProp).toBe('htmlOutput')
    expect(result.colVisPropAttach).toBe('HtmlOutput')
    expect(result.columnVisCheckCalled).toBe(true)
  })

  await test.step('getHtml forwards defaults and custom parameters', async () => {
    const result = await page.evaluate(() => {
      const table = window.tabulatorInstance
      const mod = table.modules.export

      const originalGenerateExportList = mod.generateExportList
      const originalGenerateHTMLTable = mod.generateHTMLTable

      const calls = []
      mod.generateExportList = (...args) => {
        calls.push(args)
        return ['mock list']
      }
      mod.generateHTMLTable = () => '<table>Mock HTML</table>'

      const defaultHtml = mod.getHtml(true)
      const customHtml = mod.getHtml('active', true, { custom: false }, 'downloadOutput')

      mod.generateExportList = originalGenerateExportList
      mod.generateHTMLTable = originalGenerateHTMLTable

      return {
        defaultCall: calls[0],
        customCall: calls[1],
        defaultHtml,
        customHtml
      }
    })

    expect(result.defaultCall).toEqual([{ delimiter: ',' }, undefined, true, 'htmlOutput'])
    expect(result.customCall).toEqual([{ custom: false }, true, 'active', 'downloadOutput'])
    expect(result.defaultHtml).toBe('<table>Mock HTML</table>')
    expect(result.customHtml).toBe('<table>Mock HTML</table>')
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
