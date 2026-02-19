import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('moveRow module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('movableRows false skips row move config initialization', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableRows: false,
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

      const firstRow = table.rowManager.getRows()[0]

      return {
        modulePresent: !!table.modules.moveRow,
        hasRowMoveConfig: !!firstRow.modules.moveRow
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.hasRowMoveConfig).toBe(false)
  })

  await test.step('movableRows true initializes row config and supports rowHandle columns', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableRows: true,
          data: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ],
          columns: [
            { title: '#', formatter: 'handle', rowHandle: true, width: 40 },
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

      const module = table.modules.moveRow
      const firstRow = table.rowManager.getRows()[0]

      return {
        hasHandleMode: module.hasHandle,
        hasRowMoveConfig: !!firstRow.modules.moveRow,
        hasRowMousemoveHandler: typeof firstRow.modules.moveRow?.mousemove === 'function'
      }
    })

    expect(result.hasHandleMode).toBe(true)
    expect(result.hasRowMoveConfig).toBe(true)
    expect(result.hasRowMousemoveHandler).toBe(true)
  })

  await test.step('movableRowsConnectedTables and movableRowsConnectedElements are applied', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableRows: true,
          movableRowsConnectedTables: ['#table-a', '#table-b'],
          movableRowsConnectedElements: ['#drop-zone'],
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

      const module = table.modules.moveRow

      return {
        tables: module.connectionSelectorsTables,
        elements: module.connectionSelectorsElements,
        connectionEnabled: module.connection
      }
    })

    expect(result.tables).toEqual(['#table-a', '#table-b'])
    expect(result.elements).toEqual(['#drop-zone'])
    expect(!!result.connectionEnabled).toBe(true)
  })

  await test.step('movableRowsSender supports custom function and built-in sender', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const buildTable = (options) => {
        const holder = document.createElement('div')
        holder.style.width = '900px'
        root.appendChild(holder)

        return new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            movableRows: true,
            data: [{ id: 1, name: 'Alice' }],
            columns: [{ title: 'Name', field: 'name' }],
            ...options
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })
      }

      let customSenderCalls = 0
      const customTable = await buildTable({
        movableRowsSender() {
          customSenderCalls += 1
        }
      })

      const customModule = customTable.modules.moveRow
      customModule.endMove = () => {}
      customModule.moving = {
        getComponent() {
          return { id: 1 }
        }
      }
      customModule.dropComplete({}, null, true)

      let deleteCalls = 0
      const builtInTable = await buildTable({ movableRowsSender: 'delete' })
      const builtInModule = builtInTable.modules.moveRow
      builtInModule.endMove = () => {}
      builtInModule.moving = {
        getComponent() {
          return {
            id: 2,
            delete() {
              deleteCalls += 1
            }
          }
        }
      }
      builtInModule.dropComplete({}, null, true)

      return {
        customSenderCalls,
        deleteCalls
      }
    })

    expect(result.customSenderCalls).toBe(1)
    expect(result.deleteCalls).toBe(1)
  })

  await test.step('movableRowsReceiver supports custom function and built-in receiver', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const buildTable = (options) => {
        const holder = document.createElement('div')
        holder.style.width = '900px'
        root.appendChild(holder)

        return new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            movableRows: true,
            data: [{ id: 1, name: 'Alice' }],
            columns: [{ title: 'Name', field: 'name' }],
            ...options
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })
      }

      let customReceiverCalls = 0
      const customTable = await buildTable({
        movableRowsReceiver() {
          customReceiverCalls += 1
          return true
        }
      })

      const customModule = customTable.modules.moveRow
      customModule.connectedTable = {}
      customModule.connectedRow = {
        getComponent() {
          return { id: 5, getData: () => ({ id: 5, name: 'From' }) }
        }
      }
      customModule.commsSend = () => {}

      customModule.tableRowDrop(
        {
          stopImmediatePropagation() {}
        },
        null
      )

      const builtInTable = await buildTable({ movableRowsReceiver: 'add' })
      const builtInModule = builtInTable.modules.moveRow
      const added = []
      builtInTable.addRow = (payload) => {
        added.push(payload)
      }
      builtInModule.connectedTable = {}
      builtInModule.connectedRow = {
        getComponent() {
          return { id: 9, getData: () => ({ id: 9, name: 'Incoming' }) }
        }
      }
      builtInModule.commsSend = () => {}

      builtInModule.tableRowDrop(
        {
          stopImmediatePropagation() {}
        },
        null
      )

      return {
        customReceiverCalls,
        added
      }
    })

    expect(result.customReceiverCalls).toBe(1)
    expect(result.added).toEqual([{ id: 9, name: 'Incoming' }])
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
