import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('persistence module', async ({ page }) => {
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
    window.localStorage.clear()
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'persistence-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    window.tabulatorInstance = new Tabulator(holder, {
      data: [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' }
      ],
      columns: [
        { title: 'ID', field: 'id', width: 100 },
        { title: 'Value', field: 'value', visible: true }
      ],
      persistence: true,
      persistenceID: 'smoke',
      persistenceMode: 'local',
      persistenceReaderFunc: false,
      persistenceWriterFunc: false
    })
  })

  await test.step('persistence options enable module', async () => {
    const modulePresent = await page.evaluate(() => !!window.tabulatorInstance.modules.persistence)
    expect(modulePresent).toBe(true)
  })

  await test.step('getColumnLayout and setColumnLayout API functions work', async () => {
    const result = await page.evaluate(() => {
      const layout = window.tabulatorInstance.getColumnLayout()
      // Change width and visibility
      layout[0].width = 200
      layout[1].visible = false
      window.tabulatorInstance.setColumnLayout(layout)
      return {
        width: window.tabulatorInstance.getColumn('id').getWidth(),
        visible: window.tabulatorInstance.getColumn('value').isVisible()
      }
    })
    expect(result.width).toBe(200)
    expect(result.visible).toBe(false)
  })

  await test.step('persistence saves to localStorage', async () => {
    const found = await page.evaluate((key) => {
      // Trigger a column move to force save
      const col = window.tabulatorInstance.getColumn('id')
      col.setWidth(150)
      return !!window.localStorage.getItem(key)
    }, 'tabulator-smoke-columns')
    expect(found).toBe(true)
  })

  await test.step('custom persistence reader/writer functions are used', async () => {
    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.id = 'persistence-custom-funcs'
      holder.style.width = '600px'
      root.appendChild(holder)

      const reads = []
      const writes = []

      const reader = (id, type) => {
        reads.push({ id, type })
        return false
      }

      const writer = (id, type, data) => {
        writes.push({ id, type, isArray: Array.isArray(data), hasData: data != null })
      }

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [
            { id: 1, value: 'A' },
            { id: 2, value: 'B' }
          ],
          columns: [
            { title: 'ID', field: 'id', width: 100 },
            { title: 'Value', field: 'value' }
          ],
          persistence: { columns: true, sort: true, filter: true },
          persistenceID: 'custom-funcs',
          persistenceReaderFunc: reader,
          persistenceWriterFunc: writer
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      table.getColumn('id').setWidth(120)

      return {
        mode: table.modules.persistence.mode,
        readFuncMatches: table.modules.persistence.readFunc === reader,
        writeFuncMatches: table.modules.persistence.writeFunc === writer,
        readTypes: reads.map((entry) => entry.type),
        wroteColumns: writes.some((entry) => entry.type === 'columns' && entry.hasData)
      }
    })

    expect(result.mode).toBe('local')
    expect(result.readFuncMatches).toBe(true)
    expect(result.writeFuncMatches).toBe(true)
    expect(result.readTypes).toContain('columns')
    expect(result.wroteColumns).toBe(true)
  })

  await test.step('invalid named reader and writer emit warnings', async () => {
    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.id = 'persistence-invalid-handlers'
      holder.style.width = '600px'
      root.appendChild(holder)

      const warnings = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        warnings.push(args.map((arg) => String(arg)).join(' '))
      }

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, value: 'A' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Value', field: 'value' }
          ],
          persistence: true,
          persistenceID: 'invalid-handlers',
          persistenceReaderFunc: 'notAReader',
          persistenceWriterFunc: 'notAWriter'
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      console.warn = originalWarn

      return {
        hasReadWarning: warnings.some(
          (msg) => msg.includes('Persistence Read Error - invalid handler set') && msg.includes('notAReader')
        ),
        hasWriteWarning: warnings.some(
          (msg) => msg.includes('Persistence Write Error - invalid handler set') && msg.includes('notAWriter')
        )
      }
    })

    expect(result.hasReadWarning).toBe(true)
    expect(result.hasWriteWarning).toBe(true)
  })

  await test.step('persisted page, group, sort, filter, and headerFilter data hydrate options', async () => {
    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.id = 'persistence-hydrate-options'
      holder.style.width = '700px'
      root.appendChild(holder)

      const stored = {
        page: { paginationSize: 7, paginationInitialPage: 2 },
        group: { groupBy: 'value', groupStartOpen: false },
        sort: [{ column: 'id', dir: 'desc' }],
        filter: [{ field: 'id', type: '>', value: 0 }],
        headerFilter: [{ field: 'value', type: 'like', value: 'A' }],
        columns: false
      }

      const reader = (id, type) => stored[type] ?? false

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [
            { id: 1, value: 'A' },
            { id: 2, value: 'B' },
            { id: 3, value: 'A2' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Value', field: 'value' }
          ],
          pagination: true,
          persistence: { page: true, group: true, sort: true, filter: true, headerFilter: true, columns: false },
          persistenceID: 'hydrate-options',
          persistenceReaderFunc: reader
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        paginationSize: table.options.paginationSize,
        paginationInitialPage: table.options.paginationInitialPage,
        groupBy: table.options.groupBy,
        groupStartOpen: table.options.groupStartOpen,
        initialSortNormalized: (table.options.initialSort || []).map((sorter) => ({
          dir: sorter.dir,
          hasColumn: !!sorter.column,
          field: sorter.field || sorter.column?.getField?.() || null
        })),
        initialFilterNormalized: (table.options.initialFilter || []).map((filter) => ({
          field: filter.field,
          type: filter.type,
          value: filter.value
        })),
        initialHeaderFilterNormalized: (table.options.initialHeaderFilter || []).map((filter) => ({
          field: filter.field,
          type: filter.type,
          value: filter.value
        }))
      }
    })

    expect(result.paginationSize).toBe(7)
    expect(result.paginationInitialPage).toBe(2)
    expect(result.groupBy).toBe('value')
    expect(result.groupStartOpen).toBe(false)
    expect(result.initialSortNormalized).toEqual([{ dir: 'desc', hasColumn: true, field: 'id' }])
    expect(result.initialFilterNormalized).toEqual([{ field: 'id', type: '>', value: 0 }])
    expect(result.initialHeaderFilterNormalized).toEqual([{ field: 'value', type: 'like', value: 'A' }])
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
