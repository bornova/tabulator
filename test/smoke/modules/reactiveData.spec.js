import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test.describe('reactiveData module', () => {
  test('reactiveData: true enables reactivity (array mutators and property assignment)', async ({ page }) => {
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
      holder.id = 'reactive-table-true'
      holder.style.width = '600px'
      root.appendChild(holder)

      const data = [
        { id: 1, name: 'Alice', age: 22 },
        { id: 2, name: 'Bob', age: 31 }
      ]
      const table = new Tabulator(holder, {
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age' }
        ],
        data,
        reactiveData: true
      })

      // Wait for table to build
      await new Promise((resolve) => table.on('tableBuilt', resolve))

      // Test push
      data.push({ id: 3, name: 'Cara', age: 28 })
      // Test unshift
      data.unshift({ id: 0, name: 'Zed', age: 40 })
      // Test pop
      data.pop()
      // Test shift
      data.shift()
      // Test splice (insert)
      data.splice(1, 0, { id: 9, name: 'Eve', age: 35 })
      // Test splice (remove)
      data.splice(1, 1)

      // Test direct property assignment
      data[0].name = 'AliceUpdated'

      // Wait a tick for reactivity
      await new Promise((resolve) => setTimeout(resolve, 10))

      const tableData = table.getData()
      return {
        modulePresent: !!table.modules.reactiveData,
        rowCount: tableData.length,
        firstName: tableData[0].name
      }
    })
    expect(result.modulePresent).toBe(true)
    expect(result.rowCount).toBe(2)
    expect(result.firstName).toBe('AliceUpdated')
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})
