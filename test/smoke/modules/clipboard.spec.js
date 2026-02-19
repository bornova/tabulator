import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('clipboard module', async ({ page }) => {
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
    holder.id = 'clipboard-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.clipboardIntercepted = null

    window.tabulatorInstance = new Tabulator(holder, {
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' }
      ],
      columns: [
        { title: 'ID', field: 'id', clipboard: true, titleClipboard: 'Identifier' },
        { title: 'Value', field: 'value' }
      ],
      clipboard: true,
      clipboardCopyStyled: false,
      clipboardCopyConfig: { delimiter: ',' },
      clipboardCopyRowRange: 'all',
      clipboardCopyFormatter: (type, content) => {
        window.clipboardIntercepted = { type, content }
        return content
      }
    })
  })

  await test.step('copyToClipboard API function is present', async () => {
    const present = await page.evaluate(() => typeof window.tabulatorInstance.copyToClipboard === 'function')
    expect(present).toBe(true)
  })

  await test.step('clipboardCopyFormatter intercepts clipboard output', async () => {
    await page.evaluate(() => {
      window.clipboardIntercepted = null
      window.tabulatorInstance.copyToClipboard()
    })
    // Wait for clipboardIntercepted to be set
    const intercepted = await page.evaluate(
      () => new Promise((resolve) => setTimeout(() => resolve(window.clipboardIntercepted), 200))
    )
    expect(intercepted).toBeTruthy()
    expect(['plain', 'html']).toContain(intercepted.type)
    expect(intercepted.content).toContain('A')
    expect(intercepted.content).toContain('B')
  })

  await test.step('clipboardCopyRowRange option respected', async () => {
    const allRows = await page.evaluate(() => {
      window.clipboardIntercepted = null
      window.tabulatorInstance.copyToClipboard()
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve(window.clipboardIntercepted.content)
        }, 200)
      )
    })
    expect(allRows).toContain('A')
    expect(allRows).toContain('B')
  })

  await test.step('column clipboard and titleClipboard options present', async () => {
    const colOpts = await page.evaluate(() => {
      const col = window.tabulatorInstance.getColumn('id')
      return {
        clipboard: col.getDefinition().clipboard,
        titleClipboard: col.getDefinition().titleClipboard
      }
    })
    expect(colOpts.clipboard).toBe(true)
    expect(colOpts.titleClipboard).toBe('Identifier')
  })

  await test.step('clipboard paste parser/action options initialize handlers', async () => {
    const pasteOpts = await page.evaluate(() => {
      return {
        parserOption: window.tabulatorInstance.options.clipboardPasteParser,
        actionOption: window.tabulatorInstance.options.clipboardPasteAction,
        parserType: typeof window.tabulatorInstance.modules.clipboard.pasteParser,
        actionType: typeof window.tabulatorInstance.modules.clipboard.pasteAction
      }
    })

    expect(pasteOpts.parserOption).toBe('table')
    expect(pasteOpts.actionOption).toBe('insert')
    expect(pasteOpts.parserType).toBe('function')
    expect(pasteOpts.actionType).toBe('function')
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
