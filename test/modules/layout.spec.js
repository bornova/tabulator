import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('layout module', async ({ page }) => {
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
    const modes = ['fitData', 'fitDataFill', 'fitDataTable', 'fitDataStretch', 'fitColumns']

    const buildTable = (holder, options) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve(table), 1500)

        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const summaries = {}

    for (const mode of modes) {
      const holder = document.createElement('div')
      holder.id = `layout-${mode}`
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await buildTable(holder, {
        height: 220,
        layout: mode,
        data: [
          { id: 1, name: 'A', notes: 'short' },
          { id: 2, name: 'B', notes: 'tiny' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'Notes', field: 'notes' }
        ]
      })

      const headerCells = Array.from(holder.querySelectorAll('.tabulator-col'))
      const widths = headerCells.map((cell) => cell.getBoundingClientRect().width)
      const totalColWidth = widths.reduce((sum, width) => sum + width, 0)
      const holderWidth = holder.getBoundingClientRect().width

      summaries[mode] = {
        modulePresent: !!table.modules.layout,
        layoutAttr: holder.getAttribute('tabulator-layout'),
        headerCount: headerCells.length,
        holderWidth,
        totalColWidth,
        widths
      }
    }

    const holderOptions = document.createElement('div')
    holderOptions.id = 'layout-options'
    holderOptions.style.width = '900px'
    root.appendChild(holderOptions)

    const optionsTable = await buildTable(holderOptions, {
      layout: 'fitColumns',
      layoutColumnsOnNewData: true,
      data: [{ id: 1, a: 'x', b: 'y' }],
      columns: [
        { title: 'A', field: 'a', widthGrow: '3', widthShrink: '2' },
        { title: 'B', field: 'b' }
      ]
    })

    const defs = optionsTable.getColumnDefinitions()
    summaries.layoutOptions = {
      layoutColumnsOnNewData: optionsTable.options.layoutColumnsOnNewData,
      widthGrow: defs.find((col) => col.field === 'a')?.widthGrow,
      widthShrink: defs.find((col) => col.field === 'a')?.widthShrink
    }

    return summaries
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  const modes = ['fitData', 'fitDataFill', 'fitDataTable', 'fitDataStretch', 'fitColumns']

  modes.forEach((mode) => {
    expect(result[mode].modulePresent, `layout module missing for ${mode}`).toBe(true)
    expect(result[mode].layoutAttr, `layout attr mismatch for ${mode}`).toBe(mode)
    expect(result[mode].headerCount, `header cells missing for ${mode}`).toBeGreaterThan(0)
  })

  expect(
    Math.abs(result.fitColumns.totalColWidth - result.fitColumns.holderWidth),
    'fitColumns should fill available table width'
  ).toBeLessThanOrEqual(8)

  expect(
    result.fitDataStretch.widths[result.fitDataStretch.widths.length - 1] > result.fitDataStretch.widths[0],
    'fitDataStretch should stretch the last visible column when space is available'
  ).toBe(true)

  expect(result.layoutOptions.layoutColumnsOnNewData).toBe(true)
  expect(result.layoutOptions.widthGrow).toBe(3)
  expect(result.layoutOptions.widthShrink).toBe(2)

  await test.step('layout internals handle invalid mode fallback, getMode, and variable-height normalize', async () => {
    await page.goto(fixtureUrl)

    const internal = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const buildTable = (holder, options) => {
        return new Promise((resolve) => {
          const table = new Tabulator(holder, options)
          const timeout = setTimeout(() => resolve(table), 1500)

          table.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(table)
          })
        })
      }

      const invalidHolder = document.createElement('div')
      invalidHolder.style.width = '900px'
      root.appendChild(invalidHolder)

      const warnings = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        warnings.push(args.map((value) => String(value)).join(' '))
      }

      const invalidTable = await buildTable(invalidHolder, {
        layout: 'invalidMode',
        data: [{ id: 1, name: 'Alice' }],
        columns: [{ title: 'Name', field: 'name' }]
      })

      console.warn = originalWarn

      const variableHolder = document.createElement('div')
      variableHolder.style.width = '900px'
      root.appendChild(variableHolder)

      const variableTable = await buildTable(variableHolder, {
        layout: 'fitData',
        data: [
          { id: 1, notes: 'line1\nline2' },
          { id: 2, notes: 'line3\nline4' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Notes', field: 'notes', formatter: 'textarea' }
        ]
      })

      const layoutModule = variableTable.modules.layout
      const dispatchCalls = []
      const originalDispatch = layoutModule.dispatch
      layoutModule.dispatch = (...args) => {
        dispatchCalls.push(args[0])
      }

      let normalizeCalls = 0
      const originalNormalizeHeight = variableTable.rowManager.normalizeHeight
      variableTable.rowManager.normalizeHeight = (...args) => {
        if (args[0] === true) {
          normalizeCalls += 1
        }
        return originalNormalizeHeight.apply(variableTable.rowManager, args)
      }

      layoutModule.layout(false)

      layoutModule.dispatch = originalDispatch
      variableTable.rowManager.normalizeHeight = originalNormalizeHeight

      return {
        invalidModeResolved: invalidTable.modules.layout.getMode(),
        invalidLayoutAttr: invalidHolder.getAttribute('tabulator-layout'),
        invalidModeWarned: warnings.some((warning) =>
          warning.includes("Layout Error - invalid mode set, defaulting to 'fitData' : invalidMode")
        ),
        getModeOnValidTable: variableTable.modules.layout.getMode(),
        dispatchCalls,
        normalizeCalls
      }
    })

    expect(internal.invalidModeResolved).toBe('fitData')
    expect(internal.invalidLayoutAttr).toBe('fitData')
    expect(internal.invalidModeWarned).toBe(true)
    expect(internal.getModeOnValidTable).toBe('fitData')
    expect(internal.dispatchCalls).toEqual(['layout-refreshing', 'layout-refreshed'])
    expect(internal.normalizeCalls).toBeGreaterThan(0)
  })
})
