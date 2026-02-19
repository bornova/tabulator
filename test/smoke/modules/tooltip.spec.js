import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('tooltip module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('tooltipDelay controls deferred tooltip loading', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          tooltipDelay: 40,
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name', tooltip: 'Cell tooltip' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.tooltip
      const cell = table.getRows()[0].getCell('name')._cell

      let loadCalls = 0
      const originalLoadTooltip = module.loadTooltip
      module.loadTooltip = (...args) => {
        loadCalls += 1
        return originalLoadTooltip.apply(module, args)
      }

      module.mousemoveCheck('tooltip', new MouseEvent('mousemove', { clientX: 10, clientY: 10 }), cell)

      await new Promise((resolve) => setTimeout(resolve, 10))
      const callsBeforeDelay = loadCalls

      await new Promise((resolve) => setTimeout(resolve, 55))
      const callsAfterDelay = loadCalls

      module.clearPopup()

      return {
        callsBeforeDelay,
        callsAfterDelay
      }
    })

    expect(result.callsBeforeDelay).toBe(0)
    expect(result.callsAfterDelay).toBe(1)
  })

  await test.step('tooltip column option renders popup content for cell hover', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name', tooltip: true }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.tooltip
      const cell = table.getRows()[0].getCell('name')._cell
      const event = new MouseEvent('mousemove', { clientX: 15, clientY: 15 })

      module.loadTooltip(event, cell, true)

      const text = module.popupInstance ? module.popupInstance.element.textContent : null
      const hasTooltipClass = module.popupInstance
        ? module.popupInstance.element.classList.contains('tabulator-tooltip')
        : false

      module.clearPopup()

      return {
        tooltipSubscriber: module.tooltipSubscriber,
        text,
        hasTooltipClass
      }
    })

    expect(result.tooltipSubscriber).toBe(true)
    expect(result.hasTooltipClass).toBe(true)
    expect(result.text).toContain('alice')
  })

  await test.step('headerTooltip column option renders popup content for header hover', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name', headerTooltip: 'Header tooltip text' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.tooltip
      const column = table.getColumn('name')._column
      const event = new MouseEvent('mousemove', { clientX: 20, clientY: 20 })

      module.loadTooltip(event, column, column.definition.headerTooltip)

      const text = module.popupInstance ? module.popupInstance.element.textContent : null
      const hasTooltipClass = module.popupInstance
        ? module.popupInstance.element.classList.contains('tabulator-tooltip')
        : false

      module.clearPopup()

      return {
        headerSubscriber: module.headerSubscriber,
        text,
        hasTooltipClass
      }
    })

    expect(result.headerSubscriber).toBe(true)
    expect(result.hasTooltipClass).toBe(true)
    expect(result.text).toContain('Header tooltip text')
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
