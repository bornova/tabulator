import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('history module', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  await test.step('module is present', async () => {
    const present = await page.evaluate(() => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.id = 'history-table'
      holder.style.width = '600px'
      root.appendChild(holder)

      window.tabulatorInstance = new Tabulator(holder, {
        data: [
          { id: 1, name: 'Alice', age: 22 },
          { id: 2, name: 'Bob', age: 31 }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name', editor: 'input' },
          { title: 'Age', field: 'age', editor: 'input' }
        ],
        history: true
      })
      return !!window.tabulatorInstance.modules.history
    })
    expect(present).toBe(true)
  })

  await test.step('edit triggers history, undo/redo/clear work', async () => {
    const result = await page.evaluate(async () => {
      const table = window.tabulatorInstance
      const row = table.getRows()[0]
      const cell = row.getCell('name')
      cell.setValue('Alicia')
      const afterEdit = cell.getValue()
      const undoOk = table.undo()
      const afterUndo = cell.getValue()
      const redoOk = table.redo()
      const afterRedo = cell.getValue()
      table.clearHistory()
      const undoSize = table.getHistoryUndoSize()
      const redoSize = table.getHistoryRedoSize()
      return {
        afterEdit,
        undoOk,
        afterUndo,
        redoOk,
        afterRedo,
        undoSize,
        redoSize
      }
    })
    expect(result.afterEdit).toBe('Alicia')
    expect(result.undoOk).toBe(true)
    expect(result.afterUndo).toBe('Alice')
    expect(result.redoOk).toBe(true)
    expect(result.afterRedo).toBe('Alicia')
    expect(result.undoSize).toBe(0)
    expect(result.redoSize).toBe(0)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
