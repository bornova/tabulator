import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('comms module options smoke', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  await page.evaluate(() => {
    const root = document.getElementById('smoke-root')
    // Table 1
    const holder1 = document.createElement('div')
    holder1.id = 'comms-table-1'
    holder1.style.width = '400px'
    root.appendChild(holder1)
    // Table 2
    const holder2 = document.createElement('div')
    holder2.id = 'comms-table-2'
    holder2.style.width = '400px'
    root.appendChild(holder2)

    window.commsReceived = null

    window.tab1 = new Tabulator(holder1, {
      data: [{ id: 1, value: 'A' }],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Value', field: 'value' }
      ]
    })
    window.tab2 = new Tabulator(holder2, {
      data: [{ id: 2, value: 'B' }],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Value', field: 'value' }
      ]
    })
    // Patch commsReceived onto tab1's comms module
    window.tab1.modules.comms.commsReceived = function (table, action, data) {
      window.commsReceived = { table, action, data }
      return 'received!'
    }
    // Register both tables in the registry for comms
    Tabulator.registry = {
      lookupTable(sel) {
        if (sel === '#comms-table-1') return [window.tab1]
        if (sel === '#comms-table-2') return [window.tab2]
        return []
      }
    }
    window.tab1.constructor.registry = Tabulator.registry
    window.tab2.constructor.registry = Tabulator.registry
  })

  await test.step('tableComms function is registered', async () => {
    const present = await page.evaluate(() => typeof window.tab1.tableComms === 'function')
    expect(present).toBe(true)
  })

  await test.step('inter-table comms triggers commsReceived', async () => {
    const result = await page.evaluate(() => {
      window.commsReceived = null
      window.tab2.modules.comms.send('#comms-table-1', 'comms', 'testAction', { foo: 42 })
      return new Promise((resolve) => setTimeout(() => resolve(window.commsReceived), 100))
    })
    expect(result).toBeTruthy()
    expect(result.action).toBe('testAction')
    expect(result.data.foo).toBe(42)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
