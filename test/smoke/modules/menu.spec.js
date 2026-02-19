import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('menu module smoke - all menu options', async ({ page }) => {
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
    holder.id = 'menu-all-options-table'
    holder.style.width = '1200px'
    root.appendChild(holder)

    const actionLog = []
    let openedCount = 0
    let closedCount = 0

    const makeMenu = (name) => [
      {
        label: () => `Action ${name}`,
        action: () => {
          actionLog.push(`action:${name}`)
        }
      },
      {
        label: `Disabled ${name}`,
        disabled: () => true,
        action: () => {
          actionLog.push(`disabled:${name}`)
        }
      },
      {
        label: `Submenu ${name}`,
        menu: [
          {
            label: `Child ${name}`,
            action: () => {
              actionLog.push(`child:${name}`)
            }
          }
        ]
      },
      { separator: true }
    ]

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        height: 260,
        data: [
          { id: 1, group: 'A', value: 'One' },
          { id: 2, group: 'A', value: 'Two' },
          { id: 3, group: 'B', value: 'Three' }
        ],
        groupBy: 'group',
        rowContextMenu: (e, row) => makeMenu('rowContextMenu'),
        rowClickMenu: makeMenu('rowClickMenu'),
        rowDblClickMenu: makeMenu('rowDblClickMenu'),
        groupContextMenu: makeMenu('groupContextMenu'),
        groupClickMenu: makeMenu('groupClickMenu'),
        groupDblClickMenu: makeMenu('groupDblClickMenu'),
        columns: [
          {
            title: 'Value',
            field: 'value',
            headerContextMenu: makeMenu('headerContextMenu'),
            headerClickMenu: makeMenu('headerClickMenu'),
            headerDblClickMenu: makeMenu('headerDblClickMenu'),
            headerMenu: makeMenu('headerMenu'),
            headerMenuIcon: () => {
              const el = document.createElement('span')
              el.className = 'menu-icon-test'
              el.textContent = 'M'
              return el
            },
            contextMenu: makeMenu('contextMenu'),
            clickMenu: makeMenu('clickMenu'),
            dblClickMenu: makeMenu('dblClickMenu')
          },
          { title: 'ID', field: 'id' }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    table.on('menuOpened', () => {
      openedCount++
    })

    table.on('menuClosed', () => {
      closedCount++
    })

    const menuModule = table.modules.menu
    const rowComp = table.getRows()[0]
    const cellComp = rowComp.getCell('value')
    const colComp = table.getColumn('value')
    const groupComp = table.getGroups()[0]

    const makeEvent = (type) => {
      return new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 100, clientY: 80 })
    }

    const closeMenu = async () => {
      if (menuModule.rootPopup) {
        menuModule.rootPopup.hide()
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    const runOption = async (name, trigger) => {
      await closeMenu()

      const beforeActions = actionLog.length
      trigger()

      const menuEl = document.querySelector('.tabulator-menu')
      const firstActionEl = menuEl
        ? menuEl.querySelector('.tabulator-menu-item:not(.tabulator-menu-item-disabled)')
        : null
      const disabledEl = menuEl ? menuEl.querySelector('.tabulator-menu-item-disabled') : null
      const submenuEl = menuEl ? menuEl.querySelector('.tabulator-menu-item-submenu') : null

      if (firstActionEl) {
        firstActionEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      }

      const afterActionClick = actionLog.length

      if (disabledEl) {
        disabledEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      }

      const afterDisabledClick = actionLog.length

      await closeMenu()

      return {
        opened: !!menuEl,
        hasSubmenu: !!submenuEl,
        actionTriggered: afterActionClick > beforeActions,
        disabledIgnored: afterDisabledClick === afterActionClick
      }
    }

    const optionResults = {}

    optionResults.rowContextMenu = await runOption('rowContextMenu', () => {
      menuModule.loadMenuEvent(table.options.rowContextMenu, makeEvent('contextmenu'), rowComp)
    })

    optionResults.rowClickMenu = await runOption('rowClickMenu', () => {
      menuModule.loadMenuEvent(table.options.rowClickMenu, makeEvent('click'), rowComp)
    })

    optionResults.rowDblClickMenu = await runOption('rowDblClickMenu', () => {
      menuModule.loadMenuEvent(table.options.rowDblClickMenu, makeEvent('dblclick'), rowComp)
    })

    optionResults.groupContextMenu = await runOption('groupContextMenu', () => {
      menuModule.loadMenuEvent(table.options.groupContextMenu, makeEvent('contextmenu'), groupComp)
    })

    optionResults.groupClickMenu = await runOption('groupClickMenu', () => {
      menuModule.loadMenuEvent(table.options.groupClickMenu, makeEvent('click'), groupComp)
    })

    optionResults.groupDblClickMenu = await runOption('groupDblClickMenu', () => {
      menuModule.loadMenuEvent(table.options.groupDblClickMenu, makeEvent('dblclick'), groupComp)
    })

    optionResults.headerContextMenu = await runOption('headerContextMenu', () => {
      menuModule.loadMenuTableColumnEvent('headerContextMenu', makeEvent('contextmenu'), colComp)
    })

    optionResults.headerClickMenu = await runOption('headerClickMenu', () => {
      menuModule.loadMenuTableColumnEvent('headerClickMenu', makeEvent('click'), colComp)
    })

    optionResults.headerDblClickMenu = await runOption('headerDblClickMenu', () => {
      menuModule.loadMenuTableColumnEvent('headerDblClickMenu', makeEvent('dblclick'), colComp)
    })

    const headerMenuButton = colComp.getElement().querySelector('.tabulator-header-popup-button')
    optionResults.headerMenu = await runOption('headerMenu', () => {
      headerMenuButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    optionResults.contextMenu = await runOption('contextMenu', () => {
      menuModule.loadMenuTableCellEvent('contextMenu', makeEvent('contextmenu'), cellComp)
    })

    optionResults.clickMenu = await runOption('clickMenu', () => {
      menuModule.loadMenuTableCellEvent('clickMenu', makeEvent('click'), cellComp)
    })

    optionResults.dblClickMenu = await runOption('dblClickMenu', () => {
      menuModule.loadMenuTableCellEvent('dblClickMenu', makeEvent('dblclick'), cellComp)
    })

    await closeMenu()

    return {
      modulePresent: !!menuModule,
      headerMenuButtonPresent: !!headerMenuButton,
      headerMenuIconPresent: !!headerMenuButton?.querySelector('.menu-icon-test'),
      optionResults,
      openedCount,
      closedCount,
      actionLog
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.modulePresent).toBe(true)
  expect(result.headerMenuButtonPresent).toBe(true)
  expect(result.headerMenuIconPresent).toBe(true)

  const optionKeys = [
    'rowContextMenu',
    'rowClickMenu',
    'rowDblClickMenu',
    'groupContextMenu',
    'groupClickMenu',
    'groupDblClickMenu',
    'headerContextMenu',
    'headerClickMenu',
    'headerDblClickMenu',
    'headerMenu',
    'contextMenu',
    'clickMenu',
    'dblClickMenu'
  ]

  optionKeys.forEach((key) => {
    expect(result.optionResults[key]?.opened, `${key} did not open`).toBe(true)
    expect(result.optionResults[key]?.hasSubmenu, `${key} missing submenu item`).toBe(true)
    expect(result.optionResults[key]?.actionTriggered, `${key} action did not fire`).toBe(true)
    expect(result.optionResults[key]?.disabledIgnored, `${key} disabled item triggered action`).toBe(true)
  })

  expect(result.openedCount).toBeGreaterThanOrEqual(optionKeys.length)
  expect(result.closedCount).toBeGreaterThan(0)
  expect(result.actionLog.length).toBeGreaterThanOrEqual(optionKeys.length)
})
