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
      onlySheetData,
      missingSheetLookup,
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
  expect(result.onlySheetData).toEqual([[7, 8, 9]])
  expect(result.missingSheetLookup).toBe(false)
  expect(result.firstColumnWidth).toBe(120)

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
