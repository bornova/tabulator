import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('import module', async ({ page }) => {
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
    holder.id = 'import-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    const importTracker = {
      headerCalls: 0,
      valueCalls: 0,
      validatorCalls: 0,
      fileValidatorCalls: 0
    }

    const table = new Tabulator(holder, {
      autoColumns: true,
      importFormat(contents) {
        if (contents === 'VALID') {
          return [
            ['raw_id', 'raw_name'],
            ['1', 'alice'],
            ['2', 'bob']
          ]
        }

        return [
          ['raw_id', 'raw_name'],
          ['1', 'bad']
        ]
      },
      importHeaderTransform(value) {
        importTracker.headerCalls += 1
        return value.replace('raw_', '')
      },
      importValueTransform(value) {
        importTracker.valueCalls += 1

        if (!isNaN(Number(value))) {
          return Number(value)
        }

        return String(value).toUpperCase()
      },
      importDataValidator(data) {
        importTracker.validatorCalls += 1
        return Array.isArray(data) && data.length >= 2 ? true : 'import-invalid'
      },
      importFileValidator(file) {
        importTracker.fileValidatorCalls += 1
        return file.name.endsWith('.csv')
      },
      importReader: 'buffer',
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
      ],
      dataLoader: false,
      dataLoaderLoading: false
    })

    await new Promise((resolve) => table.on('tableBuilt', resolve))

    window.tabulatorInstance = table

    await table.setData('VALID')

    const importedData = table.getData()

    const fileValidationResult = table.modules.import.validateFile({ name: 'users.csv' })
    const fileValidationFail = table.modules.import.validateFile({ name: 'users.txt' })

    const validatedData = await table.modules.import.validateData(importedData)

    let rejectedMessage = null
    await table.modules.import.validateData([{ id: 1 }]).catch((err) => {
      rejectedMessage = err
    })

    return {
      modulePresent: !!table.modules.import,
      importedData,
      tracker: importTracker,
      fileValidationResult,
      fileValidationFail,
      validatedDataLength: validatedData.length,
      rejectedMessage,
      importReaderOption: table.options.importReader,
      importFunctionPresent: typeof table.import === 'function'
    }
  })

  await test.step('import module internals handle checks, lookup, structuring, mutation, and setData dispatch', async () => {
    const internal = await page.evaluate(async () => {
      const table = window.tabulatorInstance
      const module = table.modules.import

      const loadDataChecks = {
        stringData: module.loadDataCheck('some csv data'),
        arrayData: module.loadDataCheck([
          ['h1', 'h2'],
          ['v1', 'v2']
        ]),
        objectData: module.loadDataCheck({ key: 'value' })
      }

      const originalImportFormat = table.options.importFormat
      table.options.importFormat = null
      const noImportFormat = Boolean(module.loadDataCheck('some csv data'))
      table.options.importFormat = originalImportFormat

      const builtinImporter = module.lookupImporter('json')
      const customImporter = () => []
      const resolvedCustomImporter = module.lookupImporter(customImporter)

      const originalError = console.error
      let importerMissingErrored = false
      console.error = () => {
        importerMissingErrored = true
      }
      const missingImporter = module.lookupImporter('nonexistent')
      console.error = originalError

      const originalAutoColumns = table.options.autoColumns
      table.options.autoColumns = false
      const runtimeColumns = table.getColumns()
      const runtimeHeader1 = runtimeColumns[0]?.getDefinition().title
      const runtimeHeader2 = runtimeColumns[1]?.getDefinition().title
      const structuredColumns = module.structureArrayToColumns([
        [runtimeHeader1, runtimeHeader2],
        [10, 'Jane'],
        [11, 'Mark']
      ])
      table.options.autoColumns = originalAutoColumns

      const originalMutator = table.modules.mutator
      table.modules.mutator = {
        transformRow: (row, type) => ({ ...row, transformed: type === 'import' })
      }
      const mutated = module.mutateData([{ id: 1, name: 'One' }])
      table.modules.mutator = originalMutator

      const dispatchCalls = []
      const dispatchExternalCalls = []
      const originalDispatch = module.dispatch
      const originalDispatchExternal = module.dispatchExternal
      module.dispatch = (...args) => {
        dispatchCalls.push(args)
      }
      module.dispatchExternal = (...args) => {
        dispatchExternalCalls.push(args)
      }

      const originalSetData = table.setData
      table.setData = (data) => Promise.resolve(data)
      await module.setData([{ id: 99, name: 'Set Data' }])
      table.setData = originalSetData

      module.dispatch = originalDispatch
      module.dispatchExternal = originalDispatchExternal

      return {
        loadDataChecks,
        noImportFormat,
        builtinImporterIsFunction: typeof builtinImporter === 'function',
        resolvedCustomImporterMatches: resolvedCustomImporter === customImporter,
        missingImporterIsUndefined: missingImporter === undefined,
        importerMissingErrored,
        structuredColumns,
        mutated,
        dispatchCalls,
        dispatchExternalCalls
      }
    })

    expect(internal.loadDataChecks.stringData).toBe(true)
    expect(internal.loadDataChecks.arrayData).toBe(true)
    expect(internal.loadDataChecks.objectData).toBe(false)
    expect(internal.noImportFormat).toBe(false)
    expect(internal.builtinImporterIsFunction).toBe(true)
    expect(internal.resolvedCustomImporterMatches).toBe(true)
    expect(internal.missingImporterIsUndefined).toBe(true)
    expect(internal.importerMissingErrored).toBe(true)
    expect(internal.structuredColumns).toEqual([
      { id: 10, name: 'JANE' },
      { id: 11, name: 'MARK' }
    ])
    expect(internal.mutated).toEqual([{ id: 1, name: 'One', transformed: true }])
    expect(internal.dispatchCalls).toEqual([['import-imported', [{ id: 99, name: 'Set Data' }]]])
    expect(internal.dispatchExternalCalls).toEqual([['importImported', [{ id: 99, name: 'Set Data' }]]])
  })

  expect(result.modulePresent).toBe(true)
  expect(result.importFunctionPresent).toBe(true)
  expect(result.importReaderOption).toBe('buffer')
  expect(result.importedData).toEqual([
    { id: 1, name: 'ALICE' },
    { id: 2, name: 'BOB' }
  ])
  expect(result.tracker.headerCalls).toBeGreaterThan(0)
  expect(result.tracker.valueCalls).toBeGreaterThan(0)
  expect(result.tracker.validatorCalls).toBe(2)
  expect(result.tracker.fileValidatorCalls).toBe(2)
  expect(result.fileValidationResult).toBe(true)
  expect(result.fileValidationFail).toBe(false)
  expect(result.validatedDataLength).toBe(2)
  expect(result.rejectedMessage).toBe('import-invalid')

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
