import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from './smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('tabulator core smoke - base class without optional modules', async ({ page }) => {
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
      addData: typeof table.addData === 'function',
      updateRow: typeof table.updateRow === 'function',
      deleteRow: typeof table.deleteRow === 'function',
      getRows: typeof table.getRows === 'function',
      setColumns: typeof table.setColumns === 'function',
      getColumns: typeof table.getColumns === 'function'
    }

    await table.addData([{ id: 3, name: 'Cara', age: 28 }])
    await table.updateRow(1, { name: 'Alice Updated' })
    await table.deleteRow(2)

    const optionalModulesAbsent = ['sort', 'filter', 'edit', 'download', 'clipboard'].every(
      (key) => !table.modules[key]
    )
    const moduleKeys = Object.keys(table.modules)
    const data = table.getData()

    table.destroy()

    return {
      moduleKeys,
      optionalModulesAbsent,
      coreApiChecks,
      dataCount: data.length,
      rowNames: data.map((row) => row.name)
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.optionalModulesAbsent).toBe(true)
  Object.entries(result.coreApiChecks).forEach(([api, available]) => {
    expect(available, `core api missing: ${api}`).toBe(true)
  })

  expect(result.dataCount).toBe(2)
  expect(result.rowNames).toEqual(['Alice Updated', 'Cara'])
  expect(result.moduleKeys.length).toBeGreaterThan(0)
})
