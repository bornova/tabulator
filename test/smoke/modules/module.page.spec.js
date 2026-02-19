import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { expect, test } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixtureUrl = pathToFileURL(path.resolve(__dirname, '../features.smoke.html')).toString()

test('page module smoke - all page options', async ({ page }) => {
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

    const getDisplayIds = (table) => table.rowManager.getDisplayRows().map((row) => row.getData().id)

    const baseRows = Array.from({ length: 16 }, (_, index) => ({
      id: index + 1,
      name: `Row ${index + 1}`,
      age: index + 20
    }))

    const paginationHost = document.createElement('div')
    paginationHost.id = 'pagination-host'
    root.appendChild(paginationHost)

    const counterHost = document.createElement('div')
    counterHost.id = 'counter-host'
    root.appendChild(counterHost)

    const { table: localTable } = await buildTable('page-local-table', {
      height: 240,
      data: baseRows,
      pagination: true,
      paginationMode: 'local',
      paginationSize: 5,
      paginationInitialPage: 2,
      paginationCounter: 'rows',
      paginationCounterElement: '#counter-host',
      paginationButtonCount: 3,
      paginationSizeSelector: [true, 5, 10],
      paginationAddRow: 'page',
      paginationOutOfRange: false,
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' },
        { title: 'Age', field: 'age' }
      ]
    })

    await new Promise((resolve) => setTimeout(resolve, 40))

    const localModule = localTable.modules.page
    const localResult = {
      modulePresent: !!localModule,
      mode: localModule.getMode(),
      initialPage: localTable.getPage(),
      initialPageMax: localTable.getPageMax(),
      initialPageSize: localTable.getPageSize(),
      pageButtonsCount: document.querySelectorAll('.tabulator-pages .tabulator-page').length,
      hasCounterInCustomElement: !!counterHost.querySelector('.tabulator-page-counter'),
      sizeSelectorValues: Array.from(document.querySelectorAll('select.tabulator-page-size option')).map(
        (el) => el.value
      ),
      sizeSelectorSelected: document.querySelector('select.tabulator-page-size')?.value || null,
      activeIdsPage2: getDisplayIds(localTable)
    }

    await localTable.nextPage()
    localResult.afterNextPage = localTable.getPage()

    await localTable.previousPage()
    localResult.afterPreviousPage = localTable.getPage()

    await localTable.setPage('last')
    localResult.afterSetLast = localTable.getPage()

    await localTable.setPage('first')
    localResult.afterSetFirst = localTable.getPage()

    await localTable.setPage(3)
    localResult.afterSetPageThree = localTable.getPage()

    localTable.setMaxPage(2)
    localResult.afterSetMaxPage = {
      page: localTable.getPage(),
      max: localTable.getPageMax()
    }

    await localTable.setPageSize(10)
    localResult.afterSetPageSize = {
      size: localTable.getPageSize(),
      page: localTable.getPage(),
      max: localTable.getPageMax(),
      selected: document.querySelector('select.tabulator-page-size')?.value || null
    }

    await localTable.setPageToRow(12)
    localResult.afterSetPageToRow = localTable.getPage()

    await localTable.setPage(2)
    await localTable.addRow({ id: 99, name: 'Inserted', age: 99 })
    localResult.afterAddRowWithPageMode = {
      page: localTable.getPage(),
      activeIds: getDisplayIds(localTable)
    }

    localResult.apiPresence = {
      setMaxPage: typeof localTable.setMaxPage === 'function',
      setPage: typeof localTable.setPage === 'function',
      setPageToRow: typeof localTable.setPageToRow === 'function',
      setPageSize: typeof localTable.setPageSize === 'function',
      getPageSize: typeof localTable.getPageSize === 'function',
      previousPage: typeof localTable.previousPage === 'function',
      nextPage: typeof localTable.nextPage === 'function',
      getPage: typeof localTable.getPage === 'function',
      getPageMax: typeof localTable.getPageMax === 'function'
    }

    const { table: paginationElementTable } = await buildTable('page-pagination-element-table', {
      height: 200,
      data: baseRows.slice(0, 10),
      pagination: true,
      paginationMode: 'local',
      paginationSize: 5,
      paginationElement: paginationHost,
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
      ]
    })

    const paginationElementResult = {
      mode: paginationElementTable.modules.page.getMode(),
      hasButtonsInCustomElement: !!paginationHost.querySelector('button[data-page="first"]')
    }

    const { table: remoteTable } = await buildTable('page-remote-table', {
      height: 200,
      data: [{ id: 1, name: 'A' }],
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 5,
      paginationOutOfRange: 'last',
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
      ]
    })

    const remoteModule = remoteTable.modules.page

    remoteModule.page = 5
    remoteModule.max = 5
    remoteModule.trigger = () => Promise.resolve()

    await remoteModule._parseRemoteData({
      last_page: 2,
      last_row: 7,
      data: [{ id: 10, name: 'Remote 10' }]
    })

    const pageAfterOutOfRange = remoteTable.getPage()

    const params = remoteModule.remotePageParams(null, null, false, {})

    const remoteResult = {
      mode: remoteModule.getMode(),
      pageAfterOutOfRange,
      pageAfterRemoteParams: remoteTable.getPage(),
      maxAfterOutOfRange: remoteTable.getPageMax(),
      rowCountEstimate: remoteModule.remoteRowCountEstimate,
      params
    }

    const { table: progressiveTable } = await buildTable('page-progressive-table', {
      height: 200,
      data: [{ id: 1, name: 'Only Row' }],
      pagination: false,
      progressiveLoad: 'scroll',
      progressiveLoadDelay: 25,
      progressiveLoadScrollMargin: 33,
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
      ]
    })

    const progressiveModule = progressiveTable.modules.page
    progressiveModule.scrollVertical(0, false)

    const progressiveResult = {
      mode: progressiveModule.getMode(),
      progressiveLoadEnabled: progressiveModule.progressiveLoad,
      delayOption: progressiveTable.options.progressiveLoadDelay,
      marginOption: progressiveTable.options.progressiveLoadScrollMargin
    }

    return {
      localResult,
      paginationElementResult,
      remoteResult,
      progressiveResult
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.localResult.modulePresent).toBe(true)
  expect(result.localResult.mode).toBe('local')
  expect(result.localResult.initialPage).toBe(2)
  expect(result.localResult.initialPageMax).toBe(4)
  expect(result.localResult.initialPageSize).toBe(5)
  expect(result.localResult.pageButtonsCount).toBeLessThanOrEqual(3)
  expect(result.localResult.hasCounterInCustomElement).toBe(true)
  expect(result.localResult.sizeSelectorValues).toEqual(['true', '5', '10'])
  expect(result.localResult.sizeSelectorSelected).toBe('5')
  expect(result.localResult.activeIdsPage2).toEqual([6, 7, 8, 9, 10])

  expect(result.localResult.afterNextPage).toBe(3)
  expect(result.localResult.afterPreviousPage).toBe(2)
  expect(result.localResult.afterSetLast).toBe(4)
  expect(result.localResult.afterSetFirst).toBe(1)
  expect(result.localResult.afterSetPageThree).toBe(3)
  expect(result.localResult.afterSetMaxPage).toEqual({ page: 2, max: 4 })
  expect(result.localResult.afterSetPageSize).toEqual({ size: 10, page: 1, max: 2, selected: '10' })
  expect(result.localResult.afterSetPageToRow).toBe(2)
  expect(result.localResult.afterAddRowWithPageMode.page).toBe(2)
  expect(result.localResult.afterAddRowWithPageMode.activeIds).toContain(99)

  Object.values(result.localResult.apiPresence).forEach((exists) => {
    expect(exists).toBe(true)
  })

  expect(result.paginationElementResult.mode).toBe('local')
  expect(result.paginationElementResult.hasButtonsInCustomElement).toBe(true)

  expect(result.remoteResult.mode).toBe('remote')
  expect(result.remoteResult.pageAfterOutOfRange).toBe(2)
  expect(result.remoteResult.pageAfterRemoteParams).toBe(1)
  expect(result.remoteResult.maxAfterOutOfRange).toBe(2)
  expect(result.remoteResult.rowCountEstimate).toBe(7)
  expect(result.remoteResult.params).toEqual({ page: 1, size: 5 })

  expect(result.progressiveResult.mode).toBe('progressive_scroll')
  expect(result.progressiveResult.progressiveLoadEnabled).toBe(true)
  expect(result.progressiveResult.delayOption).toBe(25)
  expect(result.progressiveResult.marginOption).toBe(33)
})
