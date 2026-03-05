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

  await test.step('interaction internal lifecycle and touch behavior', async () => {
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

      const mod = table.modules.interaction

      mod.touchWatchers.row.tap = {}
      mod.touchWatchers.cell.tapHold = setTimeout(() => {}, 1)
      mod.clearTouchWatchers()

      const allWatchersCleared = Object.values(mod.touchWatchers).every((watchers) =>
        Object.values(watchers).every((value) => value === null)
      )

      const regularSubscribed = []
      const regularUnsubscribed = []
      const originalSubscribe = mod.subscribe
      const originalUnsubscribe = mod.unsubscribe
      const originalSubscribedExternal = mod.subscribedExternal

      mod.subscribe = (eventName) => {
        regularSubscribed.push(eventName)
      }
      mod.unsubscribe = (eventName) => {
        regularUnsubscribed.push(eventName)
      }
      mod.subscribedExternal = () => false

      mod.subscriptionChanged('cellClick', true)
      const hasRegularSubscriber = typeof mod.subscribers.cellClick === 'function'

      mod.subscriptionChanged('cellClick', false)
      const regularSubscriberRemoved = mod.subscribers.cellClick === undefined

      mod.subscriptionChanged('cellTap', true)
      const touchSubscriberCreated = mod.subscribers.cellTap === true
      const hasTouchStartSubscriber = typeof mod.touchSubscribers['cell-touchstart'] === 'function'
      const hasTouchEndSubscriber = typeof mod.touchSubscribers['cell-touchend'] === 'function'

      mod.subscriptionChanged('cellTap', false)
      const touchSubscriberRemoved = mod.subscribers.cellTap === undefined
      const touchStartSubscriberRemoved = mod.touchSubscribers['cell-touchstart'] === undefined
      const touchEndSubscriberRemoved = mod.touchSubscribers['cell-touchend'] === undefined

      mod.subscribe = originalSubscribe
      mod.unsubscribe = originalUnsubscribe
      mod.subscribedExternal = originalSubscribedExternal

      const initializeSubscribed = []
      const initializeExternalHooks = []
      const originalInitializeSubscribe = mod.subscribe
      const originalSubscriptionChangeExternal = mod.subscriptionChangeExternal

      mod.subscribe = (eventName) => {
        initializeSubscribed.push(eventName)
      }
      mod.subscriptionChangeExternal = (eventName) => {
        initializeExternalHooks.push(eventName)
      }

      mod.initialize()

      mod.subscribe = originalInitializeSubscribe
      mod.subscriptionChangeExternal = originalSubscriptionChangeExternal

      const row = table.rowManager.getRows()[0]
      const column = table.columnManager.columnsByIndex[0]
      const cell = row.getCell(column)

      const touchDispatches = []
      const originalDispatchEvent = mod.dispatchEvent
      mod.dispatchEvent = (action) => {
        touchDispatches.push(action)
      }

      const touchEvent = new Event('touchstart')
      mod.handleTouch('cell', 'start', touchEvent, cell)
      mod.handleTouch('cell', 'end', touchEvent, cell)
      const tapDispatched = touchDispatches.includes('cellTap')

      mod.handleTouch('cell', 'start', touchEvent, cell)
      mod.handleTouch('cell', 'end', touchEvent, cell)
      const dblTapDispatched = touchDispatches.includes('cellDblTap')

      mod.dispatchEvent = originalDispatchEvent

      const originalModExists = table.modExists
      table.modExists = () => false

      const originalCreateRange = document.createRange
      const originalGetSelection = window.getSelection
      let preventDefaultCalled = false
      let removeAllRangesCalled = false
      let addRangeCalled = false

      document.createRange = () => ({
        selectNode() {}
      })

      window.getSelection = () => ({
        removeAllRanges() {
          removeAllRangesCalled = true
        },
        addRange() {
          addRangeCalled = true
        }
      })

      mod.cellContentsSelectionFixer(
        {
          preventDefault() {
            preventDefaultCalled = true
          }
        },
        cell
      )

      table.modExists = () => true
      table.modules.edit = { currentCell: cell }

      let preventDefaultCalledWhenEditing = false
      mod.cellContentsSelectionFixer(
        {
          preventDefault() {
            preventDefaultCalledWhenEditing = true
          }
        },
        cell
      )

      document.createRange = originalCreateRange
      window.getSelection = originalGetSelection
      table.modExists = originalModExists

      return {
        allWatchersCleared,
        regularSubscribed,
        regularUnsubscribed,
        hasRegularSubscriber,
        regularSubscriberRemoved,
        touchSubscriberCreated,
        hasTouchStartSubscriber,
        hasTouchEndSubscriber,
        touchSubscriberRemoved,
        touchStartSubscriberRemoved,
        touchEndSubscriberRemoved,
        initializeSubscribed,
        initializeExternalHooksCount: initializeExternalHooks.length,
        tapDispatched,
        dblTapDispatched,
        preventDefaultCalled,
        removeAllRangesCalled,
        addRangeCalled,
        preventDefaultCalledWhenEditing
      }
    })

    expect(result.allWatchersCleared).toBe(true)
    expect(result.regularSubscribed).toContain('cell-click')
    expect(result.regularUnsubscribed).toContain('cell-click')
    expect(result.hasRegularSubscriber).toBe(true)
    expect(result.regularSubscriberRemoved).toBe(true)
    expect(result.touchSubscriberCreated).toBe(true)
    expect(result.hasTouchStartSubscriber).toBe(true)
    expect(result.hasTouchEndSubscriber).toBe(true)
    expect(result.touchSubscriberRemoved).toBe(true)
    expect(result.touchStartSubscriberRemoved).toBe(true)
    expect(result.touchEndSubscriberRemoved).toBe(true)
    expect(result.initializeSubscribed).toEqual(
      expect.arrayContaining(['column-init', 'cell-dblclick', 'scroll-horizontal', 'scroll-vertical'])
    )
    expect(result.initializeExternalHooksCount).toBeGreaterThan(0)
    expect(result.tapDispatched).toBe(true)
    expect(result.dblTapDispatched).toBe(true)
    expect(result.preventDefaultCalled).toBe(true)
    expect(result.removeAllRangesCalled).toBe(true)
    expect(result.addRangeCalled).toBe(true)
    expect(result.preventDefaultCalledWhenEditing).toBe(false)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
