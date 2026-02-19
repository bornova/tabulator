import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('edit module', async ({ page }) => {
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
    const buildTable = (holder, options) => {
      return new Promise((resolve) => {
        const instance = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve(instance), 1500)

        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })
    }

    const holder = document.createElement('div')

    holder.id = 'edit-all-table'
    holder.style.width = '1400px'
    root.appendChild(holder)

    const callbacks = {
      editing: 0,
      edited: 0,
      cancelled: 0
    }

    const runInputCommit = async (cell, value) => {
      cell.edit()
      const input = cell.getElement().querySelector('input, textarea')
      input.value = value
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.dispatchEvent(new Event('blur', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    const table = await buildTable(holder, {
      height: 260,
      editTriggerEvent: 'click',
      editorEmptyValue: null,
      editorEmptyValueFunc(value) {
        return value === ''
      },
      data: [
        {
          id: 1,
          inputField: 'alpha',
          textareaField: 'multi line',
          numberField: 10,
          rangeField: 35,
          dateField: '2024-01-02',
          timeField: '10:30',
          datetimeField: '2024-01-02T10:30',
          listField: 'A',
          starField: 3,
          progressField: 40,
          tickCrossField: true,
          adaptableField: true,
          emptyByColumn: 'seed'
        },
        {
          id: 2,
          inputField: 'beta',
          textareaField: 'line two',
          numberField: 20,
          rangeField: 50,
          dateField: '2024-01-03',
          timeField: '12:30',
          datetimeField: '2024-01-03T12:30',
          listField: 'B',
          starField: 2,
          progressField: 80,
          tickCrossField: false,
          adaptableField: false,
          emptyByColumn: 'seed2'
        }
      ],
      columns: [
        { title: 'ID', field: 'id' },
        {
          title: 'Input',
          field: 'inputField',
          editor: 'input',
          cellEditing() {
            callbacks.editing += 1
          },
          cellEdited() {
            callbacks.edited += 1
          },
          cellEditCancelled() {
            callbacks.cancelled += 1
          },
          editorParams: { elementAttributes: { 'data-editor': 'input' } }
        },
        {
          title: 'Textarea',
          field: 'textareaField',
          editor: 'textarea',
          editorParams: { elementAttributes: { 'data-editor': 'textarea' } }
        },
        {
          title: 'Number',
          field: 'numberField',
          editor: 'number',
          editorParams: { elementAttributes: { 'data-editor': 'number' } }
        },
        {
          title: 'Range',
          field: 'rangeField',
          editor: 'range',
          editorParams: { min: 0, max: 100, elementAttributes: { 'data-editor': 'range' } }
        },
        {
          title: 'Date',
          field: 'dateField',
          editor: 'date',
          editorParams: { elementAttributes: { 'data-editor': 'date' } }
        },
        {
          title: 'Time',
          field: 'timeField',
          editor: 'time',
          editorParams: { elementAttributes: { 'data-editor': 'time' } }
        },
        {
          title: 'Datetime',
          field: 'datetimeField',
          editor: 'datetime',
          editorParams: { elementAttributes: { 'data-editor': 'datetime' } }
        },
        {
          title: 'List',
          field: 'listField',
          editor: 'list',
          editorParams: { values: ['A', 'B'], elementAttributes: { 'data-editor': 'list' } }
        },
        {
          title: 'Star',
          field: 'starField',
          editor: 'star',
          editorParams: { elementAttributes: { 'data-editor': 'star' } }
        },
        {
          title: 'Progress',
          field: 'progressField',
          editor: 'progress',
          editorParams: { elementAttributes: { 'data-editor': 'progress' } }
        },
        {
          title: 'TickCross',
          field: 'tickCrossField',
          editor: 'tickCross',
          editorParams: { elementAttributes: { 'data-editor': 'tickCross' } }
        },
        {
          title: 'Adaptable',
          field: 'adaptableField',
          editor: 'adaptable',
          editorParams: {
            paramsLookup: {
              tickCross: { elementAttributes: { 'data-editor': 'adaptable' } }
            }
          }
        },
        {
          title: 'ColumnEmpty',
          field: 'emptyByColumn',
          editor: 'input',
          editorEmptyValue: 'COLUMN_EMPTY',
          editorEmptyValueFunc(value) {
            return value === 'EMPTY_COLUMN'
          }
        }
      ]
    })

    const row = table.getRows()[0]
    const row2 = table.getRows()[1]

    const checks = [
      { field: 'inputField', selector: 'input[data-editor="input"]' },
      { field: 'textareaField', selector: 'textarea[data-editor="textarea"]' },
      { field: 'numberField', selector: 'input[type="number"][data-editor="number"]' },
      { field: 'rangeField', selector: 'input[type="range"][data-editor="range"]' },
      { field: 'dateField', selector: 'input[type="date"][data-editor="date"]' },
      { field: 'timeField', selector: 'input[type="time"][data-editor="time"]' },
      { field: 'datetimeField', selector: 'input[type="datetime-local"][data-editor="datetime"]' },
      { field: 'listField', selector: 'input[data-editor="list"]' },
      { field: 'starField', selector: '[data-editor="star"]' },
      { field: 'progressField', selector: '[data-editor="progress"]' },
      { field: 'tickCrossField', selector: 'input[type="checkbox"][data-editor="tickCross"]' },
      { field: 'adaptableField', selector: 'input[type="checkbox"][data-editor="adaptable"]' },
      { field: 'emptyByColumn', selector: 'input' }
    ]

    const results = {}

    checks.forEach((check) => {
      const cell = row.getCell(check.field)
      cell.edit()

      const cellElement = cell.getElement()
      const found = !!cellElement.querySelector(check.selector)
      results[check.field] = found

      cell.cancelEdit()
    })

    await runInputCommit(row.getCell('inputField'), '')
    await runInputCommit(row.getCell('emptyByColumn'), 'EMPTY_COLUMN')

    row.getCell('inputField').edit()
    row.getCell('inputField').cancelEdit()

    const editedCellsBeforeClear = table.getEditedCells()
    const editedFieldsBeforeClear = editedCellsBeforeClear.map((cell) => cell.getField()).sort()
    const editedFlagsBeforeClear = editedCellsBeforeClear.map((cell) => cell.isEdited())

    table.clearCellEdited()

    const editedCellsAfterClear = table.getEditedCells().length
    const editedFlagsAfterClear = editedCellsBeforeClear.map((cell) => cell.isEdited())

    row.getCell('inputField').edit()
    const navigateResults = {
      right: table.navigateRight(),
      down: table.navigateDown(),
      left: table.navigateLeft(),
      up: table.navigateUp(),
      next: table.navigateNext(),
      prev: table.navigatePrev()
    }

    const currentCellFieldAfterNav = table.modules.edit.currentCell?.column?.getField()

    table.modules.edit.cancelEdit()

    const holderDbl = document.createElement('div')
    holderDbl.style.width = '400px'
    root.appendChild(holderDbl)

    const tableDbl = await buildTable(holderDbl, {
      editTriggerEvent: 'dblclick',
      data: [{ id: 1, name: 'dbl' }],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name', editor: 'input' }
      ]
    })

    const dblCellEl = tableDbl.getRow(1).getCell('name').getElement()
    dblCellEl.click()
    const openedOnSingleClick = !!dblCellEl.querySelector('input')
    dblCellEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 10))
    const openedOnDblClick = !!dblCellEl.querySelector('input')

    return {
      modulePresent: !!table.modules.edit,
      results,
      callbacks,
      convertedGlobalValue: row.getData().inputField,
      convertedColumnValue: row.getData().emptyByColumn,
      editedFieldsBeforeClear,
      editedFlagsBeforeClear,
      editedCellsAfterClear,
      editedFlagsAfterClear,
      navigateResults,
      currentCellFieldAfterNav,
      openedOnSingleClick,
      openedOnDblClick,
      tableFunctionPresence: {
        getEditedCells: typeof table.getEditedCells === 'function',
        clearCellEdited: typeof table.clearCellEdited === 'function',
        navigatePrev: typeof table.navigatePrev === 'function',
        navigateNext: typeof table.navigateNext === 'function',
        navigateLeft: typeof table.navigateLeft === 'function',
        navigateRight: typeof table.navigateRight === 'function',
        navigateUp: typeof table.navigateUp === 'function',
        navigateDown: typeof table.navigateDown === 'function'
      },
      row2Field: row2.getCell('inputField').getField()
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
  expect(result.modulePresent).toBe(true)
  expect(result.tableFunctionPresence).toEqual({
    getEditedCells: true,
    clearCellEdited: true,
    navigatePrev: true,
    navigateNext: true,
    navigateLeft: true,
    navigateRight: true,
    navigateUp: true,
    navigateDown: true
  })

  Object.entries(result.results).forEach(([field, passed]) => {
    expect(passed, `editor assertion failed for ${field}`).toBe(true)
  })

  expect(result.callbacks.editing).toBeGreaterThan(0)
  expect(result.callbacks.edited).toBeGreaterThan(0)
  expect(result.callbacks.cancelled).toBeGreaterThan(0)

  expect(result.convertedGlobalValue).toBeNull()
  expect(result.convertedColumnValue).toBe('COLUMN_EMPTY')

  expect(result.editedFieldsBeforeClear).toEqual(expect.arrayContaining(['emptyByColumn', 'inputField']))
  expect(result.editedFlagsBeforeClear.every(Boolean)).toBe(true)
  expect(result.editedCellsAfterClear).toBe(0)
  expect(result.editedFlagsAfterClear.some((flag) => flag)).toBe(false)

  expect(result.navigateResults.right).toBe(true)
  expect(result.navigateResults.down).toBe(true)
  expect(result.navigateResults.left).toBe(true)
  expect(result.navigateResults.up).toBe(true)
  expect(result.navigateResults.next).toBe(true)
  expect(result.navigateResults.prev).toBe(true)
  expect(result.currentCellFieldAfterNav).toBe('inputField')

  expect(result.openedOnSingleClick).toBe(false)
  expect(result.openedOnDblClick).toBe(true)
  expect(result.row2Field).toBe('inputField')
})
