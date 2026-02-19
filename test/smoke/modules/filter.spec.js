import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('filter module', async ({ page }) => {
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
      holder.style.width = '1200px'
      root.appendChild(holder)

      return new Promise((resolve) => {
        const table = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve({ table, holder }), 1500)

        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve({ table, holder })
        })
      })
    }

    const normalizeIds = (table) => table.getData('active').map((row) => row.id)

    const operatorData = [
      { id: 1, num: 10, text: 'Alpha Beta', colorTags: 'red|blue', boolVal: true },
      { id: 2, num: 5, text: 'Beta', colorTags: 'red|green', boolVal: false },
      { id: 3, num: 20, text: 'Gamma', colorTags: 'yellow|blue', boolVal: true },
      { id: 4, num: 10, text: null, colorTags: null, boolVal: false }
    ]

    const { table: operatorTable } = await buildTable('filter-operators-table', {
      height: 220,
      data: operatorData,
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Number', field: 'num' },
        { title: 'Text', field: 'text' },
        { title: 'Tags', field: 'colorTags' },
        { title: 'Boolean', field: 'boolVal' }
      ]
    })

    const operatorResults = {}

    const runOperator = (name, field, type, value, params) => {
      operatorTable.setFilter(field, type, value, params)
      operatorResults[name] = normalizeIds(operatorTable)
      operatorTable.clearFilter()
    }

    runOperator('eq', 'num', '=', 10)
    runOperator('lt', 'num', '<', 10)
    runOperator('lte', 'num', '<=', 10)
    runOperator('gt', 'num', '>', 10)
    runOperator('gte', 'num', '>=', 10)
    runOperator('neq', 'num', '!=', 10)
    runOperator('regex', 'text', 'regex', '^Al')
    runOperator('like', 'text', 'like', 'beta')
    runOperator('keywordsAny', 'colorTags', 'keywords', 'red blue', { separator: ' ', matchAll: false })
    runOperator('keywordsAll', 'colorTags', 'keywords', 'red|blue', { separator: '|', matchAll: true })
    runOperator('starts', 'text', 'starts', 'al')
    runOperator('ends', 'text', 'ends', 'ma')
    runOperator('in', 'num', 'in', [5, 20])

    const remoteData = [
      { id: 11, value: 1 },
      { id: 12, value: 2 },
      { id: 13, value: 3 }
    ]

    const { table: remoteTable } = await buildTable('filter-remote-table', {
      height: 180,
      filterMode: 'remote',
      data: remoteData,
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Value', field: 'value' }
      ]
    })

    remoteTable.modules.filter.setFilter('value', '>', 1)

    const remoteResult = {
      activeIds: normalizeIds(remoteTable),
      registeredFilters: remoteTable.getFilters()
    }

    const filterOptionsData = [
      { id: 101, name: 'anna', status: 'ALL', tags: 'red|blue', code: 'AA-1', prefix: 'AA' },
      { id: 102, name: 'brad', status: 'active', tags: 'red|green', code: 'BB-2', prefix: 'BB' },
      { id: 103, name: 'annette', status: 'inactive', tags: 'yellow|blue', code: 'AA-3', prefix: 'AA' },
      { id: 104, name: 'carol', status: 'active', tags: 'red|blue', code: 'CC-4', prefix: 'CC' }
    ]

    const { table: optionTable, holder: optionHolder } = await buildTable('filter-options-table', {
      height: 240,
      filterMode: 'local',
      initialFilter: [{ field: 'id', type: '>=', value: 102 }],
      initialHeaderFilter: [{ field: 'name', value: 'ann' }],
      headerFilterLiveFilterDelay: 50,
      placeholderHeaderFilter: 'Header filter placeholder',
      data: filterOptionsData,
      columns: [
        {
          title: 'Name',
          field: 'name',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Name filter',
          headerFilterParams: {
            elementAttributes: {
              'data-filter-param': 'name-filter'
            }
          },
          headerFilterLiveFilter: false
        },
        {
          title: 'Status',
          field: 'status',
          editor: 'input',
          headerFilter: true,
          headerFilterEmptyCheck: (value) => value === '' || value === 'ALL'
        },
        {
          title: 'Tags',
          field: 'tags',
          headerFilter: 'input',
          headerFilterFunc: 'keywords',
          headerFilterFuncParams: {
            separator: '|',
            matchAll: true
          }
        },
        {
          title: 'Code',
          field: 'code',
          headerFilter: 'input',
          headerFilterFunc: (headerValue, rowValue, rowData, params) => {
            return String(rowValue).startsWith(`${params.prefix}-`) && String(rowValue).includes(headerValue)
          },
          headerFilterFuncParams: (_headerValue, _rowValue, rowData) => {
            return { prefix: rowData.prefix }
          }
        },
        { title: 'ID', field: 'id' }
      ]
    })

    const initialActiveIds = normalizeIds(optionTable)

    const nameHeaderInput = optionHolder.querySelector('input[placeholder="Name filter"]')
    const statusHeaderInput = optionHolder.querySelector('.tabulator-col[data-field="status"] input')

    if (nameHeaderInput) {
      nameHeaderInput.value = 'carol'
      nameHeaderInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
    }

    await new Promise((resolve) => setTimeout(resolve, 80))

    const liveFilterFalseIds = normalizeIds(optionTable)

    optionTable.setHeaderFilterValue('name', 'carol')
    const afterSetHeaderNameIds = normalizeIds(optionTable)

    const headerFilterValueName = optionTable.getHeaderFilterValue('name')
    optionTable.setHeaderFilterFocus('name')

    const activeElementMatchesName = !!nameHeaderInput && document.activeElement === nameHeaderInput

    optionTable.setHeaderFilterValue('status', 'ALL')
    const afterStatusAllIds = normalizeIds(optionTable)

    optionTable.setHeaderFilterValue('tags', 'red|blue')
    const afterTagsIds = normalizeIds(optionTable)

    optionTable.setHeaderFilterValue('code', '3')
    const afterCodeIds = normalizeIds(optionTable)

    const allFilters = optionTable.getFilters(true)
    const ajaxAllFilters = optionTable.getFilters(true, true)
    const headerFilters = optionTable.getHeaderFilters()
    const ajaxHasFunctionType = ajaxAllFilters.some((item) => item.type === 'function')

    const placeholderValue = optionTable.modules.filter.generatePlaceholder('default-placeholder')

    const searchRowsResultIds = optionTable.searchRows('id', '>=', 103).map((row) => row.getData().id)
    const searchDataResultIds = optionTable.searchData('id', '<', 104).map((row) => row.id)

    optionTable.clearHeaderFilter()
    const afterClearHeaderIds = normalizeIds(optionTable)

    optionTable.addFilter('id', '!=', 103)
    optionTable.refreshFilter()
    const afterAddFilterIds = normalizeIds(optionTable)

    optionTable.removeFilter('id', '!=', 103)
    optionTable.refreshFilter()
    const afterRemoveFilterIds = normalizeIds(optionTable)

    optionTable.clearFilter(true)
    const afterClearAllIds = normalizeIds(optionTable)

    return {
      modulePresent: !!optionTable.modules.filter,
      operatorResults,
      remoteResult,
      optionResults: {
        initialActiveIds,
        nameHeaderExists: !!nameHeaderInput,
        nameHeaderType: nameHeaderInput ? nameHeaderInput.getAttribute('type') : null,
        nameHeaderParamAttr: nameHeaderInput ? nameHeaderInput.getAttribute('data-filter-param') : null,
        statusHeaderExists: !!statusHeaderInput,
        headerFilterValueName,
        activeElementMatchesName,
        liveFilterFalseIds,
        afterSetHeaderNameIds,
        afterStatusAllIds,
        afterTagsIds,
        afterCodeIds,
        allFiltersLength: allFilters.length,
        headerFiltersLength: headerFilters.length,
        ajaxHasFunctionType,
        placeholderValue,
        searchRowsResultIds,
        searchDataResultIds,
        afterClearHeaderIds,
        afterAddFilterIds,
        afterRemoveFilterIds,
        afterClearAllIds
      }
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.modulePresent).toBe(true)

  expect(result.operatorResults.eq).toEqual([1, 4])
  expect(result.operatorResults.lt).toEqual([2])
  expect(result.operatorResults.lte).toEqual([1, 2, 4])
  expect(result.operatorResults.gt).toEqual([3])
  expect(result.operatorResults.gte).toEqual([1, 3, 4])
  expect(result.operatorResults.neq).toEqual([2, 3])
  expect(result.operatorResults.regex).toEqual([1])
  expect(result.operatorResults.like).toEqual([1, 2])
  expect(result.operatorResults.keywordsAny).toEqual([1, 2, 3])
  expect(result.operatorResults.keywordsAll).toEqual([1])
  expect(result.operatorResults.starts).toEqual([1])
  expect(result.operatorResults.ends).toEqual([3])
  expect(result.operatorResults.in).toEqual([2, 3])

  expect(result.remoteResult.activeIds).toEqual([11, 12, 13])
  expect(result.remoteResult.registeredFilters).toEqual([{ field: 'value', type: '>', value: 1 }])

  expect(result.optionResults.initialActiveIds).toEqual([103])
  expect(result.optionResults.nameHeaderExists).toBe(true)
  expect(result.optionResults.nameHeaderType).toBe('text')
  expect(result.optionResults.nameHeaderParamAttr).toBe('name-filter')
  expect(result.optionResults.liveFilterFalseIds).toEqual([103])
  expect(result.optionResults.afterSetHeaderNameIds).toEqual([104])
  expect(result.optionResults.headerFilterValueName).toBe('carol')

  expect(result.optionResults.afterStatusAllIds).toEqual([104])
  expect(result.optionResults.afterTagsIds).toEqual([104])
  expect(result.optionResults.afterCodeIds).toEqual([])
  expect(result.optionResults.allFiltersLength).toBeGreaterThan(0)
  expect(result.optionResults.headerFiltersLength).toBeGreaterThan(0)
  expect(result.optionResults.ajaxHasFunctionType).toBe(true)

  expect(result.optionResults.placeholderValue).toBe('Header filter placeholder')
  expect(result.optionResults.searchRowsResultIds).toEqual([103, 104])
  expect(result.optionResults.searchDataResultIds).toEqual([101, 102, 103])

  expect(result.optionResults.afterClearHeaderIds).toEqual([102, 103, 104])
  expect(result.optionResults.afterAddFilterIds).toEqual([102, 104])
  expect(result.optionResults.afterRemoveFilterIds).toEqual([102, 103, 104])
  expect(result.optionResults.afterClearAllIds).toEqual([101, 102, 103, 104])
})
