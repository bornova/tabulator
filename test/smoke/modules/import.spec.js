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
