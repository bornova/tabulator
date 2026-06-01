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

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    const tabsHost = document.createElement('div')

    holder.id = 'spreadsheet-table'
    holder.style.width = '600px'
    tabsHost.id = 'spreadsheet-tabs-host'

    root.appendChild(holder)
    root.appendChild(tabsHost)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        spreadsheet: true,
        spreadsheetRows: 3,
        spreadsheetColumns: 3,
        spreadsheetData: false,
        spreadsheetColumnDefinition: { width: 120 },
        spreadsheetOutputFull: false,
        spreadsheetSheets: [
          {
            title: 'Sheet A',
            key: 'a',
            data: [
              [1, 2],
              [3, 4]
            ]
          },
          {
            title: 'Sheet B',
            key: 'b',
            data: [[9]]
          }
        ],
        spreadsheetSheetTabs: true,
        spreadsheetSheetTabsElement: '#spreadsheet-tabs-host',
        columns: []
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const functionPresence = {
      setSheets: typeof table.setSheets === 'function',
      addSheet: typeof table.addSheet === 'function',
      getSheets: typeof table.getSheets === 'function',
      getSheetDefinitions: typeof table.getSheetDefinitions === 'function',
      setSheetData: typeof table.setSheetData === 'function',
      getSheet: typeof table.getSheet === 'function',
      getSheetData: typeof table.getSheetData === 'function',
      clearSheet: typeof table.clearSheet === 'function',
      removeSheet: typeof table.removeSheet === 'function',
      activeSheet: typeof table.activeSheet === 'function'
    }

    const tabsCount = tabsHost.querySelectorAll('.tabulator-spreadsheet-tab').length
    const initialSheetCount = table.getSheets().length
    const initialDefinitionsCount = table.getSheetDefinitions().length
    const initialActiveKey = table.modules.spreadsheet.activeSheet.key

    table.activeSheet('b')

    const activeKeyAfterSwitch = table.modules.spreadsheet.activeSheet.key
    const sheetBDataBefore = table.getSheetData('b')

    table.setSheetData('b', [
      [10, undefined],
      [undefined, undefined]
    ])

    const sheetBDataAfterSet = table.getSheetData('b')

    table.clearSheet('b')
    const sheetBDataAfterClear = table.getSheetData('b')

    table.addSheet({
      title: 'Sheet C',
      key: 'c',
      data: [[5, 6]]
    })

    const sheetCountAfterAdd = table.getSheets().length

    table.removeSheet('c')
    const sheetCountAfterRemove = table.getSheets().length

    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => {
      warnings.push(args.map((arg) => String(arg)).join(' '))
    }

    table.setSheets([
      {
        title: 'Only Sheet',
        key: 'only',
        data: [[7, 8, 9]]
      }
    ])

    const sheetCountAfterSetSheets = table.getSheets().length
    const onlySheetData = table.getSheetData('only')
    const missingSheetLookup = table.getSheet('missing')

    table.removeSheet('only')

    const sheetCountAfterRemoveLastAttempt = table.getSheets().length

    console.warn = originalWarn

    const currentColumnDefs = table.getColumnDefinitions()

    return {
      modulePresent: !!table.modules.spreadsheet,
      functionPresence,
      tabsCount,
      initialSheetCount,
      initialDefinitionsCount,
      initialActiveKey,
      activeKeyAfterSwitch,
      sheetBDataBefore,
      sheetBDataAfterSet,
      sheetBDataAfterClear,
      sheetCountAfterAdd,
      sheetCountAfterRemove,
      sheetCountAfterSetSheets,
      sheetCountAfterRemoveLastAttempt,
      onlySheetData,
      missingSheetLookup,
      warnedOnRemoveLast: warnings.some((msg) =>
        msg.includes('Unable to remove sheet, at least one sheet must be active')
      ),
      firstColumnWidth: currentColumnDefs[0]?.width
    }
  })

  expect(result.modulePresent).toBe(true)
  expect(result.functionPresence).toEqual({
    setSheets: true,
    addSheet: true,
    getSheets: true,
    getSheetDefinitions: true,
    setSheetData: true,
    getSheet: true,
    getSheetData: true,
    clearSheet: true,
    removeSheet: true,
    activeSheet: true
  })
  expect(result.tabsCount).toBe(2)
  expect(result.initialSheetCount).toBe(2)
  expect(result.initialDefinitionsCount).toBe(2)
  expect(result.initialActiveKey).toBe('a')
  expect(result.activeKeyAfterSwitch).toBe('b')
  expect(result.sheetBDataBefore).toEqual([[9]])
  expect(result.sheetBDataAfterSet).toEqual([[10]])
  expect(result.sheetBDataAfterClear).toEqual([])
  expect(result.sheetCountAfterAdd).toBe(3)
  expect(result.sheetCountAfterRemove).toBe(2)
  expect(result.sheetCountAfterSetSheets).toBe(1)
  expect(result.sheetCountAfterRemoveLastAttempt).toBe(1)
  expect(result.onlySheetData).toEqual([[7, 8, 9]])
  expect(result.missingSheetLookup).toBe(false)
  expect(result.warnedOnRemoveLast).toBe(true)
  expect(result.firstColumnWidth).toBe(120)

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('spreadsheet module - spreadsheetData option, spreadsheetOutputFull, compatibility warnings', async ({ page }) => {
  const pageErrors = []
  const consoleWarnings = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text())
    }
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const buildTable = (id, options) =>
      new Promise((resolve) => {
        const holder = document.createElement('div')
        holder.id = id
        holder.style.width = '600px'
        root.appendChild(holder)
        const instance = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve({ table: instance, holder }), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve({ table: instance, holder })
        })
      })

    const warnings = []
    const origWarn = console.warn
    console.warn = (...args) => {
      warnings.push(args.join(' '))
      origWarn(...args)
    }

    // spreadsheetData option: pre-populate data for single-sheet spreadsheet
    const { table: dataTable } = await buildTable('spreadsheet-data-table', {
      spreadsheet: true,
      spreadsheetRows: 3,
      spreadsheetColumns: 4,
      spreadsheetOutputFull: false,
      spreadsheetData: [
        [10, 20, 30],
        [40, 50, 60]
      ],
      columns: []
    })

    const sheetData = dataTable.getSheetData()
    // spreadsheetOutputFull: true → includes empty trailing cells
    const { table: fullOutputTable } = await buildTable('spreadsheet-full-output-table', {
      spreadsheet: true,
      spreadsheetRows: 3,
      spreadsheetColumns: 3,
      spreadsheetOutputFull: true,
      spreadsheetData: [[1, 2]],
      columns: []
    })

    const fullSheetData = fullOutputTable.getSheetData()

    // compatibility warnings: data + spreadsheet → warn
    const warnCountBefore = warnings.length
    await buildTable('spreadsheet-compat-data-warn-table', {
      spreadsheet: true,
      spreadsheetRows: 2,
      spreadsheetColumns: 2,
      data: [{ _id: 1 }], // should trigger compatibility warning
      columns: []
    })
    const dataCompatWarn = warnings.slice(warnCountBefore).some((msg) => msg.includes('data option'))

    // compatibility: pagination + spreadsheet → warn
    const warnCountPagination = warnings.length
    await buildTable('spreadsheet-compat-pagination-warn-table', {
      spreadsheet: true,
      spreadsheetRows: 2,
      spreadsheetColumns: 2,
      pagination: true, // should trigger warning
      columns: []
    })
    const paginationCompatWarn = warnings.slice(warnCountPagination).some((msg) => msg.includes('pagination'))

    // compatibility: groupBy + spreadsheet → warn
    const warnCountGroup = warnings.length
    await buildTable('spreadsheet-compat-group-warn-table', {
      spreadsheet: true,
      spreadsheetRows: 2,
      spreadsheetColumns: 2,
      groupBy: 'someField',
      columns: []
    })
    const groupCompatWarn = warnings.slice(warnCountGroup).some((msg) => msg.includes('grouping'))

    // spreadsheetData + spreadsheetSheets → both present warns, spreadsheetData is ignored
    const warnCountBoth = warnings.length
    await buildTable('spreadsheet-both-data-sheets-warn-table', {
      spreadsheet: true,
      spreadsheetRows: 2,
      spreadsheetColumns: 2,
      spreadsheetData: [[1, 2]],
      spreadsheetSheets: [{ title: 'S1', key: 's1', data: [[9]] }],
      columns: []
    })
    const bothDataSheetsWarn = warnings.slice(warnCountBoth).some((msg) => msg.includes('spreadsheetData'))

    console.warn = origWarn

    return {
      sheetData,
      fullSheetDataRowCount: fullSheetData.length,
      fullSheetDataFirstRow: fullSheetData[0],
      dataCompatWarn,
      paginationCompatWarn,
      groupCompatWarn,
      bothDataSheetsWarn,
      fullOutputEnabled: fullOutputTable.options.spreadsheetOutputFull,
      singleSheetCount: dataTable.getSheets().length
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  // spreadsheetData populates cells
  expect(result.sheetData).toEqual([
    [10, 20, 30],
    [40, 50, 60]
  ])

  // spreadsheetOutputFull: true → rows include empty cells to reach column count
  expect(result.fullOutputEnabled).toBe(true)
  expect(result.fullSheetDataFirstRow).toEqual([1, 2, undefined])

  // single-sheet table still has 1 sheet
  expect(result.singleSheetCount).toBe(1)

  // compatibility warnings are emitted
  expect(result.dataCompatWarn).toBe(true)
  expect(result.paginationCompatWarn).toBe(true)
  expect(result.groupCompatWarn).toBe(true)
  expect(result.bothDataSheetsWarn).toBe(true)
})
