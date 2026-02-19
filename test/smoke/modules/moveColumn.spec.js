import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('moveColumn module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('movableColumns disabled does not initialize per-column move handlers', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')

      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableColumns: false,
          data: [{ id: 1, name: 'Alice' }],
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

      const columns = table.columnManager.columnsByIndex

      return {
        modulePresent: !!table.modules.moveColumn,
        hasAnyMoveConfig: columns.some((column) => !!column.modules.moveColumn),
        hasPlaceholderClass: table.modules.moveColumn.placeholderElement.classList.contains('tabulator-col-placeholder')
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.hasAnyMoveConfig).toBe(false)
    expect(result.hasPlaceholderClass).toBe(true)
  })

  await test.step('movableColumns enabled initializes move handlers for eligible columns', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')

      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableColumns: true,
          data: [{ id: 1, name: 'Alice' }],
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

      const columns = table.columnManager.columnsByIndex
      const firstConfig = columns[0].modules.moveColumn
      const secondConfig = columns[1].modules.moveColumn

      return {
        hasFirstMoveConfig: !!firstConfig,
        hasSecondMoveConfig: !!secondConfig,
        firstHasMousemoveHandler: typeof firstConfig?.mousemove === 'function',
        secondHasMousemoveHandler: typeof secondConfig?.mousemove === 'function'
      }
    })

    expect(result.hasFirstMoveConfig).toBe(true)
    expect(result.hasSecondMoveConfig).toBe(true)
    expect(result.firstHasMousemoveHandler).toBe(true)
    expect(result.secondHasMousemoveHandler).toBe(true)
  })

  await test.step('movableColumns skips frozen columns from move handler setup', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')

      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableColumns: true,
          data: [{ id: 1, name: 'Alice', age: 30 }],
          columns: [
            { title: 'ID', field: 'id', frozen: true },
            { title: 'Name', field: 'name' },
            { title: 'Age', field: 'age' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const columns = table.columnManager.columnsByIndex
      const frozenColumn = columns.find((column) => column.getField() === 'id')
      const normalColumn = columns.find((column) => column.getField() === 'name')

      return {
        frozenHasMoveHandler: typeof frozenColumn.modules.moveColumn?.mousemove === 'function',
        normalHasMoveHandler: typeof normalColumn.modules.moveColumn?.mousemove === 'function'
      }
    })

    expect(result.frozenHasMoveHandler).toBe(false)
    expect(result.normalHasMoveHandler).toBe(true)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
