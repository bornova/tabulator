import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('edit module smoke - all default editors', async ({ page }) => {
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

    holder.id = 'edit-all-table'
    holder.style.width = '1400px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        height: 260,
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
            adaptableField: true
          }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          {
            title: 'Input',
            field: 'inputField',
            editor: 'input',
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
          }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const row = table.getRows()[0]

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
      { field: 'adaptableField', selector: 'input[type="checkbox"][data-editor="adaptable"]' }
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

    return {
      modulePresent: !!table.modules.edit,
      results
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
  expect(result.modulePresent).toBe(true)

  Object.entries(result.results).forEach(([field, passed]) => {
    expect(passed, `editor assertion failed for ${field}`).toBe(true)
  })
})
