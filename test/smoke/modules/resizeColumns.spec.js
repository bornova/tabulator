import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('resizeColumns module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('module is present and default resizable headers get handles', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'Alice' }],
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

      const headerHandles = holder.querySelectorAll('.tabulator-header .tabulator-col-resize-handle').length

      return {
        modulePresent: !!table.modules.resizeColumns,
        headerHandles
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.headerHandles).toBeGreaterThan(0)
  })

  await test.step('column resizable option supports false, header-only, and cell-only modes', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [
            { id: 1, noResize: 'A', headerOnly: 'B', cellOnly: 'C' },
            { id: 2, noResize: 'D', headerOnly: 'E', cellOnly: 'F' }
          ],
          columns: [
            { title: 'NoResize', field: 'noResize', resizable: false },
            { title: 'HeaderOnly', field: 'headerOnly', resizable: 'header' },
            { title: 'CellOnly', field: 'cellOnly', resizable: 'cell' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const columns = table.columnManager.columnsByIndex
      const noResize = columns.find((col) => col.getField() === 'noResize')
      const headerOnly = columns.find((col) => col.getField() === 'headerOnly')
      const cellOnly = columns.find((col) => col.getField() === 'cellOnly')

      const cellOnlyHasCellHandle = cellOnly.cells.some((cell) => !!cell.modules.resize?.handleEl)
      const headerOnlyHasCellHandle = headerOnly.cells.some((cell) => !!cell.modules.resize?.handleEl)

      return {
        noResizeHasHeaderHandle: !!noResize.modules.resize?.handleEl,
        headerOnlyHasHeaderHandle: !!headerOnly.modules.resize?.handleEl,
        cellOnlyHasHeaderHandle: !!cellOnly.modules.resize?.handleEl,
        cellOnlyHasCellHandle,
        headerOnlyHasCellHandle
      }
    })

    expect(result.noResizeHasHeaderHandle).toBe(false)
    expect(result.headerOnlyHasHeaderHandle).toBe(true)
    expect(result.cellOnlyHasHeaderHandle).toBe(false)
    expect(result.cellOnlyHasCellHandle).toBe(true)
    expect(result.headerOnlyHasCellHandle).toBe(false)
  })

  await test.step('resizableColumnFit resizes adjacent column when enabled', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const runCase = async (holder, resizableColumnFit) => {
        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            resizableColumnFit,
            data: [{ a: 1, b: 2 }],
            columns: [
              { title: 'A', field: 'a', width: 120 },
              { title: 'B', field: 'b', width: 120 }
            ]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        const module = table.modules.resizeColumns
        const leftColumn = table.columnManager.columnsByIndex[0]
        const rightColumn = table.columnManager.columnsByIndex[1]

        module.startX = 100
        module.latestX = 100
        module.startWidth = leftColumn.getWidth()
        module.initialNextColumn = rightColumn
        module.nextColumn = rightColumn

        module.resize({ clientX: 130 }, leftColumn)

        return {
          leftWidth: leftColumn.getWidth(),
          rightWidth: rightColumn.getWidth()
        }
      }

      const holderNoFit = document.createElement('div')
      const holderFit = document.createElement('div')
      holderNoFit.style.width = '900px'
      holderFit.style.width = '900px'
      root.appendChild(holderNoFit)
      root.appendChild(holderFit)

      const noFit = await runCase(holderNoFit, false)
      const fit = await runCase(holderFit, true)

      return { noFit, fit }
    })

    expect(result.noFit.leftWidth).toBeGreaterThan(120)
    expect(result.noFit.rightWidth).toBe(120)
    expect(result.fit.leftWidth).toBeGreaterThan(120)
    expect(result.fit.rightWidth).toBeLessThan(120)
  })

  await test.step('resizableColumnGuide toggles resize guide element during drag', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const runCase = async (holder, resizableColumnGuide) => {
        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            resizableColumnGuide,
            data: [{ a: 1, b: 2 }],
            columns: [
              { title: 'A', field: 'a', width: 120 },
              { title: 'B', field: 'b', width: 120 }
            ]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        const module = table.modules.resizeColumns
        const column = table.columnManager.columnsByIndex[0]
        const handle = column.modules.resize.handleEl

        module.startColumn = column
        module.startX = 100
        module.latestX = 100
        module.startWidth = column.getWidth()

        module._mouseDown(
          {
            clientX: 100,
            stopPropagation() {}
          },
          column,
          handle
        )

        await new Promise((resolve) => setTimeout(resolve, 10))
        const guideShown = !!holder.querySelector('.tabulator-col-resize-guide')

        document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 110 }))
        await new Promise((resolve) => setTimeout(resolve, 10))
        const guideStillPresent = !!holder.querySelector('.tabulator-col-resize-guide')

        return {
          guideShown,
          guideStillPresent
        }
      }

      const holderNoGuide = document.createElement('div')
      const holderGuide = document.createElement('div')
      holderNoGuide.style.width = '900px'
      holderGuide.style.width = '900px'
      root.appendChild(holderNoGuide)
      root.appendChild(holderGuide)

      const noGuide = await runCase(holderNoGuide, false)
      const withGuide = await runCase(holderGuide, true)

      return { noGuide, withGuide }
    })

    expect(result.noGuide.guideShown).toBe(false)
    expect(result.withGuide.guideShown).toBe(true)
    expect(result.withGuide.guideStillPresent).toBe(false)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
