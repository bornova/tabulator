import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { expect, test } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixtureUrl = pathToFileURL(path.resolve(__dirname, '../features.smoke.html')).toString()

test('validate module smoke - all default validators', async ({ page }) => {
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

    const buildTable = (id, options) => {
      const holder = document.createElement('div')
      holder.id = id
      holder.style.width = '1400px'
      root.appendChild(holder)

      return new Promise((resolve) => {
        const table = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve(table), 1500)

        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const invalidRow1 = {
      id: 1,
      integerField: 1.5,
      floatField: 4,
      numericField: 'abc',
      stringField: '123',
      alphanumericField: 'abc-1',
      maxField: 11,
      minField: 2,
      startsField: 'zzab',
      endsField: 'yzx',
      minLengthField: 'abc',
      maxLengthField: 'abcde',
      inField: 'blue',
      regexField: 'B12',
      requiredField: '',
      uniqueField: 'dup'
    }

    const invalidRow2 = {
      id: 2,
      integerField: 2,
      floatField: 4.2,
      numericField: 42,
      stringField: 'alpha',
      alphanumericField: 'abc1',
      maxField: 10,
      minField: 3,
      startsField: 'abz',
      endsField: 'xyz',
      minLengthField: 'abcd',
      maxLengthField: 'abcd',
      inField: 'red',
      regexField: 'A12',
      requiredField: 'ok',
      uniqueField: 'dup'
    }

    const validRow1Patch = {
      id: 1,
      integerField: 2,
      floatField: 4.5,
      numericField: 42,
      stringField: 'alpha',
      alphanumericField: 'abc1',
      maxField: 10,
      minField: 3,
      startsField: 'Abc',
      endsField: 'xYZ',
      minLengthField: 'abcd',
      maxLengthField: 'abcd',
      inField: 'green',
      regexField: 'A12',
      requiredField: 'set',
      uniqueField: 'dup'
    }

    const validatorColumns = [
      { title: 'Integer', field: 'integerField', validator: 'integer' },
      { title: 'Float', field: 'floatField', validator: 'float' },
      { title: 'Numeric', field: 'numericField', validator: 'numeric' },
      { title: 'String', field: 'stringField', validator: 'string' },
      { title: 'AlphaNum', field: 'alphanumericField', validator: 'alphanumeric' },
      { title: 'Max', field: 'maxField', validator: 'max:10' },
      { title: 'Min', field: 'minField', validator: 'min:3' },
      { title: 'Starts', field: 'startsField', validator: 'starts:ab' },
      { title: 'Ends', field: 'endsField', validator: 'ends:yz' },
      { title: 'MinLen', field: 'minLengthField', validator: 'minLength:4' },
      { title: 'MaxLen', field: 'maxLengthField', validator: 'maxLength:4' },
      { title: 'In', field: 'inField', validator: 'in:red|green' },
      { title: 'Regex', field: 'regexField', validator: 'regex:^A\\d{2}$' },
      { title: 'Required', field: 'requiredField', validator: 'required' },
      { title: 'Unique', field: 'uniqueField', validator: 'unique' }
    ]

    const table = await buildTable('validate-all-table', {
      height: 260,
      data: [invalidRow1, invalidRow2],
      columns: [{ title: 'ID', field: 'id' }, ...validatorColumns]
    })

    const [row1] = table.getRows()
    const fields = validatorColumns.map((col) => col.field)
    const row1ValidationMap = {}

    fields.forEach((field) => {
      const validationResult = row1.getCell(field).validate()
      row1ValidationMap[field] = validationResult === true ? true : validationResult[0]?.type || false
    })

    const tableValidateInitial = table.validate()
    const invalidCellsInitialFields = table.getInvalidCells().map((cell) => cell.getField())
    const invalidCellsInitialCount = invalidCellsInitialFields.length

    const requiredCell = row1.getCell('requiredField')
    const requiredClassAfterValidate = requiredCell.getElement().classList.contains('tabulator-validation-fail')
    const requiredCellIsValidBeforeClear = requiredCell.isValid()

    requiredCell.clearValidation()

    const requiredCellIsValidAfterClear = requiredCell.isValid()
    const invalidCellsAfterSingleClearCount = table.getInvalidCells().length

    const columnValidateCount =
      table.getColumn('maxField').validate() === true ? 0 : table.getColumn('maxField').validate().length
    const rowValidateCount = row1.validate() === true ? 0 : row1.validate().length

    table.clearCellValidation()
    const invalidCellsAfterClearAll = table.getInvalidCells().length

    await table.updateData([validRow1Patch, { id: 2, uniqueField: 'other' }])

    const tableValidateAfterFix = table.validate()
    const invalidCellsAfterFixCount = table.getInvalidCells().length

    const manualTable = await buildTable('validate-manual-table', {
      height: 180,
      validationMode: 'manual',
      data: [{ id: 11, requiredField: '' }],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Required', field: 'requiredField', validator: 'required' }
      ]
    })

    const manualCell = manualTable.getRows()[0].getCell('requiredField')
    const manualValidateResult = manualCell.validate()
    const manualFailClass = manualCell.getElement().classList.contains('tabulator-validation-fail')

    return {
      modulePresent: !!table.modules.validate,
      row1ValidationMap,
      tableValidateInitialIsArray: Array.isArray(tableValidateInitial),
      invalidCellsInitialFields,
      invalidCellsInitialCount,
      requiredClassAfterValidate,
      requiredCellIsValidBeforeClear,
      requiredCellIsValidAfterClear,
      invalidCellsAfterSingleClearCount,
      columnValidateCount,
      rowValidateCount,
      invalidCellsAfterClearAll,
      tableValidateAfterFix,
      invalidCellsAfterFixCount,
      manualValidateType: manualValidateResult === true ? 'valid' : manualValidateResult[0]?.type,
      manualFailClass
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.modulePresent).toBe(true)
  expect(result.row1ValidationMap.integerField).toBe('integer')
  expect(result.row1ValidationMap.floatField).toBe('float')
  expect(result.row1ValidationMap.numericField).toBe('numeric')
  expect(result.row1ValidationMap.stringField).toBe('string')
  expect(result.row1ValidationMap.alphanumericField).toBe('alphanumeric')
  expect(result.row1ValidationMap.maxField).toBe('max')
  expect(result.row1ValidationMap.minField).toBe('min')
  expect(result.row1ValidationMap.startsField).toBe('starts')
  expect(result.row1ValidationMap.endsField).toBe('ends')
  expect(result.row1ValidationMap.minLengthField).toBe('minLength')
  expect(result.row1ValidationMap.maxLengthField).toBe('maxLength')
  expect(result.row1ValidationMap.inField).toBe('in')
  expect(result.row1ValidationMap.regexField).toBe('regex')
  expect(result.row1ValidationMap.requiredField).toBe('required')
  expect(result.row1ValidationMap.uniqueField).toBe('unique')

  expect(result.tableValidateInitialIsArray).toBe(true)
  expect(result.invalidCellsInitialCount).toBeGreaterThanOrEqual(16)
  expect(result.invalidCellsInitialFields).toEqual(expect.arrayContaining(['requiredField', 'uniqueField']))

  expect(result.requiredClassAfterValidate).toBe(true)
  expect(result.requiredCellIsValidBeforeClear).toBe(false)
  expect(result.requiredCellIsValidAfterClear).toBe(true)
  expect(result.invalidCellsAfterSingleClearCount).toBeLessThan(result.invalidCellsInitialCount)

  expect(result.columnValidateCount).toBe(1)
  expect(result.rowValidateCount).toBeGreaterThan(1)

  expect(result.invalidCellsAfterClearAll).toBe(0)
  expect(result.tableValidateAfterFix).toBe(true)
  expect(result.invalidCellsAfterFixCount).toBe(0)

  expect(result.manualValidateType).toBe('required')
  expect(result.manualFailClass).toBe(false)
})
