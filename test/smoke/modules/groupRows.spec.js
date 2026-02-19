import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

async function checkGroupBy(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data: [
          { id: 1, group: 'A', name: 'Alice' },
          { id: 2, group: 'A', name: 'Cara' },
          { id: 3, group: 'B', name: 'Bob' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Group', field: 'group' },
          { title: 'Name', field: 'name' }
        ],
        groupBy: 'group'
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    return {
      modulePresent: !!table.modules.groupRows,
      groupHeaderCount: holder.querySelectorAll('.tabulator-group').length,
      topLevelGroupCount: table.getGroups().length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.modulePresent).toBe(true)
  expect(result.groupHeaderCount).toBeGreaterThan(0)
  expect(result.topLevelGroupCount).toBe(2)
}

async function checkGroupStartOpen(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const buildTable = (holder, groupStartOpen) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          data: [
            { id: 1, group: 'A', name: 'Alice' },
            { id: 2, group: 'A', name: 'Cara' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Group', field: 'group' },
            { title: 'Name', field: 'name' }
          ],
          groupBy: 'group',
          groupStartOpen
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const holderClosed = document.createElement('div')
    const holderOpen = document.createElement('div')
    holderClosed.style.width = '900px'
    holderOpen.style.width = '900px'
    root.appendChild(holderClosed)
    root.appendChild(holderOpen)

    await buildTable(holderClosed, false)
    await buildTable(holderOpen, true)

    const closedVisibleRows = holderClosed.querySelectorAll('.tabulator-row:not(.tabulator-group)').length
    const openVisibleRows = holderOpen.querySelectorAll('.tabulator-row:not(.tabulator-group)').length

    return {
      closedVisibleRows,
      openVisibleRows
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.closedVisibleRows).toBe(0)
  expect(result.openVisibleRows).toBe(2)
}

async function checkGroupHeader(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        data: [
          { id: 1, group: 'A', name: 'Alice' },
          { id: 2, group: 'A', name: 'Cara' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Group', field: 'group' },
          { title: 'Name', field: 'name' }
        ],
        groupBy: 'group',
        groupHeader(value, count) {
          return `CUSTOM-${value}-${count}`
        }
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    return {
      headerText: holder.querySelector('.tabulator-group')?.textContent || ''
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.headerText.includes('CUSTOM-A-2')).toBe(true)
}

async function checkGroupValues(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        data: [
          { id: 1, group: 'A', name: 'Alice' },
          { id: 2, group: 'B', name: 'Bob' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Group', field: 'group' },
          { title: 'Name', field: 'name' }
        ],
        groupBy: 'group',
        groupValues: [['A', 'B', 'C']]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const headers = Array.from(holder.querySelectorAll('.tabulator-group')).map((el) => el.textContent.trim())

    return {
      headerCount: headers.length,
      hasEmptyConfiguredGroup: headers.some((text) => text.includes('C'))
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.headerCount).toBe(3)
  expect(result.hasEmptyConfiguredGroup).toBe(true)
}

async function checkGroupUpdateOnCellEdit(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data: [
          { id: 1, group: 'A', name: 'Alice' },
          { id: 2, group: 'B', name: 'Bob' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Group', field: 'group', editor: 'input' },
          { title: 'Name', field: 'name' }
        ],
        groupBy: 'group',
        groupUpdateOnCellEdit: true
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const row = table.getRow(1)
    const beforeGroup = row.getGroup()?.getKey()

    await row.update({ group: 'B' })
    await new Promise((resolve) => setTimeout(resolve, 40))

    const afterGroup = row.getGroup()?.getKey()

    return {
      beforeGroup,
      afterGroup,
      groupCount: table.getGroups().length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.beforeGroup).toBe('A')
  expect(result.afterGroup).toBe('B')
  expect(result.groupCount).toBe(1)
}

async function checkGroupToggleElement(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const build = (holder, groupToggleElement) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          data: [
            { id: 1, group: 'A', name: 'Alice' },
            { id: 2, group: 'A', name: 'Cara' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Group', field: 'group' },
            { title: 'Name', field: 'name' }
          ],
          groupBy: 'group',
          groupStartOpen: true,
          groupToggleElement
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const holderArrow = document.createElement('div')
    const holderHeader = document.createElement('div')
    const holderDisabled = document.createElement('div')
    holderArrow.style.width = '900px'
    holderHeader.style.width = '900px'
    holderDisabled.style.width = '900px'

    root.appendChild(holderArrow)
    root.appendChild(holderHeader)
    root.appendChild(holderDisabled)

    await build(holderArrow, 'arrow')
    await build(holderHeader, 'header')
    await build(holderDisabled, false)

    const arrowGroup = holderArrow.querySelector('.tabulator-group')
    const arrowToggle = holderArrow.querySelector('.tabulator-group-toggle')
    const headerGroup = holderHeader.querySelector('.tabulator-group')
    const disabledGroup = holderDisabled.querySelector('.tabulator-group')

    const arrowRowsBefore = holderArrow.querySelectorAll('.tabulator-row:not(.tabulator-group)').length
    arrowGroup.click()
    await new Promise((resolve) => setTimeout(resolve, 30))
    const arrowRowsAfterHeaderClick = holderArrow.querySelectorAll('.tabulator-row:not(.tabulator-group)').length
    arrowToggle.click()
    await new Promise((resolve) => setTimeout(resolve, 30))
    const arrowRowsAfterToggleClick = holderArrow.querySelectorAll('.tabulator-row:not(.tabulator-group)').length

    const headerRowsBefore = holderHeader.querySelectorAll('.tabulator-row:not(.tabulator-group)').length
    headerGroup.click()
    await new Promise((resolve) => setTimeout(resolve, 30))
    const headerRowsAfterClick = holderHeader.querySelectorAll('.tabulator-row:not(.tabulator-group)').length

    const disabledRowsBefore = holderDisabled.querySelectorAll('.tabulator-row:not(.tabulator-group)').length
    disabledGroup.click()
    await new Promise((resolve) => setTimeout(resolve, 30))
    const disabledRowsAfterClick = holderDisabled.querySelectorAll('.tabulator-row:not(.tabulator-group)').length

    return {
      arrowRowsBefore,
      arrowRowsAfterHeaderClick,
      arrowRowsAfterToggleClick,
      headerRowsBefore,
      headerRowsAfterClick,
      disabledRowsBefore,
      disabledRowsAfterClick
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.arrowRowsBefore).toBe(2)
  expect(result.arrowRowsAfterHeaderClick).toBe(2)
  expect(result.arrowRowsAfterToggleClick).toBe(0)
  expect(result.headerRowsBefore).toBe(2)
  expect(result.headerRowsAfterClick).toBe(0)
  expect(result.disabledRowsBefore).toBe(2)
  expect(result.disabledRowsAfterClick).toBe(2)
}

async function checkGroupClosedShowCalcs(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const build = (holder, groupClosedShowCalcs) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          data: [
            { id: 1, group: 'A', value: 10 },
            { id: 2, group: 'A', value: 20 }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Group', field: 'group' },
            { title: 'Value', field: 'value', bottomCalc: 'sum' }
          ],
          groupBy: 'group',
          groupStartOpen: false,
          columnCalcs: 'group',
          groupClosedShowCalcs
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const holderHiddenCalcs = document.createElement('div')
    const holderShownCalcs = document.createElement('div')
    holderHiddenCalcs.style.width = '900px'
    holderShownCalcs.style.width = '900px'
    root.appendChild(holderHiddenCalcs)
    root.appendChild(holderShownCalcs)

    await build(holderHiddenCalcs, false)
    await build(holderShownCalcs, true)

    return {
      calcsWhenDisabled: holderHiddenCalcs.querySelectorAll('.tabulator-calcs').length,
      calcsWhenEnabled: holderShownCalcs.querySelectorAll('.tabulator-calcs').length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.calcsWhenDisabled).toBe(0)
  expect(result.calcsWhenEnabled).toBeGreaterThan(0)
}

async function checkGroupHeaderOutputOptions(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const createHolder = () => {
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)
      return holder
    }

    const data = [
      { id: 1, group: 'A', name: 'Alice' },
      { id: 2, group: 'A', name: 'Cara' }
    ]

    const columns = [
      { title: 'ID', field: 'id' },
      { title: 'Group', field: 'group' },
      { title: 'Name', field: 'name' }
    ]

    const buildTable = (holder, extraOptions) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          data,
          columns,
          groupBy: 'group',
          ...extraOptions
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const htmlTable = await buildTable(createHolder(), {
      groupHeaderHtmlOutput(value, count) {
        return `HTML-${value}-${count}`
      }
    })
    const printTable = await buildTable(createHolder(), {
      groupHeaderPrint(value, count) {
        return `PRINT-${value}-${count}`
      }
    })
    const clipboardTable = await buildTable(createHolder(), {
      groupHeaderClipboard(value, count) {
        return `CLIP-${value}-${count}`
      }
    })
    const downloadTable = await buildTable(createHolder(), {
      groupHeaderDownload(value, count) {
        return `DOWN-${value}-${count}`
      }
    })

    const htmlOutput = htmlTable.getHtml('active', false)
    const printOutput = printTable.getHtml('active', false, {}, 'print')
    const clipboardOutput = clipboardTable.getHtml('active', false, {}, 'clipboard')

    const downloadList = downloadTable.modules.download.generateExportList('active')
    const downloadGroup = downloadList.find((row) => row.type === 'group')
    const downloadHeader = downloadGroup ? String(downloadGroup.columns[0].value) : ''

    return {
      hasHtmlOutputHeader: htmlOutput.includes('HTML-A-2'),
      hasPrintHeader: printOutput.includes('PRINT-A-2'),
      hasClipboardHeader: clipboardOutput.includes('CLIP-A-2'),
      hasDownloadHeader: downloadHeader.includes('DOWN-A-2')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hasHtmlOutputHeader).toBe(true)
  expect(result.hasPrintHeader).toBe(true)
  expect(result.hasClipboardHeader).toBe(true)
  expect(result.hasDownloadHeader).toBe(true)
}

async function checkGroupTableFunctions(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data: [
          { id: 1, group: 'A', name: 'Alice' },
          { id: 2, group: 'A', name: 'Cara' },
          { id: 3, group: 'B', name: 'Bob' }
        ],
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Group', field: 'group' },
          { title: 'Name', field: 'name' }
        ],
        groupBy: 'group'
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const functionPresence = {
      setGroupBy: typeof table.setGroupBy === 'function',
      setGroupValues: typeof table.setGroupValues === 'function',
      setGroupStartOpen: typeof table.setGroupStartOpen === 'function',
      setGroupHeader: typeof table.setGroupHeader === 'function',
      getGroups: typeof table.getGroups === 'function',
      getGroupedData: typeof table.getGroupedData === 'function'
    }

    const initialGroupCount = table.getGroups().length

    table.setGroupBy('name')
    await new Promise((resolve) => setTimeout(resolve, 30))
    const groupCountAfterSetGroupBy = table.getGroups().length

    table.setGroupBy('group')
    table.setGroupHeader((value, count) => `API-${value}-${count}`)
    table.setGroupStartOpen(false)
    table.setGroupValues([['A', 'B', 'C']])
    await new Promise((resolve) => setTimeout(resolve, 40))

    const headerText = holder.querySelector('.tabulator-group')?.textContent || ''
    const groupCountAfterSetValues = table.getGroups().length
    const groupedData = table.getGroupedData()

    return {
      functionPresence,
      initialGroupCount,
      groupCountAfterSetGroupBy,
      groupCountAfterSetValues,
      groupStartOpenOption: table.options.groupStartOpen,
      headerText,
      groupedDataIsArray: Array.isArray(groupedData),
      groupedDataLength: groupedData.length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.functionPresence).toEqual({
    setGroupBy: true,
    setGroupValues: true,
    setGroupStartOpen: true,
    setGroupHeader: true,
    getGroups: true,
    getGroupedData: true
  })
  expect(result.initialGroupCount).toBe(2)
  expect(result.groupCountAfterSetGroupBy).toBe(3)
  expect(result.groupCountAfterSetValues).toBe(3)
  expect(result.groupStartOpenOption).toBe(false)
  expect(result.headerText.includes('API-A-2')).toBe(true)
  expect(result.groupedDataIsArray).toBe(true)
  expect(result.groupedDataLength).toBeGreaterThanOrEqual(3)
}

test('groupRows module', async ({ page }) => {
  await test.step('groupBy', async () => {
    await checkGroupBy(page)
  })

  await test.step('groupStartOpen', async () => {
    await checkGroupStartOpen(page)
  })

  await test.step('groupHeader', async () => {
    await checkGroupHeader(page)
  })

  await test.step('groupValues', async () => {
    await checkGroupValues(page)
  })

  await test.step('groupUpdateOnCellEdit', async () => {
    await checkGroupUpdateOnCellEdit(page)
  })

  await test.step('groupToggleElement', async () => {
    await checkGroupToggleElement(page)
  })

  await test.step('groupClosedShowCalcs', async () => {
    await checkGroupClosedShowCalcs(page)
  })

  await test.step('groupHeader output options', async () => {
    await checkGroupHeaderOutputOptions(page)
  })

  await test.step('group table functions', async () => {
    await checkGroupTableFunctions(page)
  })
})
