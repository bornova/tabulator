import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('resizeTable module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('autoResize false disables resize observers and window binding', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          autoResize: false,
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

      const module = table.modules.resizeTable

      return {
        modulePresent: !!module,
        autoResizeFlag: module.autoResize,
        hasWindowBinding: !!module.binding,
        hasResizeObserver: !!module.resizeObserver,
        hasVisibilityObserver: !!module.visibilityObserver,
        hasContainerObserver: !!module.containerObserver
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.autoResizeFlag).toBe(false)
    expect(result.hasWindowBinding).toBe(false)
    expect(result.hasResizeObserver).toBe(false)
    expect(result.hasVisibilityObserver).toBe(false)
    expect(result.hasContainerObserver).toBe(false)
  })

  await test.step('autoResize true enables either observer mode or window-resize fallback mode', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          autoResize: true,
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

      const module = table.modules.resizeTable
      const observerMode = !!module.resizeObserver
      const fallbackMode = !!module.binding

      return {
        observerMode,
        fallbackMode,
        autoResizeFlag: module.autoResize,
        hasVisibilityObserver: !!module.visibilityObserver
      }
    })

    expect(result.observerMode || result.fallbackMode).toBe(true)

    if (result.observerMode) {
      expect(result.autoResizeFlag).toBe(true)
      expect(result.hasVisibilityObserver).toBe(true)
    }
  })

  await test.step('tableResized hook triggers row manager redraw', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          autoResize: true,
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

      let redrawCount = 0
      const originalRedraw = table.rowManager.redraw
      table.rowManager.redraw = (...args) => {
        redrawCount += 1
        return originalRedraw.apply(table.rowManager, args)
      }

      table.modules.resizeTable.tableResized()

      return {
        redrawCount
      }
    })

    expect(result.redrawCount).toBe(1)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
