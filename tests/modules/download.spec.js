import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('download module', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(fixtureUrl)

  await page.evaluate(() => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'download-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.downloadIntercepted = null

    window.tabulatorInstance = new Tabulator(holder, {
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' }
      ],
      columns: [
        { title: 'ID', field: 'id', download: true, titleDownload: 'Identifier' },
        { title: 'Value', field: 'value' }
      ],
      downloadEncoder: (data, mime) => {
        window.downloadIntercepted = { data, mime }
        return new Blob([data], { type: mime })
      },
      downloadConfig: { delimiter: ',' },
      downloadRowRange: 'all'
    })
  })

  await test.step('download API function is present', async () => {
    const present = await page.evaluate(() => typeof window.tabulatorInstance.download === 'function')
    expect(present).toBe(true)
  })

  await test.step('downloadEncoder option intercepts download', async () => {
    await page.evaluate(() => {
      window.downloadIntercepted = null
      window.tabulatorInstance.download('csv', 'test.csv')
    })
    // Wait for downloadIntercepted to be set
    const intercepted = await page.evaluate(
      () => new Promise((resolve) => setTimeout(() => resolve(window.downloadIntercepted), 200))
    )
    expect(intercepted).toBeTruthy()
    expect(intercepted.mime).toContain('csv')
    expect(intercepted.data).toBeTruthy()
  })

  await test.step('downloadRowRange option respected', async () => {
    const allRows = await page.evaluate(() => {
      window.downloadIntercepted = null
      window.tabulatorInstance.download('csv', 'test.csv')
      return new Promise((resolve) =>
        setTimeout(() => {
          // Should include both rows in CSV
          resolve(window.downloadIntercepted.data)
        }, 200)
      )
    })
    expect(allRows).toContain('A')
    expect(allRows).toContain('B')
  })

  await test.step('downloadToTab API function opens generated blob url', async () => {
    const opened = await page.evaluate(() => {
      let openedUrl = null
      const originalOpen = window.open

      window.open = (url) => {
        openedUrl = String(url)
        return null
      }

      window.tabulatorInstance.downloadToTab('csv', 'test.csv')

      window.open = originalOpen

      return openedUrl
    })

    expect(typeof opened).toBe('string')
    expect(opened.startsWith('blob:')).toBe(true)
  })

  await test.step('download warns on invalid downloader type', async () => {
    const warning = await page.evaluate(() => {
      const module = window.tabulatorInstance.modules.download
      const originalWarn = console.warn
      let warnedWithInvalidType = false

      console.warn = (...args) => {
        warnedWithInvalidType =
          args[0] === 'Download Error - No such download type found: ' && args[1] === 'invalidType'
      }

      module.download('invalidType', 'test.file')
      console.warn = originalWarn

      return warnedWithInvalidType
    })

    expect(warning).toBe(true)
  })

  await test.step('download accepts custom downloader function', async () => {
    const customCall = await page.evaluate(() => {
      const module = window.tabulatorInstance.modules.download
      let called = false
      let firstArgIsArray = false
      let optionsMatch = false
      let thirdArgIsFunction = false

      const customDownloader = (list, options, callback) => {
        called = true
        firstArgIsArray = Array.isArray(list)
        optionsMatch = Boolean(options && options.custom === true)
        thirdArgIsFunction = typeof callback === 'function'
      }

      module.download(customDownloader, 'test.file', { custom: true })

      return {
        called,
        firstArgIsArray,
        optionsMatch,
        thirdArgIsFunction
      }
    })

    expect(customCall.called).toBe(true)
    expect(customCall.firstArgIsArray).toBe(true)
    expect(customCall.optionsMatch).toBe(true)
    expect(customCall.thirdArgIsFunction).toBe(true)
  })

  await test.step('generateExportList applies groupHeaderDownload formatter', async () => {
    const groupHeaderResult = await page.evaluate(() => {
      const module = window.tabulatorInstance.modules.download
      const table = window.tabulatorInstance

      const originalGenerateExportList = table.modules.export.generateExportList
      const originalGroupHeaderDownload = table.options.groupHeaderDownload

      let formatterCalled = false
      table.options.groupHeaderDownload = (value, count, data) => {
        formatterCalled = value === 'Group 1' && count === 5 && data.id === 'group1'
        return 'Custom Group Header'
      }

      table.modules.export.generateExportList = () => [
        {
          type: 'group',
          indent: 0,
          columns: [{ value: 'Group 1' }],
          component: {
            _group: {
              getRowCount: () => 5,
              getData: () => ({ id: 'group1' })
            }
          }
        }
      ]

      const output = module.generateExportList()

      table.modules.export.generateExportList = originalGenerateExportList
      table.options.groupHeaderDownload = originalGroupHeaderDownload

      return {
        formatterCalled,
        headerValue: output[0].columns[0].value
      }
    })

    expect(groupHeaderResult.formatterCalled).toBe(true)
    expect(groupHeaderResult.headerValue).toBe('Custom Group Header')
  })

  await test.step('commsReceived intercept delegates to download with expected args', async () => {
    const commsDelegation = await page.evaluate(() => {
      const module = window.tabulatorInstance.modules.download
      const originalDownload = module.download
      let calledArgs = null

      module.download = (...args) => {
        calledArgs = args
      }

      module.commsReceived(null, 'intercept', {
        type: 'csv',
        options: { delimiter: ',' },
        active: true,
        intercept: true
      })

      module.download = originalDownload

      return calledArgs
    })

    expect(commsDelegation).toEqual(['csv', '', { delimiter: ',' }, true, true])
  })

  await test.step('column download and titleDownload options present', async () => {
    const colOpts = await page.evaluate(() => {
      const col = window.tabulatorInstance.getColumn('id')
      return {
        download: col.getDefinition().download,
        titleDownload: col.getDefinition().titleDownload
      }
    })
    expect(colOpts.download).toBe(true)
    expect(colOpts.titleDownload).toBe('Identifier')
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
