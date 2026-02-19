import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from './smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('Tabulator core', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.id = 'core-table'
    holder.style.width = '900px'
    root.appendChild(holder)

    const TabulatorCore = Object.getPrototypeOf(Tabulator)

    const table = await new Promise((resolve) => {
      const instance = new TabulatorCore(holder, {
        height: 220,
        data: [
          { id: 1, name: 'Alice', age: 22 },
          { id: 2, name: 'Bob', age: 31 }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age' }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)

      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const coreApiChecks = {
      setData: typeof table.setData === 'function',
      getData: typeof table.getData === 'function',
      getDataCount: typeof table.getDataCount === 'function',
      replaceData: typeof table.replaceData === 'function',
      updateData: typeof table.updateData === 'function',
      addData: typeof table.addData === 'function',
      clearData: typeof table.clearData === 'function',
      getRow: typeof table.getRow === 'function',
      updateRow: typeof table.updateRow === 'function',
      deleteRow: typeof table.deleteRow === 'function',
      addRow: typeof table.addRow === 'function',
      getRows: typeof table.getRows === 'function',
      setColumns: typeof table.setColumns === 'function',
      getColumns: typeof table.getColumns === 'function',
      getColumn: typeof table.getColumn === 'function',
      getColumnDefinitions: typeof table.getColumnDefinitions === 'function',
      addColumn: typeof table.addColumn === 'function',
      deleteColumn: typeof table.deleteColumn === 'function',
      updateColumnDefinition: typeof table.updateColumnDefinition === 'function',
      redraw: typeof table.redraw === 'function',
      setHeight: typeof table.setHeight === 'function',
      on: typeof table.on === 'function',
      off: typeof table.off === 'function',
      dispatchEvent: typeof table.dispatchEvent === 'function',
      alert: typeof table.alert === 'function',
      clearAlert: typeof table.clearAlert === 'function',
      destroy: typeof table.destroy === 'function'
    }

    const initialColumnFields = table.getColumnDefinitions().map((column) => column.field)

    await table.addColumn({ title: 'Status', field: 'status' })
    const statusColumnExistsAfterAdd = !!table.getColumn('status')
    await table.updateColumnDefinition('age', { title: 'Age (Years)' })
    const ageColumnTitleAfterUpdate = table.getColumn('age').getDefinition().title
    await table.deleteColumn('status')
    const statusColumnRemoved = !table.getColumn('status')

    await table.addData([{ id: 3, name: 'Cara', age: 28 }])
    await table.updateRow(1, { name: 'Alice Updated' })
    await table.addRow({ id: 4, name: 'Dan', age: 45 })
    const rowFourExistsAfterAdd = !!table.getRow(4)
    await table.updateData([{ id: 1, age: 23 }])
    const updatedAge = table.getRow(1).getData().age
    await table.deleteRow(4)
    await table.deleteRow(2)

    const eventStats = { customEventCount: 0 }
    const customHandler = () => {
      eventStats.customEventCount += 1
    }

    table.on('coreCustomEvent', customHandler)
    table.dispatchEvent('coreCustomEvent')
    table.off('coreCustomEvent', customHandler)
    table.dispatchEvent('coreCustomEvent')

    table.setHeight(260)
    const heightStyleAfterSetHeight = holder.style.height

    table.alert('Core Alert Test')
    const hasAlertAfterAlert = !!holder.querySelector('.tabulator-alert')
    table.clearAlert()
    const hasAlertAfterClear = !!holder.querySelector('.tabulator-alert')

    await table.replaceData([
      { id: 10, name: 'Eve', age: 30 },
      { id: 11, name: 'Frank', age: 33 }
    ])

    const dataAfterReplace = table.getData()
    const dataCountAfterReplace = table.getDataCount()

    table.clearData()
    const dataCountAfterClear = table.getDataCount()

    table.setData([
      { id: 1, name: 'Alice Final', age: 24 },
      { id: 3, name: 'Cara', age: 28 }
    ])

    const optionalModulesAbsent = ['sort', 'filter', 'edit', 'download', 'clipboard'].every(
      (key) => !table.modules[key]
    )
    const coreModulesPresent = ['layout', 'localize', 'comms'].every((key) => !!table.modules[key])
    const moduleKeys = Object.keys(table.modules)
    const data = table.getData()

    table.destroy()

    return {
      moduleKeys,
      optionalModulesAbsent,
      coreModulesPresent,
      coreApiChecks,
      initialColumnFields,
      statusColumnExistsAfterAdd,
      ageColumnTitleAfterUpdate,
      statusColumnRemoved,
      rowFourExistsAfterAdd,
      updatedAge,
      customEventCount: eventStats.customEventCount,
      heightStyleAfterSetHeight,
      hasAlertAfterAlert,
      hasAlertAfterClear,
      dataAfterReplace,
      dataCountAfterReplace,
      dataCountAfterClear,
      dataCount: data.length,
      rowNames: data.map((row) => row.name)
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.optionalModulesAbsent).toBe(true)
  expect(result.coreModulesPresent).toBe(true)
  Object.entries(result.coreApiChecks).forEach(([api, available]) => {
    expect(available, `core api missing: ${api}`).toBe(true)
  })

  expect(result.initialColumnFields).toEqual(['id', 'name', 'age'])
  expect(result.statusColumnExistsAfterAdd).toBe(true)
  expect(result.ageColumnTitleAfterUpdate).toBe('Age (Years)')
  expect(result.statusColumnRemoved).toBe(true)
  expect(result.rowFourExistsAfterAdd).toBe(true)
  expect(result.updatedAge).toBe(23)
  expect(result.customEventCount).toBe(1)
  expect(result.heightStyleAfterSetHeight).toBe('260px')
  expect(result.hasAlertAfterAlert).toBe(true)
  expect(result.hasAlertAfterClear).toBe(false)
  expect(result.dataAfterReplace).toEqual([
    { id: 10, name: 'Eve', age: 30 },
    { id: 11, name: 'Frank', age: 33 }
  ])
  expect(result.dataCountAfterReplace).toBe(2)
  expect(result.dataCountAfterClear).toBe(0)
  expect(result.dataCount).toBe(2)
  expect(result.rowNames).toEqual(['Alice Final', 'Cara'])
  expect(result.moduleKeys.length).toBeGreaterThan(0)
})
