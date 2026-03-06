import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('moveColumn module', async ({ page }) => {
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

  await test.step('moveColumn internal APIs handle abort, guarded start, move positioning, and finalize reset', async () => {
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

      const mod = table.modules.moveColumn

      let abortClearedTimeout = false
      const originalClearTimeout = window.clearTimeout
      window.clearTimeout = (id) => {
        if (id === 12345) {
          abortClearedTimeout = true
        }
        return originalClearTimeout(id)
      }
      mod.checkTimeout = 12345
      mod.abortMove()
      window.clearTimeout = originalClearTimeout

      table.modules.selectRange = {
        columnSelection: true,
        mousedown: true,
        selecting: 'column'
      }

      const guardParent = document.createElement('div')
      const guardElement = document.createElement('div')
      guardParent.appendChild(guardElement)
      holder.appendChild(guardParent)

      const guardColumn = {
        parent: 'row',
        getElement: () => guardElement,
        getWidth: () => 100,
        getHeight: () => 30,
        getCells: () => []
      }

      mod.touchMove = false
      mod.startMove({ pageX: 100, button: 0 }, guardColumn)

      const startGuardPreventedMove = mod.moving === false && !mod.hoverElement

      table.modules.selectRange = null

      const rowA = document.createElement('div')
      const rowB = document.createElement('div')
      const targetCellEl1 = document.createElement('div')
      const targetCellEl2 = document.createElement('div')
      rowA.appendChild(targetCellEl1)
      rowB.appendChild(targetCellEl2)

      const sourceCellEl1 = document.createElement('div')
      const sourceCellEl2 = document.createElement('div')

      const movingCells = [{ getElement: () => sourceCellEl1 }, { getElement: () => sourceCellEl2 }]
      const targetCells = [{ getElement: () => targetCellEl1 }, { getElement: () => targetCellEl2 }]

      mod.moving = {
        getCells: () => movingCells
      }

      const targetColumn = {
        getCells: () => targetCells
      }

      mod.moveColumn(targetColumn, true)
      const moveAfterState = {
        toColMatches: mod.toCol === targetColumn,
        toColAfter: mod.toColAfter,
        rowAOrder: Array.from(rowA.children).map((el) => (el === targetCellEl1 ? 'target' : 'source')),
        rowBOrder: Array.from(rowB.children).map((el) => (el === targetCellEl2 ? 'target' : 'source'))
      }

      rowA.innerHTML = ''
      rowB.innerHTML = ''
      rowA.appendChild(targetCellEl1)
      rowB.appendChild(targetCellEl2)

      mod.moveColumn(targetColumn, false)
      const moveBeforeState = {
        toColAfter: mod.toColAfter,
        rowAOrder: Array.from(rowA.children).map((el) => (el === targetCellEl1 ? 'target' : 'source')),
        rowBOrder: Array.from(rowB.children).map((el) => (el === targetCellEl2 ? 'target' : 'source'))
      }

      const dragParent = document.createElement('div')
      const movingElement = document.createElement('div')
      dragParent.appendChild(movingElement)
      holder.appendChild(dragParent)

      const placeholder = document.createElement('div')
      dragParent.appendChild(placeholder)
      const hover = document.createElement('div')
      holder.appendChild(hover)

      const moveActualCalls = []
      const originalMoveColumnActual = table.columnManager.moveColumnActual
      table.columnManager.moveColumnActual = (...args) => {
        moveActualCalls.push(args)
      }

      mod.moving = {
        getElement: () => movingElement
      }
      mod.placeholderElement = placeholder
      mod.hoverElement = hover
      mod.toCol = targetColumn
      mod.toColAfter = true
      mod.touchMove = false

      mod.endMove({ button: 0 })

      table.columnManager.moveColumnActual = originalMoveColumnActual

      return {
        abortClearedTimeout,
        startGuardPreventedMove,
        moveAfterState,
        moveBeforeState,
        endMoveState: {
          moveActualCalled: moveActualCalls.length === 1,
          movingReset: mod.moving === false,
          toColReset: mod.toCol === false,
          toColAfterReset: mod.toColAfter === false,
          placeholderRemoved: !placeholder.parentNode,
          hoverRemoved: !hover.parentNode,
          blockSelectClassRemoved: !table.element.classList.contains('tabulator-block-select')
        }
      }
    })

    expect(result.abortClearedTimeout).toBe(true)
    expect(result.startGuardPreventedMove).toBe(true)
    expect(result.moveAfterState.toColMatches).toBe(true)
    expect(result.moveAfterState.toColAfter).toBe(true)
    expect(result.moveAfterState.rowAOrder).toEqual(['target', 'source'])
    expect(result.moveAfterState.rowBOrder).toEqual(['target', 'source'])
    expect(result.moveBeforeState.toColAfter).toBe(false)
    expect(result.moveBeforeState.rowAOrder).toEqual(['source', 'target'])
    expect(result.moveBeforeState.rowBOrder).toEqual(['source', 'target'])
    expect(result.endMoveState.moveActualCalled).toBe(true)
    expect(result.endMoveState.movingReset).toBe(true)
    expect(result.endMoveState.toColReset).toBe(true)
    expect(result.endMoveState.toColAfterReset).toBe(true)
    expect(result.endMoveState.placeholderRemoved).toBe(true)
    expect(result.endMoveState.hoverRemoved).toBe(true)
    expect(result.endMoveState.blockSelectClassRemoved).toBe(true)
  })

  await test.step('moveColumn binds and unbinds mousemove handlers and auto-scrolls near edges', async () => {
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

      const mod = table.modules.moveColumn
      const columns = table.columnManager.columnsByIndex

      const addCounts = []
      const removeCounts = []

      columns.forEach((column, index) => {
        const colEl = column.getElement()
        const originalAdd = colEl.addEventListener
        const originalRemove = colEl.removeEventListener
        addCounts[index] = 0
        removeCounts[index] = 0

        colEl.addEventListener = function (type, handler, options) {
          if (type === 'mousemove' && handler === column.modules.moveColumn?.mousemove) {
            addCounts[index] += 1
          }
          return originalAdd.call(this, type, handler, options)
        }

        colEl.removeEventListener = function (type, handler, options) {
          if (type === 'mousemove' && handler === column.modules.moveColumn?.mousemove) {
            removeCounts[index] += 1
          }
          return originalRemove.call(this, type, handler, options)
        }
      })

      mod._bindMouseMove()
      mod._unbindMouseMove()

      mod.hoverElement = { style: {} }
      mod.startX = 20
      mod.touchMove = false

      const rowHolder = table.rowManager.getElement()
      rowHolder.scrollLeft = 0

      mod.moveHover({ pageX: 70 })
      await new Promise((resolve) => setTimeout(resolve, 10))
      const leftScroll = rowHolder.scrollLeft
      const hoverLeftAfterLeftEdge = mod.hoverElement.style.left

      rowHolder.scrollLeft = 0
      let rightAutoScrollScheduled = false
      const originalSetTimeout = window.setTimeout
      window.setTimeout = (handler, timeout, ...args) => {
        if (timeout === 1) {
          rightAutoScrollScheduled = true
        }
        return originalSetTimeout(handler, timeout, ...args)
      }
      mod.moveHover({ pageX: 950 })
      await new Promise((resolve) => setTimeout(resolve, 10))
      window.setTimeout = originalSetTimeout

      return {
        bindCounts: addCounts,
        unbindCounts: removeCounts,
        hoverLeftAfterLeftEdge,
        leftScroll,
        rightAutoScrollScheduled
      }
    })

    expect(result.bindCounts.every((count) => count >= 1)).toBe(true)
    expect(result.unbindCounts.every((count) => count >= 1)).toBe(true)
    expect(result.hoverLeftAfterLeftEdge.endsWith('px')).toBe(true)
    expect(result.leftScroll).toBe(0)
    expect(result.rightAutoScrollScheduled).toBe(true)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
