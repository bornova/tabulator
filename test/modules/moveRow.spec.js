import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('moveRow module', async ({ page }) => {
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

  await test.step('connected table moves work with a single selector string and receiver add mode', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const senderHolder = document.createElement('div')
      senderHolder.id = 'sender-table'
      senderHolder.style.width = '900px'
      root.appendChild(senderHolder)

      const receiverHolder = document.createElement('div')
      receiverHolder.id = 'receiver-table'
      receiverHolder.style.width = '900px'
      root.appendChild(receiverHolder)

      const buildTable = (holder, options) => {
        return new Promise((resolve) => {
          const instance = new Tabulator(holder, {
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

      const senderTable = await buildTable(senderHolder, {
        movableRows: true,
        movableRowsConnectedTables: '#receiver-table',
        movableRowsSender: 'delete'
      })

      const receiverTable = await buildTable(receiverHolder, {
        data: [],
        movableRowsReceiver: 'add'
      })

      const senderModule = senderTable.modules.moveRow
      const receiverModule = receiverTable.modules.moveRow
      const senderRow = senderTable.rowManager.getRows()[0]

      senderModule.endMove = () => {}
      senderModule.moving = {
        getComponent() {
          return senderTable.getRows()[0]
        }
      }
      senderModule.commsSend(senderModule.connectionSelectorsTables, 'moveRow', 'connect', {
        row: senderRow
      })

      receiverModule.tableRowDrop(
        {
          stopImmediatePropagation() {}
        },
        null
      )

      return {
        senderIds: senderTable.getData().map((row) => row.id),
        receiverIds: receiverTable.getData().map((row) => row.id),
        receiverConnectedTableId: receiverModule.connectedTable?.id ?? null
      }
    })

    expect(result.senderIds).toEqual([])
    expect(result.receiverIds).toEqual([1])
    expect(result.receiverConnectedTableId).toBe('sender-table')
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

  await test.step('built-in receiver modes insert/update/replace apply expected row operations', async () => {
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

      const buildConnectedRow = (id, name) => ({
        getComponent() {
          return {
            id,
            getData: () => ({ id, name })
          }
        }
      })

      const makeEvent = () => ({
        stopImmediatePropagation() {}
      })

      const insertTable = await buildTable({ movableRowsReceiver: 'insert' })
      const insertModule = insertTable.modules.moveRow
      const insertCalls = []
      insertTable.addRow = (payload, top, toRowArg) => {
        insertCalls.push({ payload, top, hasToRow: !!toRowArg })
      }
      insertModule.commsSend = () => {}
      insertModule.connectedTable = {}
      insertModule.connectedRow = buildConnectedRow(7, 'Insert')
      const insertToRow = {
        getComponent() {
          return { id: 77 }
        }
      }
      insertModule.tableRowDrop(makeEvent(), insertToRow)

      const updateTable = await buildTable({ movableRowsReceiver: 'update' })
      const updateModule = updateTable.modules.moveRow
      let updatedPayload = null
      updateModule.commsSend = () => {}
      updateModule.connectedTable = {}
      updateModule.connectedRow = buildConnectedRow(8, 'Update')
      const updateToRow = {
        getComponent() {
          return {
            id: 88,
            update(payload) {
              updatedPayload = payload
            }
          }
        }
      }
      updateModule.tableRowDrop(makeEvent(), updateToRow)

      const replaceTable = await buildTable({ movableRowsReceiver: 'replace' })
      const replaceModule = replaceTable.modules.moveRow
      const replaceAddCalls = []
      let replaceDeletes = 0
      replaceTable.addRow = (payload, top, toRowArg) => {
        replaceAddCalls.push({ payload, top, hasToRow: !!toRowArg })
      }
      replaceModule.commsSend = () => {}
      replaceModule.connectedTable = {}
      replaceModule.connectedRow = buildConnectedRow(9, 'Replace')
      const replaceToRow = {
        getComponent() {
          return {
            id: 99,
            delete() {
              replaceDeletes += 1
            }
          }
        }
      }
      replaceModule.tableRowDrop(makeEvent(), replaceToRow)

      return {
        insertCalls,
        updatedPayload,
        replaceAddCalls,
        replaceDeletes
      }
    })

    expect(result.insertCalls).toEqual([{ payload: { id: 7, name: 'Insert' }, top: undefined, hasToRow: true }])
    expect(result.updatedPayload).toEqual({ id: 8, name: 'Update' })
    expect(result.replaceAddCalls).toEqual([{ payload: { id: 9, name: 'Replace' }, top: undefined, hasToRow: true }])
    expect(result.replaceDeletes).toBe(1)
  })

  await test.step('commsReceived routes connect/disconnect/dropcomplete actions', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableRows: true,
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.moveRow
      const calls = []
      module.connect = (targetTable, row) => {
        calls.push({ type: 'connect', rowId: row?.getComponent?.()?.id ?? null, table: targetTable?.id ?? null })
        return true
      }
      module.disconnect = (targetTable) => {
        calls.push({ type: 'disconnect', table: targetTable?.id ?? null })
      }
      module.dropComplete = (targetTable, row, success) => {
        calls.push({
          type: 'dropcomplete',
          table: targetTable?.id ?? null,
          rowId: row?.getComponent?.()?.id ?? null,
          success: !!success
        })
      }

      const connectedRow = {
        getComponent() {
          return { id: 42 }
        }
      }
      const remoteTable = { id: 'remote' }

      const connectResult = module.commsReceived(remoteTable, 'connect', { row: connectedRow })
      module.commsReceived(remoteTable, 'disconnect', {})
      module.commsReceived(remoteTable, 'dropcomplete', { row: connectedRow, success: true })

      return {
        connectResult,
        calls
      }
    })

    expect(result.connectResult).toBe(true)
    expect(result.calls).toEqual([
      { type: 'connect', table: 'remote', rowId: 42 },
      { type: 'disconnect', table: 'remote' },
      { type: 'dropcomplete', table: 'remote', rowId: 42, success: true }
    ])
  })

  await test.step('dropComplete dispatches sent and sentFailed events based on success', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableRows: true,
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.moveRow
      const events = []

      module.dispatchExternal = (name, fromRow, toRow) => {
        events.push({ name, fromId: fromRow?.id ?? null, toId: toRow?.id ?? null })
      }
      module.endMove = () => {
        events.push({ name: 'endMove' })
      }

      module.moving = {
        getComponent() {
          return {
            id: 11,
            delete() {}
          }
        }
      }

      const toRow = {
        getComponent() {
          return { id: 12 }
        }
      }

      module.dropComplete({ id: 'remote' }, toRow, true)
      module.dropComplete({ id: 'remote' }, toRow, false)

      return { events }
    })

    expect(result.events).toEqual([
      { name: 'movableRowsSent', fromId: 11, toId: 12 },
      { name: 'endMove' },
      { name: 'movableRowsSentFailed', fromId: 11, toId: 12 },
      { name: 'endMove' }
    ])
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
