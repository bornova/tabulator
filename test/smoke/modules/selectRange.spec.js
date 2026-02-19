import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('selectRange module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('selectableRange false does not initialize range overlay', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRange: false,
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        hasOverlay: !!table.modules.selectRange.overlay,
        hasRangeClass: table.element.classList.contains('tabulator-ranges')
      }
    })

    expect(result.hasOverlay).toBe(false)
    expect(result.hasRangeClass).toBe(false)
  })

  await test.step('selectableRange true initializes overlay and table range APIs', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRange: true,
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const rows = table.getRows()
      table.addRange(rows[0].getCell('name'), rows[1].getCell('name'))

      return {
        hasOverlay: !!table.modules.selectRange.overlay,
        hasRangeClass: table.element.classList.contains('tabulator-ranges'),
        hasGetRanges: typeof table.getRanges === 'function',
        hasGetRangesData: typeof table.getRangesData === 'function',
        hasAddRange: typeof table.addRange === 'function',
        rangesCount: table.getRanges().length,
        rangesDataRows: table.getRangesData()[0]?.length || 0
      }
    })

    expect(result.hasOverlay).toBe(true)
    expect(result.hasRangeClass).toBe(true)
    expect(result.hasGetRanges).toBe(true)
    expect(result.hasGetRangesData).toBe(true)
    expect(result.hasAddRange).toBe(true)
    expect(result.rangesCount).toBeGreaterThan(0)
    expect(result.rangesDataRows).toBeGreaterThan(0)
  })

  await test.step('selectableRangeColumns and selectableRangeRows propagate to module selection flags', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRange: true,
          selectableRangeColumns: true,
          selectableRangeRows: true,
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        columnSelection: table.modules.selectRange.columnSelection,
        rowSelection: table.modules.selectRange.rowSelection,
        rowHeaderField: table.modules.selectRange.rowHeader?.field || null
      }
    })

    expect(result.columnSelection).toBe(true)
    expect(result.rowSelection).toBe(true)
    expect(result.rowHeaderField).toBe('id')
  })

  await test.step('selectableRangeAutoFocus toggles focus initialization during resetRanges', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      async function runFor(autoFocus) {
        const holder = document.createElement('div')
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            selectableRange: true,
            selectableRangeAutoFocus: autoFocus,
            data: [{ id: 1, name: 'alice' }],
            columns: [
              { title: 'ID', field: 'id' },
              { title: 'Name', field: 'name' }
            ]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        let focusCalls = 0
        const module = table.modules.selectRange
        const originalInitializeFocus = module.initializeFocus
        module.initializeFocus = (cell) => {
          focusCalls += 1
          return originalInitializeFocus.call(module, cell)
        }

        module.resetRanges()

        return focusCalls
      }

      return {
        withAutoFocus: await runFor(true),
        withoutAutoFocus: await runFor(false)
      }
    })

    expect(result.withAutoFocus).toBeGreaterThan(0)
    expect(result.withoutAutoFocus).toBe(0)
  })

  await test.step('selectableRangeClearCells and selectableRangeClearCellsValue clear active range values on Delete', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRange: true,
          selectableRangeClearCells: true,
          selectableRangeClearCellsValue: 'CLEARED',
          data: [{ name: 'alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.selectRange
      module.resetRanges()
      module._handleKeyDown({ key: 'Delete' })

      return {
        valueAfterDelete: table.getData()[0].name
      }
    })

    expect(result.valueAfterDelete).toBe('CLEARED')
  })

  await test.step('numeric selectableRange enforces max range count', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRange: 1,
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const rows = table.getRows()
      table.addRange(rows[0].getCell('id'), rows[0].getCell('name'))
      const firstRange = table.modules.selectRange.activeRange

      table.addRange(rows[1].getCell('id'), rows[1].getCell('name'))

      return {
        maxRanges: table.modules.selectRange.maxRanges,
        rangesCount: table.modules.selectRange.ranges.length,
        firstRangeDestroyed: firstRange.destroyed
      }
    })

    expect(result.maxRanges).toBe(1)
    expect(result.rangesCount).toBe(1)
    expect(result.firstRangeDestroyed).toBe(true)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
