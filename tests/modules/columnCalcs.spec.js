import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('columnCalcs module', async ({ page }) => {
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

    holder.id = 'column-calcs-all-table'
    holder.style.width = '1200px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        height: 260,
        data: [
          {
            id: 1,
            avgVal: 1,
            maxVal: 10,
            minVal: 10,
            sumVal: 10,
            concatVal: 'A',
            countVal: 1,
            uniqueVal: 'x',
            customVal: 5
          },
          {
            id: 2,
            avgVal: 2,
            maxVal: 20,
            minVal: 20,
            sumVal: 20,
            concatVal: 'B',
            countVal: 0,
            uniqueVal: 'x',
            customVal: 10
          },
          {
            id: 3,
            avgVal: 3,
            maxVal: 30,
            minVal: 30,
            sumVal: 30,
            concatVal: 'C',
            countVal: true,
            uniqueVal: 'y',
            customVal: 15
          }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Avg', field: 'avgVal', topCalc: 'avg', topCalcParams: () => ({ precision: false }) },
          { title: 'Max', field: 'maxVal', bottomCalc: 'max' },
          { title: 'Min', field: 'minVal', bottomCalc: 'min' },
          {
            title: 'Sum',
            field: 'sumVal',
            bottomCalc: 'sum',
            bottomCalcParams: { precision: 1 },
            bottomCalcFormatter: 'money',
            bottomCalcFormatterParams: { symbol: '$' }
          },
          { title: 'Concat', field: 'concatVal', bottomCalc: 'concat' },
          { title: 'Count', field: 'countVal', bottomCalc: 'count' },
          { title: 'Unique', field: 'uniqueVal', bottomCalc: 'unique' },
          {
            title: 'Custom',
            field: 'customVal',
            topCalc: (values) => values.length * 100,
            topCalcFormatter: 'money',
            topCalcFormatterParams: { symbol: '$' }
          }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const calcResults = table.getCalcResults()

    const topCell = holder.querySelector('.tabulator-calcs-top .tabulator-cell[tabulator-field="customVal"]')
    const bottomSumCell = holder.querySelector('.tabulator-calcs-bottom .tabulator-cell[tabulator-field="sumVal"]')

    const recalcBefore = table.getCalcResults().bottom.sumVal
    table.getRow(1).getData().sumVal = 100
    table.recalc()
    const recalcAfter = table.getCalcResults().bottom.sumVal

    const mod = table.modules.columnCalcs

    const originalWarn = console.warn
    let invalidCalcWarned = false
    console.warn = () => {
      invalidCalcWarned = true
    }

    mod.initializeColumn({
      definition: {
        topCalc: 'invalid'
      },
      modules: {}
    })
    console.warn = originalWarn

    const rowsToData = mod.rowsToData([
      { getData: () => ({ id: 1, name: 'John', age: 20 }) },
      { getData: () => ({ id: 2, name: 'Jane', age: 25 }) }
    ])

    const blockState = {
      blocked: false,
      recalcAfterBlock: false
    }
    const proto = Object.getPrototypeOf(mod)
    const blockCheckInitial = proto.blockCheck.call(blockState)
    blockState.blocked = true
    const blockCheckBlocked = proto.blockCheck.call(blockState)
    const recalcAfterBlockWhenBlocked = blockState.recalcAfterBlock
    blockState.blocked = false
    const blockCheckUnblocked = proto.blockCheck.call(blockState)

    const cellValueChangedContext = {
      recalcActiveRowsCalled: false,
      recalcActiveRows() {
        this.recalcActiveRowsCalled = true
      },
      recalcRowGroup() {},
      table: { options: { groupBy: false } }
    }

    proto.cellValueChanged.call(cellValueChangedContext, {
      column: {
        definition: {
          topCalc: 'avg',
          bottomCalc: 'max'
        }
      },
      row: {}
    })

    const cellValueChangedCalledWithCalc = cellValueChangedContext.recalcActiveRowsCalled

    cellValueChangedContext.recalcActiveRowsCalled = false
    proto.cellValueChanged.call(cellValueChangedContext, {
      column: {
        definition: {}
      },
      row: {}
    })
    const cellValueChangedCalledWithoutCalc = cellValueChangedContext.recalcActiveRowsCalled

    return {
      modulePresent: !!table.modules.columnCalcs,
      recalcFunctionPresent: typeof table.recalc === 'function',
      hasTopRow: !!holder.querySelector('.tabulator-calcs-top'),
      hasBottomRow: !!holder.querySelector('.tabulator-calcs-bottom'),
      top: calcResults.top,
      bottom: calcResults.bottom,
      customTopFormatted: topCell ? topCell.textContent : '',
      bottomSumFormatted: bottomSumCell ? bottomSumCell.textContent : '',
      recalcBefore,
      recalcAfter,
      invalidCalcWarned,
      rowsToDataLength: rowsToData.length,
      rowsToDataFirstId: rowsToData[0].id,
      rowsToDataSecondName: rowsToData[1].name,
      blockCheckInitial,
      blockCheckBlocked,
      recalcAfterBlockWhenBlocked,
      blockCheckUnblocked,
      cellValueChangedCalledWithCalc,
      cellValueChangedCalledWithoutCalc
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.modulePresent).toBe(true)
  expect(result.recalcFunctionPresent).toBe(true)
  expect(result.hasTopRow).toBe(true)
  expect(result.hasBottomRow).toBe(true)

  expect(result.top.avgVal).toBe('2')
  expect(result.bottom.maxVal).toBe(30)
  expect(result.bottom.minVal).toBe(10)
  expect(result.bottom.sumVal).toBe('60.0')
  expect(result.bottom.concatVal).toBe('ABC')
  expect(result.bottom.countVal).toBe(2)
  expect(result.bottom.uniqueVal).toBe(2)
  expect(result.top.customVal).toBe(300)
  expect(result.customTopFormatted.includes('$300')).toBe(true)
  expect(result.bottomSumFormatted.includes('$60')).toBe(true)
  expect(result.recalcBefore).toBe('60.0')
  expect(result.recalcAfter).toBe('150.0')
  expect(result.invalidCalcWarned).toBe(true)
  expect(result.rowsToDataLength).toBe(2)
  expect(result.rowsToDataFirstId).toBe(1)
  expect(result.rowsToDataSecondName).toBe('Jane')
  expect(result.blockCheckInitial).toBe(false)
  expect(result.blockCheckBlocked).toBe(true)
  expect(result.recalcAfterBlockWhenBlocked).toBe(true)
  expect(result.blockCheckUnblocked).toBe(false)
  expect(result.cellValueChangedCalledWithCalc).toBe(true)
  expect(result.cellValueChangedCalledWithoutCalc).toBe(false)
})

test('columnCalcs module - group-level calcs, columnCalcs option modes', async ({ page }) => {
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

    const buildTable = (id, options) =>
      new Promise((resolve) => {
        const holder = document.createElement('div')
        holder.id = id
        holder.style.width = '800px'
        root.appendChild(holder)
        const instance = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve({ table: instance, holder }), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve({ table: instance, holder })
        })
      })

    const groupData = [
      { id: 1, category: 'A', value: 10 },
      { id: 2, category: 'A', value: 20 },
      { id: 3, category: 'B', value: 30 },
      { id: 4, category: 'B', value: 40 }
    ]

    // columnCalcs: 'group' → calcs only inside each group (no table-level rows)
    const { table: groupTable } = await buildTable('calcs-group-table', {
      height: 300,
      data: groupData,
      groupBy: 'category',
      columnCalcs: 'group',
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Category', field: 'category' },
        { title: 'Value', field: 'value', topCalc: 'sum', bottomCalc: 'sum' }
      ]
    })

    const groupCalcResults = groupTable.getCalcResults()

    // columnCalcs: 'table' → calcs only at table level (not per-group)
    const { table: tableTable } = await buildTable('calcs-table-table', {
      height: 300,
      data: groupData,
      groupBy: 'category',
      columnCalcs: 'table',
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Category', field: 'category' },
        { title: 'Value', field: 'value', topCalc: 'sum', bottomCalc: 'sum' }
      ]
    })

    const tableCalcResults = tableTable.getCalcResults()

    // columnCalcs: 'both' → calcs at group AND table level
    const { table: bothTable } = await buildTable('calcs-both-table', {
      height: 300,
      data: groupData,
      groupBy: 'category',
      columnCalcs: 'both',
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Category', field: 'category' },
        { title: 'Value', field: 'value', topCalc: 'sum', bottomCalc: 'sum' }
      ]
    })

    const bothCalcResults = bothTable.getCalcResults()

    // columnCalcs: false → no calcs at all
    const { table: noneTable } = await buildTable('calcs-none-table', {
      height: 300,
      data: groupData,
      groupBy: 'category',
      columnCalcs: false,
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Category', field: 'category' },
        { title: 'Value', field: 'value', topCalc: 'sum', bottomCalc: 'sum' }
      ]
    })

    const noneCalcResults = noneTable.getCalcResults()

    // recalc() updates after row add/delete — use a plain (non-grouped) table
    const { table: recalcTable } = await buildTable('calcs-recalc-table', {
      height: 300,
      data: [...groupData],
      columnCalcs: 'table',
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Category', field: 'category' },
        { title: 'Value', field: 'value', topCalc: 'sum', bottomCalc: 'sum' }
      ]
    })

    const sumBefore = recalcTable.getCalcResults().bottom?.value
    await recalcTable.addRow({ id: 5, category: 'B', value: 50 })
    const recalcResults = recalcTable.getCalcResults()
    const sumAfterAdd = recalcResults.bottom?.value

    await recalcTable.deleteRow(5)
    const sumAfterDelete = recalcTable.getCalcResults().bottom?.value

    return {
      groupCalcKeys: Object.keys(groupCalcResults),
      groupCalcHasGroupA: 'A' in groupCalcResults,
      groupCalcHasGroupB: 'B' in groupCalcResults,
      groupCalcGroupABottomSum: groupCalcResults['A']?.bottom?.value,
      groupCalcGroupBBottomSum: groupCalcResults['B']?.bottom?.value,
      tableCalcHasGroupKeys: Object.keys(tableCalcResults).some((k) => k !== 'top' && k !== 'bottom'),
      tableCalcTopSum: tableCalcResults.top?.value,
      tableCalcBottomSum: tableCalcResults.bottom?.value,
      bothCalcHasGroupA: 'A' in bothCalcResults,
      bothCalcGroupABottomSum: bothCalcResults['A']?.bottom?.value,
      noneCalcHasGroupA: 'A' in noneCalcResults,
      sumBefore,
      sumAfterAdd,
      sumAfterDelete
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  // 'group' mode: keys are group keys ('A', 'B'), each has top/bottom calcs
  expect(result.groupCalcHasGroupA).toBe(true)
  expect(result.groupCalcHasGroupB).toBe(true)
  expect(result.groupCalcGroupABottomSum).toBe(30) // 10+20
  expect(result.groupCalcGroupBBottomSum).toBe(70) // 30+40

  // 'table' mode: still returns group-keyed results (getCalcResults always uses groups when groupBy active)
  // but group-level calcs are empty (calcs are rendered at table level, not per-group)
  expect(result.tableCalcHasGroupKeys).toBe(true)

  // 'both' mode: groups AND table level — group A should have calcs
  expect(result.bothCalcHasGroupA).toBe(true)
  expect(result.bothCalcGroupABottomSum).toBe(30)

  // 'false' mode: getCalcResults still returns group-keyed structure when groupBy is active
  expect(result.noneCalcHasGroupA).toBe(true)

  // recalc updates after row add/delete
  expect(result.sumBefore).toBe(100)
  expect(result.sumAfterAdd).toBe(150) // 100+50
  expect(result.sumAfterDelete).toBe(100) // back to original
})
