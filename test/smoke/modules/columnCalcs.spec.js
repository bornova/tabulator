import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('columnCalcs module smoke - all default calculations', async ({ page }) => {
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

    holder.id = 'column-calcs-all-table'
    holder.style.width = '1200px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        height: 260,
        data: [
          {
            id: 1,
            avgVal: 1,
            maxVal: 10,
            minVal: 10,
            sumVal: 10,
            concatVal: 'A',
            countVal: 1,
            uniqueVal: 'x',
            customVal: 5
          },
          {
            id: 2,
            avgVal: 2,
            maxVal: 20,
            minVal: 20,
            sumVal: 20,
            concatVal: 'B',
            countVal: 0,
            uniqueVal: 'x',
            customVal: 10
          },
          {
            id: 3,
            avgVal: 3,
            maxVal: 30,
            minVal: 30,
            sumVal: 30,
            concatVal: 'C',
            countVal: true,
            uniqueVal: 'y',
            customVal: 15
          }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Avg', field: 'avgVal', topCalc: 'avg', topCalcParams: () => ({ precision: false }) },
          { title: 'Max', field: 'maxVal', bottomCalc: 'max' },
          { title: 'Min', field: 'minVal', bottomCalc: 'min' },
          { title: 'Sum', field: 'sumVal', bottomCalc: 'sum', bottomCalcParams: { precision: 1 } },
          { title: 'Concat', field: 'concatVal', bottomCalc: 'concat' },
          { title: 'Count', field: 'countVal', bottomCalc: 'count' },
          { title: 'Unique', field: 'uniqueVal', bottomCalc: 'unique' },
          {
            title: 'Custom',
            field: 'customVal',
            topCalc: (values) => values.length * 100,
            topCalcFormatter: 'money',
            topCalcFormatterParams: { symbol: '$' }
          }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const calcResults = table.getCalcResults()

    const topCell = holder.querySelector('.tabulator-calcs-top .tabulator-cell[tabulator-field="customVal"]')

    return {
      modulePresent: !!table.modules.columnCalcs,
      hasTopRow: !!holder.querySelector('.tabulator-calcs-top'),
      hasBottomRow: !!holder.querySelector('.tabulator-calcs-bottom'),
      top: calcResults.top,
      bottom: calcResults.bottom,
      customTopFormatted: topCell ? topCell.textContent : ''
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.modulePresent).toBe(true)
  expect(result.hasTopRow).toBe(true)
  expect(result.hasBottomRow).toBe(true)

  expect(result.top.avgVal).toBe('2')
  expect(result.bottom.maxVal).toBe(30)
  expect(result.bottom.minVal).toBe(10)
  expect(result.bottom.sumVal).toBe('60.0')
  expect(result.bottom.concatVal).toBe('ABC')
  expect(result.bottom.countVal).toBe(2)
  expect(result.bottom.uniqueVal).toBe(2)
  expect(result.top.customVal).toBe(300)
  expect(result.customTopFormatted.includes('$300')).toBe(true)
})
