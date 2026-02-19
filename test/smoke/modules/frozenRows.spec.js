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

test('frozenRows module options smoke', async ({ page }) => {
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
})
