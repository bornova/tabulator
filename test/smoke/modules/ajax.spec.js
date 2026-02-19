import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('ajax module', async ({ page }) => {
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
    holder.id = 'ajax-module-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    const requestLog = {
      generatedUrl: null,
      configMethod: null,
      params: null,
      requestingUrl: null,
      requestingParams: null,
      responseLength: null,
      requestCount: 0
    }

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        ajaxURL: '/mock-api/users',
        ajaxParams() {
          return { token: 'abc123' }
        },
        ajaxConfig: 'post',
        ajaxContentType: 'json',
        ajaxURLGenerator(url, config, params) {
          const query = new URLSearchParams(params).toString()
          return `${url}?${query}`
        },
        ajaxRequesting(url, params) {
          requestLog.requestingUrl = url
          requestLog.requestingParams = { ...params }
          return true
        },
        ajaxResponse(url, params, data) {
          requestLog.responseLength = data.length
          return data.map((row) => ({
            ...row,
            name: `${row.name}-via-response`
          }))
        },
        ajaxRequestFunc(url, config, params) {
          requestLog.generatedUrl = url
          requestLog.configMethod = config.method
          requestLog.params = { ...params }
          requestLog.requestCount += 1

          return Promise.resolve([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
          ])
        },
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

    if (requestLog.requestCount === 0) {
      await table.setData()
    }

    const loadedData = table.getData()

    const blockedHolder = document.createElement('div')
    blockedHolder.id = 'ajax-module-table-blocked'
    blockedHolder.style.width = '600px'
    root.appendChild(blockedHolder)

    const blockedTable = await new Promise((resolve) => {
      const instance = new Tabulator(blockedHolder, {
        ajaxRequesting() {
          return false
        },
        ajaxRequestFunc() {
          return Promise.resolve([{ id: 99, name: 'never-used' }])
        },
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

    let blockedRejected = false
    await blockedTable.modules.ajax.sendRequest('/blocked', {}, {}).catch(() => {
      blockedRejected = true
    })

    return {
      modulePresent: !!table.modules.ajax,
      getAjaxUrl: table.getAjaxUrl(),
      requestLog,
      loadedData,
      blockedRejected
    }
  })

  expect(result.modulePresent).toBe(true)
  expect(result.getAjaxUrl).toBe('/mock-api/users')
  expect(result.requestLog.generatedUrl).toBe('/mock-api/users')
  expect(result.requestLog.configMethod).toBe('post')
  expect(result.requestLog.params).toEqual({ token: 'abc123' })
  expect(result.requestLog.requestingUrl).toBe('/mock-api/users')
  expect(result.requestLog.requestingParams).toEqual({ token: 'abc123' })
  expect(result.requestLog.responseLength).toBe(2)
  expect(result.requestLog.requestCount).toBe(1)
  expect(result.loadedData).toEqual([
    { id: 1, name: 'Alice-via-response' },
    { id: 2, name: 'Bob-via-response' }
  ])
  expect(result.blockedRejected).toBe(true)
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
