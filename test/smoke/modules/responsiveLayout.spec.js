import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('responsiveLayout module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('responsiveLayout false does not initialize responsive mode', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '260px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          responsiveLayout: false,
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id', width: 120 },
            { title: 'Name', field: 'name', width: 180 }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        mode: table.modules.responsiveLayout.mode,
        collapseToggleCount: holder.querySelectorAll('.tabulator-responsive-collapse-toggle').length
      }
    })

    expect(result.mode).toBe('')
    expect(result.collapseToggleCount).toBe(0)
  })

  await test.step('responsive column option and collapse mode initialize with hidden columns', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '260px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          responsiveLayout: 'collapse',
          data: [
            { id: 1, name: 'alice', age: 32, group: 'red' },
            { id: 2, name: 'bob', age: 28, group: 'blue' }
          ],
          columns: [
            { formatter: 'responsiveCollapse', width: 40, hozAlign: 'center', headerSort: false },
            { title: 'ID', field: 'id', width: 140, responsive: 0 },
            { title: 'Name', field: 'name', width: 200, responsive: 1 },
            { title: 'Age', field: 'age', width: 200, responsive: 2 },
            { title: 'Group', field: 'group', width: 200, responsive: 3 }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      table.modules.responsiveLayout.update()

      const nameOrder = table.getColumn('name')._column.modules.responsive.order
      const hiddenCount = table.modules.responsiveLayout.hiddenColumns.length
      const toggleCount = holder.querySelectorAll('.tabulator-responsive-collapse-toggle').length
      const collapseHandleVisible = table.getColumns()[0].isVisible()

      return { nameOrder, hiddenCount, toggleCount, collapseHandleVisible }
    })

    expect(result.nameOrder).toBe(1)
    expect(result.hiddenCount).toBeGreaterThan(0)
    expect(result.toggleCount).toBeGreaterThan(0)
    expect(result.collapseHandleVisible).toBe(true)
  })

  await test.step('responsiveLayoutCollapseStartOpen false initializes collapsed rows closed', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '260px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          responsiveLayout: 'collapse',
          responsiveLayoutCollapseStartOpen: false,
          data: [{ id: 1, name: 'alice', age: 32, group: 'red' }],
          columns: [
            { formatter: 'responsiveCollapse', width: 40, hozAlign: 'center', headerSort: false },
            { title: 'ID', field: 'id', width: 140, responsive: 0 },
            { title: 'Name', field: 'name', width: 200, responsive: 1 },
            { title: 'Age', field: 'age', width: 200, responsive: 2 },
            { title: 'Group', field: 'group', width: 200, responsive: 3 }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      table.modules.responsiveLayout.update()

      const row = table.rowManager.getDisplayRows()[0]

      return {
        open: row.modules.responsiveLayout.open,
        display: row.modules.responsiveLayout.element.style.display
      }
    })

    expect(result.open).toBe(false)
    expect(result.display).toBe('none')
  })

  await test.step('responsiveLayoutCollapseUseFormatters toggles formatter usage in collapsed data', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '260px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          responsiveLayout: 'collapse',
          responsiveLayoutCollapseUseFormatters: true,
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { formatter: 'responsiveCollapse', width: 40, hozAlign: 'center', headerSort: false },
            { title: 'ID', field: 'id', width: 140, responsive: 0 },
            {
              title: 'Name',
              field: 'name',
              width: 220,
              responsive: 1,
              formatter: (cell) => `FMT:${cell.getValue()}`
            }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.responsiveLayout
      module.hiddenColumns = [table.getColumn('name')._column]
      const row = table.rowManager.getDisplayRows()[0]

      const withFormatters = module.generateCollapsedRowData(row)[0].value

      table.options.responsiveLayoutCollapseUseFormatters = false
      const withoutFormatters = module.generateCollapsedRowData(row)[0].value

      return { withFormatters, withoutFormatters }
    })

    expect(result.withFormatters).toBe('FMT:alice')
    expect(result.withoutFormatters).toBe('alice')
  })

  await test.step('responsiveLayoutCollapseFormatter custom formatter is used for collapsed row content', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '260px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          responsiveLayout: 'collapse',
          responsiveLayoutCollapseFormatter(data) {
            const el = document.createElement('div')
            el.className = 'custom-collapse-marker'
            el.textContent = `items:${data.length}`
            return el
          },
          data: [{ id: 1, name: 'alice', age: 32 }],
          columns: [
            { formatter: 'responsiveCollapse', width: 40, hozAlign: 'center', headerSort: false },
            { title: 'ID', field: 'id', width: 140, responsive: 0 },
            { title: 'Name', field: 'name', width: 220, responsive: 1 },
            { title: 'Age', field: 'age', width: 220, responsive: 2 }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.responsiveLayout
      module.update()

      const row = table.rowManager.getDisplayRows()[0]
      module.generateCollapsedRowContent(row)

      const marker = row.modules.responsiveLayout.element.querySelector('.custom-collapse-marker')

      return {
        markerText: marker ? marker.textContent : null,
        hiddenCount: module.hiddenColumns.length
      }
    })

    expect(result.hiddenCount).toBeGreaterThan(0)
    expect(result.markerText).toBe(`items:${result.hiddenCount}`)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
