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
        { id: 1, value: 'A', rating: 4, progress: 55, completed: true },
        { id: 2, value: 'B', rating: 2, progress: 20, completed: false }
      ],
      columns: [
        { title: 'ID', field: 'id', clipboard: true, titleClipboard: 'Identifier' },
        { title: 'Value', field: 'value' },
        { title: 'Rating', field: 'rating', formatter: 'star' },
        { title: 'Progress', field: 'progress', formatter: 'progress' },
        { title: 'Completed', field: 'completed', formatter: 'tickCross' }
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

  await test.step('clipboard module is initialized', async () => {
    const moduleState = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      return {
        exists: Boolean(clipboard),
        mode: clipboard ? clipboard.mode : null
      }
    })

    expect(moduleState.exists).toBe(true)
    expect(moduleState.mode).toBe(true)
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
    expect(allRows).toContain('4')
    expect(allRows).toContain('55')
    expect(allRows).toContain('true')
  })

  await test.step('clipboard html export keeps formatter columns as text values', async () => {
    const clipboardContent = await page.evaluate(() => {
      window.tabulatorInstance.modules.clipboard.rowRange = window.tabulatorInstance.options.clipboardCopyRowRange

      return window.tabulatorInstance.modules.clipboard.generateClipboardContent()
    })

    expect(clipboardContent.html).toContain('<td')
    expect(clipboardContent.html).toContain('>4<')
    expect(clipboardContent.html).toContain('>55<')
    expect(clipboardContent.html).toContain('>true<')
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

  await test.step('setPasteParser accepts valid string and function values', async () => {
    const parserResult = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      const originalWarn = console.warn
      let warningCount = 0

      console.warn = () => {
        warningCount += 1
      }

      const customParser = (data) => [{ id: 99, value: data }]

      clipboard.setPasteParser('table')
      const tableType = typeof clipboard.pasteParser

      clipboard.setPasteParser(customParser)
      const functionSet = clipboard.pasteParser === customParser

      console.warn = originalWarn

      return {
        tableType,
        functionSet,
        warningCount
      }
    })

    expect(parserResult.tableType).toBe('function')
    expect(parserResult.functionSet).toBe(true)
    expect(parserResult.warningCount).toBe(0)
  })

  await test.step('setPasteParser warns on invalid parser', async () => {
    const warningCount = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      const originalWarn = console.warn
      let count = 0

      console.warn = () => {
        count += 1
      }

      clipboard.setPasteParser('invalid')
      console.warn = originalWarn

      return count
    })

    expect(warningCount).toBeGreaterThan(0)
  })

  await test.step('setPasteAction accepts valid string and function values', async () => {
    const actionResult = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      const originalWarn = console.warn
      let warningCount = 0

      console.warn = () => {
        warningCount += 1
      }

      const customAction = (rows) => rows

      clipboard.setPasteAction('insert')
      const insertType = typeof clipboard.pasteAction

      clipboard.setPasteAction(customAction)
      const functionSet = clipboard.pasteAction === customAction

      console.warn = originalWarn

      return {
        insertType,
        functionSet,
        warningCount
      }
    })

    expect(actionResult.insertType).toBe('function')
    expect(actionResult.functionSet).toBe(true)
    expect(actionResult.warningCount).toBe(0)
  })

  await test.step('setPasteAction warns on invalid action', async () => {
    const warningCount = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      const originalWarn = console.warn
      let count = 0

      console.warn = () => {
        count += 1
      }

      clipboard.setPasteAction('invalid')
      console.warn = originalWarn

      return count
    })

    expect(warningCount).toBeGreaterThan(0)
  })

  await test.step('generatePlainContent produces expected delimiters and value conversion', async () => {
    const plainContent = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard

      const tabDelimited = clipboard.generatePlainContent([
        { columns: [{ value: 'A1' }, { value: 'B1' }, { value: 'C1' }] },
        { columns: [{ value: 'A2' }, { value: 'B2' }, { value: 'C2' }] }
      ])

      const mixedValues = clipboard.generatePlainContent([
        {
          columns: [
            { value: 'text' },
            { value: 123 },
            { value: null },
            { value: undefined },
            { value: { test: 'object' } }
          ]
        }
      ])

      return {
        tabDelimited,
        mixedValues
      }
    })

    expect(plainContent.tabDelimited).toBe('A1\tB1\tC1\nA2\tB2\tC2')
    expect(plainContent.mixedValues).toBe('text\t123\t\t\t{"test":"object"}')
  })

  await test.step('reset clears custom selection and blocks copy', async () => {
    const resetState = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      clipboard.blocked = false
      clipboard.customSelection = 'test-selection'

      clipboard.reset()

      return {
        blocked: clipboard.blocked,
        customSelection: clipboard.customSelection
      }
    })

    expect(resetState.blocked).toBe(true)
    expect(resetState.customSelection).toBe(false)
  })

  await test.step('mutateData uses mutator transformRow with clipboard context', async () => {
    const mutateResult = await page.evaluate(() => {
      const table = window.tabulatorInstance
      const clipboard = table.modules.clipboard
      const originalMutator = table.modules.mutator
      const calls = []

      table.modules.mutator = {
        transformRow: (row, type) => {
          calls.push({ row, type })
          return { ...row, transformed: true }
        }
      }

      const result = clipboard.mutateData([{ id: 1, value: 'Test' }])
      table.modules.mutator = originalMutator

      return {
        calls,
        transformed: result[0].transformed
      }
    })

    expect(mutateResult.calls).toHaveLength(1)
    expect(mutateResult.calls[0].row).toEqual({ id: 1, value: 'Test' })
    expect(mutateResult.calls[0].type).toBe('clipboard')
    expect(mutateResult.transformed).toBe(true)
  })

  await test.step('checkPasteOrigin validates tag targets and confirm gate', async () => {
    const originResult = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard
      const originalConfirm = clipboard.confirm

      clipboard.confirm = () => false

      const divAllowed = clipboard.checkPasteOrigin({ target: { tagName: 'DIV' } })
      const spanAllowed = clipboard.checkPasteOrigin({ target: { tagName: 'SPAN' } })
      const inputBlocked = clipboard.checkPasteOrigin({ target: { tagName: 'INPUT' } })

      clipboard.confirm = () => true
      const blockedByConfirm = clipboard.checkPasteOrigin({ target: { tagName: 'DIV' } })

      clipboard.confirm = originalConfirm

      return {
        divAllowed,
        spanAllowed,
        inputBlocked,
        blockedByConfirm
      }
    })

    expect(originResult.divAllowed).toBe(true)
    expect(originResult.spanAllowed).toBe(true)
    expect(originResult.inputBlocked).toBe(false)
    expect(originResult.blockedByConfirm).toBe(false)
  })

  await test.step('getPasteData reads text from clipboardData and originalEvent', async () => {
    const pasteData = await page.evaluate(() => {
      const clipboard = window.tabulatorInstance.modules.clipboard

      const direct = clipboard.getPasteData({
        clipboardData: {
          getData: () => 'test data'
        }
      })

      const original = clipboard.getPasteData({
        originalEvent: {
          clipboardData: {
            getData: () => 'original data'
          }
        }
      })

      return {
        direct,
        original
      }
    })

    expect(pasteData.direct).toBe('test data')
    expect(pasteData.original).toBe('original data')
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
