import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('selectRow module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('selectableRows false skips selection row initialization', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRows: false,
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

      const row = table.rowManager.getDisplayRows()[0]

      return {
        selectedCount: table.modules.selectRow.selectedRows.length,
        hasSelectModule: !!row.modules.select,
        selectableClass: row.getElement().classList.contains('tabulator-selectable'),
        unselectableClass: row.getElement().classList.contains('tabulator-unselectable')
      }
    })

    expect(result.selectedCount).toBe(0)
    expect(result.hasSelectModule).toBe(false)
    expect(result.selectableClass).toBe(false)
    expect(result.unselectableClass).toBe(false)
  })

  await test.step('selectableRowsCheck controls which rows can be selected', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRows: true,
          selectableRowsCheck(row) {
            return row.getData().allowed === true
          },
          data: [
            { id: 1, name: 'alice', allowed: true },
            { id: 2, name: 'bob', allowed: false }
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

      const module = table.modules.selectRow
      const rows = table.rowManager.getDisplayRows()

      module.toggleRow(rows[0])
      module.toggleRow(rows[1])

      return {
        selectedIds: module.selectedRows.map((row) => row.getData().id),
        firstSelectable: rows[0].getElement().classList.contains('tabulator-selectable'),
        secondUnselectable: rows[1].getElement().classList.contains('tabulator-unselectable')
      }
    })

    expect(result.selectedIds).toEqual([1])
    expect(result.firstSelectable).toBe(true)
    expect(result.secondUnselectable).toBe(true)
  })

  await test.step('selectableRowsRollingSelection controls overflow behavior at numeric selection limit', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      async function build(rolling) {
        const holder = document.createElement('div')
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            selectableRows: 1,
            selectableRowsRollingSelection: rolling,
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

        const module = table.modules.selectRow
        const rows = table.rowManager.getDisplayRows()

        module._selectRow(rows[0], false, false)
        module._selectRow(rows[1], false, false)

        return module.selectedRows.map((row) => row.getData().id)
      }

      return {
        rollingTrue: await build(true),
        rollingFalse: await build(false)
      }
    })

    expect(result.rollingTrue).toEqual([2])
    expect(result.rollingFalse).toEqual([1])
  })

  await test.step('selectableRowsPersistence false clears selection after data refresh', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          index: 'id',
          selectableRows: true,
          selectableRowsPersistence: false,
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

      const module = table.modules.selectRow
      module._selectRow(table.rowManager.getDisplayRows()[0], false, false)
      const before = module.selectedRows.length

      await table.replaceData([
        { id: 3, name: 'charlie' },
        { id: 4, name: 'dana' }
      ])

      return {
        before,
        after: module.selectedRows.length
      }
    })

    expect(result.before).toBe(1)
    expect(result.after).toBe(0)
  })

  await test.step('selectableRowsRangeMode click supports shift-range selection', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRows: true,
          selectableRowsRangeMode: 'click',
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' },
            { id: 3, name: 'charlie' }
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

      const module = table.modules.selectRow
      const rows = table.rowManager.getDisplayRows()

      module.handleComplexRowClick(rows[0], {
        shiftKey: false,
        ctrlKey: false,
        metaKey: false
      })

      module.handleComplexRowClick(rows[2], {
        shiftKey: true,
        ctrlKey: false,
        metaKey: false
      })

      return {
        selectedIds: module.selectedRows.map((row) => row.getData().id)
      }
    })

    expect(result.selectedIds).toEqual([1, 2, 3])
  })

  await test.step('selectRow table APIs expose selection operations', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          selectableRows: true,
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' },
            { id: 3, name: 'charlie' }
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

      const functionPresence = {
        selectRow: typeof table.selectRow === 'function',
        deselectRow: typeof table.deselectRow === 'function',
        toggleSelectRow: typeof table.toggleSelectRow === 'function',
        getSelectedRows: typeof table.getSelectedRows === 'function',
        getSelectedData: typeof table.getSelectedData === 'function'
      }

      const row1 = table.rowManager.findRow(1)
      const row2 = table.rowManager.findRow(2)
      const row3 = table.rowManager.findRow(3)

      table.toggleSelectRow(row1)
      const selectedAfterToggle = table.getSelectedRows().map((row) => row.getData().id)

      table.selectRow([row2, row3])
      const selectedAfterSelect = table.getSelectedRows().map((row) => row.getData().id)
      const selectedDataAfterSelect = table.getSelectedData().map((row) => row.id)

      table.deselectRow(row2)
      const selectedAfterDeselect = table.getSelectedRows().map((row) => row.getData().id)

      table.toggleSelectRow(row1)
      const selectedAfterSecondToggle = table.getSelectedRows().map((row) => row.getData().id)

      return {
        functionPresence,
        selectedAfterToggle,
        selectedAfterSelect,
        selectedDataAfterSelect,
        selectedAfterDeselect,
        selectedAfterSecondToggle
      }
    })

    expect(result.functionPresence).toEqual({
      selectRow: true,
      deselectRow: true,
      toggleSelectRow: true,
      getSelectedRows: true,
      getSelectedData: true
    })
    expect(result.selectedAfterToggle).toEqual([1])
    expect(result.selectedAfterSelect).toEqual(expect.arrayContaining([1, 2, 3]))
    expect(result.selectedDataAfterSelect).toEqual(expect.arrayContaining([1, 2, 3]))
    expect(result.selectedAfterDeselect).toEqual(expect.arrayContaining([1, 3]))
    expect(result.selectedAfterSecondToggle).toEqual([3])
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
