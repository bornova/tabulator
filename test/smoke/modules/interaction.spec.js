import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

const headerOptions = [
  'headerClick',
  'headerDblClick',
  'headerContext',
  'headerMouseEnter',
  'headerMouseLeave',
  'headerMouseOver',
  'headerMouseOut',
  'headerMouseMove',
  'headerMouseDown',
  'headerMouseUp',
  'headerTap',
  'headerDblTap',
  'headerTapHold'
]

const cellOptions = [
  'cellClick',
  'cellDblClick',
  'cellContext',
  'cellMouseEnter',
  'cellMouseLeave',
  'cellMouseOver',
  'cellMouseOut',
  'cellMouseMove',
  'cellMouseDown',
  'cellMouseUp',
  'cellTap',
  'cellDblTap',
  'cellTapHold'
]

test('interaction module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('module is present', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')

      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        modulePresent: !!table.modules.interaction
      }
    })

    expect(result.modulePresent).toBe(true)
  })

  await test.step('all header and cell interaction options execute callbacks', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(
      async ({ headerOptions, cellOptions }) => {
        const root = document.getElementById('smoke-root')
        const holder = document.createElement('div')

        holder.style.width = '900px'
        root.appendChild(holder)

        const callbackCounts = {}

        const columnDef = {
          title: 'Name',
          field: 'name'
        }

        headerOptions.forEach((key) => {
          columnDef[key] = () => {
            callbackCounts[key] = (callbackCounts[key] || 0) + 1
          }
        })

        cellOptions.forEach((key) => {
          columnDef[key] = () => {
            callbackCounts[key] = (callbackCounts[key] || 0) + 1
          }
        })

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            data: [{ id: 1, name: 'Alice' }],
            columns: [columnDef]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        const column = table.columnManager.columnsByIndex[0]
        const row = table.rowManager.getRows()[0]
        const cell = row.getCell(column)
        const event = new Event('click')

        headerOptions.forEach((action) => {
          table.modules.interaction.dispatchEvent(action, event, column)
        })

        cellOptions.forEach((action) => {
          table.modules.interaction.dispatchEvent(action, event, cell)
        })

        const missing = [...headerOptions, ...cellOptions].filter((action) => callbackCounts[action] !== 1)

        return {
          missing,
          callbackCounts
        }
      },
      { headerOptions, cellOptions }
    )

    expect(result.missing).toEqual([])
  })

  await test.step('row and group interaction events dispatch externally', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const rowActions = [
        'rowClick',
        'rowDblClick',
        'rowContext',
        'rowMouseEnter',
        'rowMouseLeave',
        'rowMouseOver',
        'rowMouseOut',
        'rowMouseMove',
        'rowMouseDown',
        'rowMouseUp',
        'rowTap',
        'rowDblTap',
        'rowTapHold'
      ]

      const groupActions = [
        'groupClick',
        'groupDblClick',
        'groupContext',
        'groupMouseEnter',
        'groupMouseLeave',
        'groupMouseOver',
        'groupMouseOut',
        'groupMouseMove',
        'groupMouseDown',
        'groupMouseUp',
        'groupTap',
        'groupDblTap',
        'groupTapHold'
      ]

      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')

      holder.style.width = '900px'
      root.appendChild(holder)

      const counts = {}

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [
            { id: 1, name: 'Alice', group: 'A' },
            { id: 2, name: 'Bob', group: 'A' }
          ],
          columns: [
            { title: 'Name', field: 'name' },
            { title: 'Group', field: 'group' }
          ],
          groupBy: 'group'
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      ;[...rowActions, ...groupActions].forEach((action) => {
        counts[action] = 0
        table.on(action, () => {
          counts[action] += 1
        })
      })

      const row = table.rowManager.getRows()[0]
      const group = table.modules.groupRows.getGroups(false)[0]
      const event = new Event('click')

      rowActions.forEach((action) => {
        table.modules.interaction.dispatchEvent(action, event, row)
      })

      groupActions.forEach((action) => {
        table.modules.interaction.dispatchEvent(action, event, group)
      })

      const missing = [...rowActions, ...groupActions].filter((action) => counts[action] !== 1)

      return {
        hasGroup: !!group,
        missing
      }
    })

    expect(result.hasGroup).toBe(true)
    expect(result.missing).toEqual([])
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
