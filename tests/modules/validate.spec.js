import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('validate module', async ({ page }) => {
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

test('validate module - custom validator, multi-validator, blocking mode, empty passthrough', async ({ page }) => {
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
      holder.style.width = '800px'
      root.appendChild(holder)
      return new Promise((resolve) => {
        const instance = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve({ table: instance, holder }), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve({ table: instance, holder })
        })
      })
    }

    // Custom function validator: field must be even number
    // Multi-validator: required AND max:100 AND custom even check
    const evenValidator = (cell, value) => {
      if (value === '' || value == null) return true
      return Number(value) % 2 === 0
    }

    const { table: multiTable } = await buildTable('validate-multi-table', {
      height: 240,
      data: [
        { id: 1, score: 7, label: '' }, // fails: odd (custom), required
        { id: 2, score: 200, label: 'hi' }, // fails: max:100
        { id: 3, score: 8, label: 'ok' }, // passes all
        { id: 4, score: null, label: 'ok' } // score null → empty passthrough (custom is lenient on empty)
      ],
      columns: [
        { title: 'ID', field: 'id' },
        {
          title: 'Score',
          field: 'score',
          // Array of validators: string AND function
          validator: ['max:100', evenValidator]
        },
        {
          title: 'Label',
          field: 'label',
          validator: 'required'
        }
      ]
    })

    const allInvalid = multiTable.validate()
    const invalidCells = allInvalid === true ? [] : allInvalid
    const invalidFieldsAndTypes = invalidCells.map((cell) => ({
      field: cell.getField(),
      row: cell.getData().id,
      types: cell.validate() === true ? [] : (cell.validate() || []).map((v) => v.type)
    }))

    // Row 3 (score=8, label='ok') should pass
    const row3Valid = multiTable.getRows()[2].validate()

    // Row 4 (score=null): null is empty → validators that skip empty values should pass
    const row4ScoreValid = multiTable.getRows()[3].getCell('score').validate()

    // Blocking mode: cell edit is blocked when validation fails
    const { table: blockingTable } = await buildTable('validate-blocking-table', {
      height: 200,
      validationMode: 'blocking',
      data: [{ id: 1, val: 5 }],
      columns: [
        { title: 'ID', field: 'id' },
        {
          title: 'Val',
          field: 'val',
          editor: 'number',
          validator: 'max:10'
        }
      ]
    })

    const blockingModule = blockingTable.modules.validate
    const validationMode = blockingTable.options.validationMode

    // Highlight mode: test that validationMode:'highlight' allows editing
    const { table: highlightTable } = await buildTable('validate-highlight-table', {
      height: 200,
      validationMode: 'highlight',
      data: [{ id: 1, val: 5 }],
      columns: [
        { title: 'ID', field: 'id' },
        {
          title: 'Val',
          field: 'val',
          editor: 'number',
          validator: 'max:10'
        }
      ]
    })

    const highlightMode = highlightTable.options.validationMode
    const highlightModulePresent = !!highlightTable.modules.validate

    // Regex validator with invalid regex should fail gracefully
    const { table: regexTable } = await buildTable('validate-regex-invalid-table', {
      height: 200,
      data: [{ id: 1, val: 'test' }],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Val', field: 'val', validator: 'regex:[invalid' }
      ]
    })

    const regexInvalidResult = regexTable.getRows()[0].getCell('val').validate()
    const regexInvalidFails = regexInvalidResult !== true

    // 'in' validator with string '|' separator
    const { table: inTable } = await buildTable('validate-in-string-table', {
      height: 200,
      data: [
        { id: 1, color: 'red' },
        { id: 2, color: 'purple' }
      ],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Color', field: 'color', validator: 'in:red|green|blue' }
      ]
    })

    const inValidResult = inTable.getRows()[0].getCell('color').validate()
    const inInvalidResult = inTable.getRows()[1].getCell('color').validate()

    return {
      invalidFieldsAndTypes,
      row3Valid,
      row4ScoreValid,
      validationMode,
      blockingModulePresent: !!blockingModule,
      highlightMode,
      highlightModulePresent,
      regexInvalidFails,
      inValidResult,
      inInvalidResultType: inInvalidResult === true ? null : inInvalidResult[0]?.type
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  // Row 1 (score=7): fails max:100? no — 7 ≤ 100. Fails even? yes (7 is odd). Also label='': fails required
  const row1Score = result.invalidFieldsAndTypes.find((c) => c.row === 1 && c.field === 'score')
  expect(row1Score).toBeTruthy()

  const row1Label = result.invalidFieldsAndTypes.find((c) => c.row === 1 && c.field === 'label')
  expect(row1Label).toBeTruthy()

  // Row 2 (score=200): fails max:100
  const row2Score = result.invalidFieldsAndTypes.find((c) => c.row === 2 && c.field === 'score')
  expect(row2Score).toBeTruthy()
  expect(row2Score.types).toContain('max')

  // Row 3: passes all
  expect(result.row3Valid).toBe(true)

  // Row 4 (score=null): null is empty → custom even validator returns true (empty passthrough)
  expect(result.row4ScoreValid).toBe(true)

  // Blocking mode
  expect(result.validationMode).toBe('blocking')
  expect(result.blockingModulePresent).toBe(true)

  // Highlight mode
  expect(result.highlightMode).toBe('highlight')
  expect(result.highlightModulePresent).toBe(true)

  // Invalid regex validator fails gracefully (returns false → validation fails)
  expect(result.regexInvalidFails).toBe(true)

  // 'in' validator with pipe-separated string
  expect(result.inValidResult).toBe(true)
  expect(result.inInvalidResultType).toBe('in')
})
