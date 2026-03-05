import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

async function checkLeftFrozenColumns(page) {
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
          { id: 1, name: 'Alice', age: 20 },
          { id: 2, name: 'Bob', age: 30 }
        ],
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

    const frozenColumns = table.modules.frozenColumns.getFrozenColumns()

    return {
      modulePresent: !!table.modules.frozenColumns,
      frozenCount: frozenColumns.length,
      leftEdgeCount: holder.querySelectorAll('.tabulator-frozen-left').length,
      frozenClassCount: holder.querySelectorAll('.tabulator-frozen').length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.modulePresent).toBe(true)
  expect(result.frozenCount).toBe(1)
  expect(result.leftEdgeCount).toBeGreaterThan(0)
  expect(result.frozenClassCount).toBeGreaterThan(0)
}

async function checkRightFrozenColumns(page) {
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
          { id: 1, name: 'Alice', age: 20, score: 100 },
          { id: 2, name: 'Bob', age: 30, score: 90 }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age', frozen: true },
          { title: 'Score', field: 'score', frozen: true }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const frozenDefs = table.modules.frozenColumns.getFrozenColumns().map((col) => ({
      field: col.getField(),
      position: col.modules.frozen.position,
      edge: col.modules.frozen.edge
    }))

    return {
      rightClassCount: holder.querySelectorAll('.tabulator-frozen-right').length,
      rightFrozenCount: frozenDefs.filter((def) => def.position === 'right').length,
      hasRightEdgeColumn: frozenDefs.some((def) => def.position === 'right' && def.edge)
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.rightClassCount).toBeGreaterThan(0)
  expect(result.rightFrozenCount).toBe(2)
  expect(result.hasRightEdgeColumn).toBe(true)
}

async function checkMixedFrozenRegions(page) {
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
          { id: 1, name: 'Alice', age: 20, score: 100 },
          { id: 2, name: 'Bob', age: 30, score: 90 }
        ],
        columns: [
          { title: 'ID', field: 'id', frozen: true },
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age', frozen: true },
          { title: 'Score', field: 'score', frozen: true }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const frozenDefs = table.modules.frozenColumns.getFrozenColumns().map((col) => ({
      field: col.getField(),
      position: col.modules.frozen.position
    }))

    return {
      hasLeftAndRight:
        frozenDefs.some((def) => def.field === 'id' && def.position === 'left') &&
        frozenDefs.some((def) => def.field === 'age' && def.position === 'right') &&
        frozenDefs.some((def) => def.field === 'score' && def.position === 'right'),
      leftClassCount: holder.querySelectorAll('.tabulator-frozen-left').length,
      rightClassCount: holder.querySelectorAll('.tabulator-frozen-right').length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hasLeftAndRight).toBe(true)
  expect(result.leftClassCount).toBeGreaterThan(0)
  expect(result.rightClassCount).toBeGreaterThan(0)
}

async function checkGroupedFrozenColumns(page) {
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
          { id: 1, first: 'Alice', last: 'A', age: 20 },
          { id: 2, first: 'Bob', last: 'B', age: 30 }
        ],
        columns: [
          {
            title: 'Identity',
            frozen: true,
            columns: [
              { title: 'ID', field: 'id' },
              { title: 'First', field: 'first' }
            ]
          },
          {
            title: 'Info',
            columns: [
              { title: 'Last', field: 'last' },
              { title: 'Age', field: 'age' }
            ]
          }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const frozenFields = table.modules.frozenColumns
      .getFrozenColumns()
      .map((col) => col.getField())
      .sort()

    return {
      frozenFields,
      frozenHeaderCount: holder.querySelectorAll('.tabulator-col.tabulator-frozen').length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.frozenFields).toEqual(['first', 'id'])
  expect(result.frozenHeaderCount).toBeGreaterThan(0)
}

async function checkInvalidFrozenChildWarning(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const warnings = []
    const originalWarn = console.warn
    console.warn = (...args) => {
      warnings.push(args.map((value) => String(value)).join(' '))
      originalWarn(...args)
    }

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        data: [{ id: 1, first: 'Alice', last: 'A' }],
        columns: [
          {
            title: 'Identity',
            columns: [
              { title: 'ID', field: 'id', frozen: true },
              { title: 'First', field: 'first' }
            ]
          },
          { title: 'Last', field: 'last' }
        ]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    console.warn = originalWarn

    return {
      warningCount: warnings.filter((warning) => warning.includes('Frozen Column Error')).length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.warningCount).toBeGreaterThan(0)
}

async function checkFrozenColumnsModuleApi(page) {
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
          { id: 1, name: 'Alice', age: 20, score: 100 },
          { id: 2, name: 'Bob', age: 30, score: 90 }
        ],
        columns: [
          { title: 'ID', field: 'id', frozen: true },
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age', frozen: true },
          { title: 'Score', field: 'score', frozen: true }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const mod = table.modules.frozenColumns

    mod.leftColumns = ['col1', 'col2']
    mod.rightColumns = ['col3', 'col4']
    mod.initializationMode = 'right'
    mod.active = true
    mod.reset()

    const resetState = {
      leftColumnsLength: mod.leftColumns.length,
      rightColumnsLength: mod.rightColumns.length,
      initializationMode: mod.initializationMode,
      active: mod.active
    }

    const blockedInitially = mod.blocked
    mod.unblockLayout()
    const blockedAfterUnblock = mod.blocked
    mod.blockLayout()
    const blockedAfterBlock = mod.blocked

    const calcSpace1 = mod._calcSpace(
      [
        { visible: true, getWidth: () => 100 },
        { visible: false, getWidth: () => 50 },
        { visible: true, getWidth: () => 150 },
        { visible: true, getWidth: () => 200 }
      ],
      1
    )
    const calcSpace3 = mod._calcSpace(
      [
        { visible: true, getWidth: () => 100 },
        { visible: false, getWidth: () => 50 },
        { visible: true, getWidth: () => 150 },
        { visible: true, getWidth: () => 200 }
      ],
      3
    )
    const calcSpace4 = mod._calcSpace(
      [
        { visible: true, getWidth: () => 100 },
        { visible: false, getWidth: () => 50 },
        { visible: true, getWidth: () => 150 },
        { visible: true, getWidth: () => 200 }
      ],
      4
    )

    const subscribedEvents = []
    const originalSubscribe = mod.subscribe
    mod.subscribe = (eventName) => {
      subscribedEvents.push(eventName)
    }
    mod.initialize()
    mod.subscribe = originalSubscribe

    const tempElement = document.createElement('div')
    const originalRtl = table.rtl
    table.rtl = true
    mod.layoutElement(tempElement, {
      modules: {
        frozen: {
          position: 'left',
          margin: '50px',
          edge: true
        }
      }
    })
    table.rtl = originalRtl

    return {
      resetState,
      blockedInitially,
      blockedAfterUnblock,
      blockedAfterBlock,
      calcSpace1,
      calcSpace3,
      calcSpace4,
      subscribedEvents,
      rtlLayoutRightValue: tempElement.style.right,
      rtlLayoutHasFrozenClass: tempElement.classList.contains('tabulator-frozen'),
      rtlLayoutHasLeftClass: tempElement.classList.contains('tabulator-frozen-left')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.resetState.leftColumnsLength).toBe(0)
  expect(result.resetState.rightColumnsLength).toBe(0)
  expect(result.resetState.initializationMode).toBe('left')
  expect(result.resetState.active).toBe(false)
  expect(typeof result.blockedInitially).toBe('boolean')
  expect(result.blockedAfterUnblock).toBe(false)
  expect(result.blockedAfterBlock).toBe(true)
  expect(result.calcSpace1).toBe(100)
  expect(result.calcSpace3).toBe(250)
  expect(result.calcSpace4).toBe(450)
  expect(result.subscribedEvents).toEqual(
    expect.arrayContaining([
      'cell-layout',
      'column-init',
      'column-width',
      'row-layout-after',
      'table-layout',
      'columns-loading',
      'column-add',
      'column-deleted',
      'column-hide',
      'column-show',
      'columns-loaded',
      'table-redraw',
      'layout-refreshing',
      'layout-refreshed',
      'scrollbar-vertical'
    ])
  )
  expect(result.rtlLayoutRightValue).toBe('50px')
  expect(result.rtlLayoutHasFrozenClass).toBe(true)
  expect(result.rtlLayoutHasLeftClass).toBe(true)
}

test('frozenColumns module', async ({ page }) => {
  await test.step('left frozen columns', async () => {
    await checkLeftFrozenColumns(page)
  })

  await test.step('right frozen columns', async () => {
    await checkRightFrozenColumns(page)
  })

  await test.step('mixed left and right frozen regions', async () => {
    await checkMixedFrozenRegions(page)
  })

  await test.step('grouped parent frozen behavior', async () => {
    await checkGroupedFrozenColumns(page)
  })

  await test.step('warning for invalid grouped child frozen', async () => {
    await checkInvalidFrozenChildWarning(page)
  })

  await test.step('frozen columns module API behaviors', async () => {
    await checkFrozenColumnsModuleApi(page)
  })
})
