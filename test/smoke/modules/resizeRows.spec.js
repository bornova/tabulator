import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('resizeRows module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('resizableRows false does not add resize handles', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          resizableRows: false,
          data: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
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

      return {
        modulePresent: !!table.modules.resizeRows,
        handleCount: holder.querySelectorAll('.tabulator-row-resize-handle').length
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.handleCount).toBe(0)
  })

  await test.step('resizableRows true adds row and previous-row resize handles', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const table = new Tabulator(holder, {
          resizableRows: true,
          data: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(resolve, 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      return {
        rowHandleCount: holder.querySelectorAll('.tabulator-row-resize-handle:not(.prev)').length,
        prevHandleCount: holder.querySelectorAll('.tabulator-row-resize-handle.prev').length
      }
    })

    expect(result.rowHandleCount).toBe(2)
    expect(result.prevHandleCount).toBe(2)
  })

  await test.step('resizableRowGuide toggles guide element and still applies resize', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const runCase = async (holder, resizableRowGuide) => {
        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            resizableRows: true,
            resizableRowGuide,
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

        const row = table.rowManager.getRows()[0]
        const handle = row.getElement().querySelector('.tabulator-row-resize-handle:not(.prev)')
        const startHeight = row.getHeight()

        table.modules.resizeRows._mouseDown(
          {
            screenY: 100,
            stopPropagation() {}
          },
          row,
          handle
        )

        await new Promise((resolve) => setTimeout(resolve, 10))
        const guideVisibleDuringDrag = !!holder.querySelector('.tabulator-row-resize-guide')

        if (!resizableRowGuide) {
          document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, screenY: 130 }))
        }

        document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, screenY: 130 }))
        await new Promise((resolve) => setTimeout(resolve, 10))

        return {
          guideVisibleDuringDrag,
          guideVisibleAfterDrag: !!holder.querySelector('.tabulator-row-resize-guide'),
          startHeight,
          endHeight: row.getHeight()
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

      return {
        noGuide,
        withGuide
      }
    })

    expect(result.noGuide.guideVisibleDuringDrag).toBe(false)
    expect(result.withGuide.guideVisibleDuringDrag).toBe(true)
    expect(result.withGuide.guideVisibleAfterDrag).toBe(false)
    expect(result.noGuide.endHeight).toBeGreaterThan(result.noGuide.startHeight)
    expect(result.withGuide.endHeight).toBeGreaterThan(result.withGuide.startHeight)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
