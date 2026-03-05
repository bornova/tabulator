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

  await test.step('redrawTable does not redraw when table is not visible', async () => {
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

      const module = table.modules.resizeTable
      module.initialized = true
      module.visible = false

      let rerenderCalls = 0
      let redrawCalls = 0

      const originalRerender = table.columnManager.rerenderColumns
      const originalRedraw = table.redraw

      table.columnManager.rerenderColumns = (...args) => {
        rerenderCalls += 1
        return originalRerender.apply(table.columnManager, args)
      }

      table.redraw = (...args) => {
        redrawCalls += 1
        return originalRedraw.apply(table, args)
      }

      module.redrawTable()

      return { rerenderCalls, redrawCalls }
    })

    expect(result.rerenderCalls).toBe(0)
    expect(result.redrawCalls).toBe(0)
  })

  await test.step('clearBindings unobserves and resets observer references', async () => {
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

      const module = table.modules.resizeTable
      const tableElement = table.element
      const parentElement = tableElement.parentNode

      let resizeUnobserveCount = 0
      let visibilityUnobserveCount = 0
      let containerUnobserveCount = 0

      module.resizeObserver = {
        unobserve(target) {
          if (target === tableElement) {
            resizeUnobserveCount += 1
          }
        }
      }

      module.visibilityObserver = {
        unobserve(target) {
          if (target === tableElement) {
            visibilityUnobserveCount += 1
          }
        }
      }

      module.containerObserver = {
        unobserve(target) {
          if (target === parentElement) {
            containerUnobserveCount += 1
          }
        }
      }

      module.clearBindings()

      return {
        resizeUnobserveCount,
        visibilityUnobserveCount,
        containerUnobserveCount,
        resizeObserverReset: module.resizeObserver === false,
        visibilityObserverReset: module.visibilityObserver === false,
        containerObserverReset: module.containerObserver === false
      }
    })

    expect(result.resizeUnobserveCount).toBe(1)
    expect(result.visibilityUnobserveCount).toBe(1)
    expect(result.containerUnobserveCount).toBe(1)
    expect(result.resizeObserverReset).toBe(true)
    expect(result.visibilityObserverReset).toBe(true)
    expect(result.containerObserverReset).toBe(true)
  })

  await test.step('visibility observer uses latest entry and triggers redraw when becoming visible', async () => {
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
      const originalIntersectionObserver = window.IntersectionObserver
      let observerCallback = null
      let observeTargetMatches = false
      let redrawCalls = 0

      window.IntersectionObserver = function (callback) {
        observerCallback = callback
        return {
          observe(target) {
            observeTargetMatches = target === table.element
          },
          unobserve() {},
          disconnect() {}
        }
      }

      module.redrawTable = () => {
        redrawCalls += 1
      }

      module.initializeVisibilityObserver()

      observerCallback([{ target: table.element, isIntersecting: true }])
      observerCallback([
        { target: table.element, isIntersecting: false },
        { target: table.element, isIntersecting: true }
      ])

      window.IntersectionObserver = originalIntersectionObserver

      return {
        observeTargetMatches,
        initialized: module.initialized,
        visible: module.visible,
        redrawCalls
      }
    })

    expect(result.observeTargetMatches).toBe(true)
    expect(result.initialized).toBe(true)
    expect(result.visible).toBe(true)
    expect(result.redrawCalls).toBe(1)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
