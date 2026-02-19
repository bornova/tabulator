import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('persistence module', async ({ page }) => {
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
    window.localStorage.clear()
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'persistence-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.tabulatorInstance = new Tabulator(holder, {
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' }
      ],
      columns: [
        { title: 'ID', field: 'id', width: 100 },
        { title: 'Value', field: 'value', visible: true }
      ],
      persistence: true,
      persistenceID: 'smoke',
      persistenceMode: 'local',
      persistenceReaderFunc: false,
      persistenceWriterFunc: false
    })
  })

  await test.step('persistence options enable module', async () => {
    const modulePresent = await page.evaluate(() => !!window.tabulatorInstance.modules.persistence)
    expect(modulePresent).toBe(true)
  })

  await test.step('getColumnLayout and setColumnLayout API functions work', async () => {
    const result = await page.evaluate(() => {
      const mod = window.tabulatorInstance.modules.persistence
      const layout = window.tabulatorInstance.getColumnLayout()
      // Change width and visibility
      layout[0].width = 200
      layout[1].visible = false
      window.tabulatorInstance.setColumnLayout(layout)
      return {
        width: window.tabulatorInstance.getColumn('id').getWidth(),
        visible: window.tabulatorInstance.getColumn('value').isVisible()
      }
    })
    expect(result.width).toBe(200)
    expect(result.visible).toBe(false)
  })

  await test.step('persistence saves to localStorage', async () => {
    const key = 'tabulator-smoke-columns'
    const found = await page.evaluate((key) => {
      // Trigger a column move to force save
      const col = window.tabulatorInstance.getColumn('id')
      col.setWidth(150)
      return !!window.localStorage.getItem(key)
    }, 'tabulator-smoke-columns')
    expect(found).toBe(true)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
