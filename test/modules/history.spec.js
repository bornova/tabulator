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

  await test.step('history starts empty and exposes expected APIs', async () => {
    const result = await page.evaluate(() => {
      const table = window.tabulatorInstance
      const history = table.modules.history

      return {
        undoSize: table.getHistoryUndoSize(),
        redoSize: table.getHistoryRedoSize(),
        hasRowDeleted: typeof history.rowDeleted === 'function',
        hasAction: typeof history.action === 'function'
      }
    })

    expect(result.undoSize).toBe(0)
    expect(result.redoSize).toBe(0)
    expect(result.hasRowDeleted).toBe(true)
    expect(result.hasAction).toBe(true)
  })

  await test.step('action records history entries directly', async () => {
    const result = await page.evaluate(() => {
      const history = window.tabulatorInstance.modules.history
      history.clear()

      const testComponent = { id: 'component-test' }
      const testData = { foo: 'bar' }
      history.action('testAction', testComponent, testData)

      return {
        historyLength: history.history.length,
        index: history.index,
        entryType: history.history[0]?.type,
        entryComponentMatches: history.history[0]?.component === testComponent,
        entryDataMatches: history.history[0]?.data === testData
      }
    })

    expect(result.historyLength).toBe(1)
    expect(result.index).toBe(0)
    expect(result.entryType).toBe('testAction')
    expect(result.entryComponentMatches).toBe(true)
    expect(result.entryDataMatches).toBe(true)
  })

  await test.step('edit triggers history, undo/redo/clear work', async () => {
    const result = await page.evaluate(async () => {
      const table = window.tabulatorInstance
      table.clearHistory()
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

  await test.step('multiple undo and redo operations replay correctly', async () => {
    const result = await page.evaluate(() => {
      const table = window.tabulatorInstance
      table.clearHistory()

      const row = table.getRows()[0]
      const cell = row.getCell('name')
      const originalValue = cell.getValue()

      cell.setValue('Change 1')
      cell.setValue('Change 2')
      cell.setValue('Change 3')

      table.undo()
      table.undo()
      table.undo()

      const valueAfterUndoAll = cell.getValue()
      const undoSizeAfterUndoAll = table.getHistoryUndoSize()
      const redoSizeAfterUndoAll = table.getHistoryRedoSize()

      table.redo()
      const valueAfterRedo1 = cell.getValue()
      table.redo()
      const valueAfterRedo2 = cell.getValue()
      table.redo()
      const valueAfterRedo3 = cell.getValue()

      return {
        originalValue,
        valueAfterUndoAll,
        undoSizeAfterUndoAll,
        redoSizeAfterUndoAll,
        valueAfterRedo1,
        valueAfterRedo2,
        valueAfterRedo3
      }
    })

    expect(result.valueAfterUndoAll).toBe(result.originalValue)
    expect(result.undoSizeAfterUndoAll).toBe(0)
    expect(result.redoSizeAfterUndoAll).toBe(3)
    expect(result.valueAfterRedo1).toBe('Change 1')
    expect(result.valueAfterRedo2).toBe('Change 2')
    expect(result.valueAfterRedo3).toBe('Change 3')
  })

  await test.step('undo and redo warn and return false when no history is available', async () => {
    const result = await page.evaluate(() => {
      const table = window.tabulatorInstance
      table.clearHistory()

      const originalWarn = console.warn
      let warnCount = 0
      console.warn = () => {
        warnCount += 1
      }

      const undoResult = table.undo()
      const redoResult = table.redo()

      console.warn = originalWarn

      return {
        undoResult,
        redoResult,
        warnCount
      }
    })

    expect(result.undoResult).toBe(false)
    expect(result.redoResult).toBe(false)
    expect(result.warnCount).toBeGreaterThanOrEqual(2)
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
