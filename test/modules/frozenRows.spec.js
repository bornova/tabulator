import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

async function checkFrozenRowsNumber(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Cara' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' }
        ],
        frozenRows: 2
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const frozenNames = Array.from(
      holder.querySelectorAll('.tabulator-frozen-rows-holder .tabulator-row .tabulator-cell[tabulator-field="name"]')
    ).map((el) => el.textContent.trim())

    return {
      modulePresent: !!table.modules.frozenRows,
      frozenHolderPresent: !!holder.querySelector('.tabulator-frozen-rows-holder'),
      frozenCount: frozenNames.length,
      frozenNames
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.modulePresent).toBe(true)
  expect(result.frozenHolderPresent).toBe(true)
  expect(result.frozenCount).toBe(2)
  expect(result.frozenNames).toEqual(['Alice', 'Bob'])
}

async function checkFrozenRowsFunction(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        data: [
          { id: 1, name: 'Alice', pinned: true },
          { id: 2, name: 'Bob', pinned: false },
          { id: 3, name: 'Cara', pinned: true }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'Pinned', field: 'pinned' }
        ],
        frozenRows(row) {
          return row.getData().pinned === true
        }
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const frozenNames = Array.from(
      holder.querySelectorAll('.tabulator-frozen-rows-holder .tabulator-row .tabulator-cell[tabulator-field="name"]')
    ).map((el) => el.textContent.trim())

    return {
      frozenNames
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.frozenNames).toEqual(['Alice', 'Cara'])
}

async function checkFrozenRowsArrayDefaultField(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Cara' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' }
        ],
        frozenRows: [1, 3]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const frozenIds = Array.from(
      holder.querySelectorAll('.tabulator-frozen-rows-holder .tabulator-row .tabulator-cell[tabulator-field="id"]')
    ).map((el) => Number(el.textContent.trim()))

    return {
      frozenIds
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.frozenIds).toEqual([1, 3])
}

async function checkFrozenRowsCustomField(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        data: [
          { id: 1, code: 'A1', name: 'Alice' },
          { id: 2, code: 'B2', name: 'Bob' },
          { id: 3, code: 'C3', name: 'Cara' }
        ],
        columns: [
          { title: 'Code', field: 'code' },
          { title: 'Name', field: 'name' }
        ],
        frozenRowsField: 'code',
        frozenRows: ['B2', 'C3']
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const frozenCodes = Array.from(
      holder.querySelectorAll('.tabulator-frozen-rows-holder .tabulator-row .tabulator-cell[tabulator-field="code"]')
    ).map((el) => el.textContent.trim())

    return {
      frozenCodes
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.frozenCodes).toEqual(['B2', 'C3'])
}

async function checkFrozenRowsModuleApi(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Cara' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const mod = table.modules.frozenRows
    const internalRows = table.getRows().map((row) => row._row)
    const row1 = internalRows[0]
    const row2 = internalRows[1]
    const row3 = internalRows[2]

    let adjustCalls = 0
    const originalAdjustTableSize = table.rowManager.adjustTableSize
    table.rowManager.adjustTableSize = (...args) => {
      adjustCalls += 1
      return originalAdjustTableSize.apply(table.rowManager, args)
    }

    const refreshCalls = []
    const originalRefreshData = mod.refreshData
    mod.refreshData = (...args) => {
      refreshCalls.push(args)
      return originalRefreshData.apply(mod, args)
    }

    let styleRowsCalls = 0
    const originalStyleRows = mod.styleRows
    mod.styleRows = (...args) => {
      styleRowsCalls += 1
      return originalStyleRows.apply(mod, args)
    }

    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => {
      warnings.push(args.map((value) => String(value)).join(' '))
    }

    const isFrozenInitially = mod.isFrozen()

    mod.freezeRow(row1)
    const frozenAfterFreeze = mod.isFrozen()
    const isRow1FrozenAfterFreeze = mod.isRowFrozen(row1)

    mod.freezeRow(row1)

    const visibleRowsResult = mod.visibleRows(true, [row3]).map((row) => row.data.id)
    const getRowsFiltered = mod.getRows([row1, row2, row3]).map((row) => row.data.id)

    mod.unfreezeRow(row1)
    const isRow1FrozenAfterUnfreeze = mod.isRowFrozen(row1)

    mod.unfreezeRow(row1)

    mod.freezeRow(row2)
    const row2HasParentBeforeDetach = !!row2.getElement().parentNode
    mod.detachRow(row2)
    const row2HasParentAfterDetach = !!row2.getElement().parentNode
    const isRow2FrozenAfterDetach = mod.isRowFrozen(row2)

    console.warn = originalWarn
    table.rowManager.adjustTableSize = originalAdjustTableSize
    mod.refreshData = originalRefreshData
    mod.styleRows = originalStyleRows

    return {
      isFrozenInitially,
      frozenAfterFreeze,
      isRow1FrozenAfterFreeze,
      isRow1FrozenAfterUnfreeze,
      visibleRowsResult,
      getRowsFiltered,
      row2HasParentBeforeDetach,
      row2HasParentAfterDetach,
      isRow2FrozenAfterDetach,
      adjustCalls,
      refreshCalls,
      styleRowsCalls,
      warningAlreadyFrozen: warnings.some((warning) => warning.includes('Freeze Error - Row is already frozen')),
      warningAlreadyUnfrozen: warnings.some((warning) => warning.includes('Freeze Error - Row is already unfrozen'))
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.isFrozenInitially).toBe(false)
  expect(result.frozenAfterFreeze).toBe(true)
  expect(result.isRow1FrozenAfterFreeze).toBe(true)
  expect(result.isRow1FrozenAfterUnfreeze).toBe(false)
  expect(result.visibleRowsResult).toEqual([3, 1])
  expect(result.getRowsFiltered).toEqual([2, 3])
  expect(result.row2HasParentBeforeDetach).toBe(true)
  expect(result.row2HasParentAfterDetach).toBe(false)
  expect(result.isRow2FrozenAfterDetach).toBe(false)
  expect(result.adjustCalls).toBeGreaterThan(0)
  expect(result.refreshCalls.some((call) => call[0] === false && call[1] === 'display')).toBe(true)
  expect(result.styleRowsCalls).toBeGreaterThan(0)
  expect(result.warningAlreadyFrozen).toBe(true)
  expect(result.warningAlreadyUnfrozen).toBe(true)
}

test('frozenRows module', async ({ page }) => {
  await test.step('number mode', async () => {
    await checkFrozenRowsNumber(page)
  })

  await test.step('function mode', async () => {
    await checkFrozenRowsFunction(page)
  })

  await test.step('array mode with default field', async () => {
    await checkFrozenRowsArrayDefaultField(page)
  })

  await test.step('custom frozenRowsField mapping', async () => {
    await checkFrozenRowsCustomField(page)
  })

  await test.step('frozen rows module API behaviors', async () => {
    await checkFrozenRowsModuleApi(page)
  })
})
