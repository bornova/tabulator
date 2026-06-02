import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('row config options', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('rowHeight fixes the height of all rows', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          rowHeight: 60,
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' }
          ],
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

      const rows = holder.querySelectorAll('.tabulator-row')
      const rowComponents = table.getRows()
      const heights = rowComponents.map((row) => row._row.height)

      return {
        optionSet: table.options.rowHeight,
        rowCount: rows.length,
        allMatch: heights.every((h) => h === 60)
      }
    })

    expect(result.optionSet).toBe(60)
    expect(result.rowCount).toBeGreaterThan(0)
    expect(result.allMatch).toBe(true)
  })

  await test.step('rowFormatter applies a custom function to every row element', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          rowFormatter(row) {
            row.getElement().setAttribute('data-row-fmt', 'applied')
          },
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' }
          ],
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

      const rows = Array.from(holder.querySelectorAll('.tabulator-row'))
      const allTagged = rows.every((row) => row.getAttribute('data-row-fmt') === 'applied')

      return { rowCount: rows.length, allTagged }
    })

    expect(result.rowCount).toBeGreaterThan(0)
    expect(result.allTagged).toBe(true)
  })

  await test.step('rowFormatterPrint is used when generating print output', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          rowFormatterPrint(row) {
            row.getElement().setAttribute('data-print-fmt', 'print-applied')
          },
          data: [{ id: 1, name: 'alice' }],
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

      let printRowHtml = ''
      const originalGenerateTable = table.modules.export.generateTable
      table.modules.export.generateTable = function (config, styled, range, mode) {
        const tableEl = originalGenerateTable.call(this, config, styled, range, mode)
        const printRows = tableEl.querySelectorAll('tr[data-print-fmt]')
        printRowHtml = printRows.length > 0 ? printRows[0].getAttribute('data-print-fmt') : ''
        return tableEl
      }

      window.print = () => {}
      table.print()

      return { printRowHtml }
    })

    expect(result.printRowHtml).toBe('print-applied')
  })

  await test.step('rowFormatterHtmlOutput is used when generating HTML output', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          rowFormatterHtmlOutput(row) {
            row.getElement().setAttribute('data-html-fmt', 'html-applied')
          },
          data: [{ id: 1, name: 'alice' }],
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

      const html = table.getHtml('active', false)

      return { containsHtmlFmt: html.includes('data-html-fmt="html-applied"') }
    })

    expect(result.containsHtmlFmt).toBe(true)
  })

  await test.step('rowFormatterClipboard is used when generating clipboard output', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          clipboard: true,
          rowFormatterClipboard(row) {
            row.getElement().setAttribute('data-clip-fmt', 'clip-applied')
          },
          data: [{ id: 1, name: 'alice' }],
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

      const clipContent = table.modules.clipboard.generateClipboardContent()

      return { hasClipFmt: clipContent.html.includes('data-clip-fmt="clip-applied"') }
    })

    expect(result.hasClipFmt).toBe(true)
  })

  await test.step('addRowPos top inserts new rows at the top of the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const build = async (addRowPos) => {
        const holder = document.createElement('div')
        holder.style.width = '600px'
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            addRowPos,
            data: [{ id: 1, name: 'original' }],
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

        await table.addRow({ id: 99, name: 'added' })

        return table.getRows().map((row) => row.getData().id)
      }

      return {
        top: await build('top'),
        bottom: await build('bottom')
      }
    })

    expect(result.top[0]).toBe(99)
    expect(result.bottom[result.bottom.length - 1]).toBe(99)
  })

  await test.step('scrollToRowPosition and scrollToRowIfVisible options are stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          scrollToRowPosition: 'center',
          scrollToRowIfVisible: false,
          data: [{ id: 1, name: 'alice' }],
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

      return {
        scrollToRowPosition: table.options.scrollToRowPosition,
        scrollToRowIfVisible: table.options.scrollToRowIfVisible
      }
    })

    expect(result.scrollToRowPosition).toBe('center')
    expect(result.scrollToRowIfVisible).toBe(false)
  })

  await test.step('frozenRowsField freezes rows whose field value is true', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          frozenRowsField: 'pinned',
          frozenRows: [true], // freeze rows where the 'pinned' field is true
          data: [
            { id: 1, name: 'alice', pinned: true },
            { id: 2, name: 'bob', pinned: false },
            { id: 3, name: 'cara', pinned: true }
          ],
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

      const frozenRows = holder.querySelectorAll('.tabulator-frozen-rows-holder .tabulator-row')
      const frozenIds = Array.from(frozenRows).map((row) => {
        const cells = row.querySelectorAll('.tabulator-cell')
        return cells[0] ? parseInt(cells[0].textContent, 10) : null
      })

      return {
        frozenCount: frozenRows.length,
        frozenIds
      }
    })

    expect(result.frozenCount).toBe(2)
    expect(result.frozenIds).toContain(1)
    expect(result.frozenIds).toContain(3)
  })

  await test.step('rowHeader option adds a row header column to the left of the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          rowHeader: {
            title: '#',
            field: 'rownum',
            width: 40,
            resizable: false,
            headerSort: false,
            formatter(cell) {
              return cell.getRow().getPosition()
            }
          },
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' }
          ],
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

      const allColumns = table.getColumns()
      const firstColumn = allColumns[0]

      return {
        columnCount: allColumns.length,
        firstColumnTitle: firstColumn.getDefinition().title,
        firstColumnField: firstColumn.getDefinition().field,
        isRowHeader: firstColumn.getDefinition().rowHeader === true || firstColumn.getDefinition().field === 'rownum'
      }
    })

    expect(result.columnCount).toBe(3)
    expect(result.firstColumnTitle).toBe('#')
  })

  await test.step('resizableRowGuide option is stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          resizableRowGuide: true,
          data: [{ id: 1, name: 'alice' }],
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

      return {
        resizableRowGuide: table.options.resizableRowGuide
      }
    })

    expect(result.resizableRowGuide).toBe(true)
  })

  await test.step('movableRowsElementDrop callback fires when a row is dropped on a connected element', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const dropZone = document.createElement('div')
      dropZone.id = 'drop-zone-test'
      dropZone.style.width = '200px'
      dropZone.style.height = '50px'
      root.appendChild(dropZone)

      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      let dropCallCount = 0
      let droppedRowData = null

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          movableRows: true,
          movableRowsConnectedElements: '#drop-zone-test',
          data: [{ id: 1, name: 'alice' }],
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

      // Subscribe to the external movableRowsElementDrop event
      table.on('movableRowsElementDrop', (e, element, row) => {
        dropCallCount += 1
        droppedRowData = row ? row.getData() : null
      })

      const module = table.modules.moveRow
      const internalRow = table.rowManager.getRows()[0]

      // Simulate element drop by calling elementRowDrop with the connected element
      module.elementRowDrop({ stopImmediatePropagation() {} }, dropZone, internalRow)

      return {
        dropCallCount,
        droppedRowData,
        connectionSelectorsElements: module.connectionSelectorsElements
      }
    })

    expect(result.connectionSelectorsElements).toBe('#drop-zone-test')
    expect(result.dropCallCount).toBe(1)
    expect(result.droppedRowData).toEqual({ id: 1, name: 'alice' })
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
