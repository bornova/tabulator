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
})
