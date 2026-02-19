import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('popup module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.style.width = '900px'
    root.appendChild(holder)

    const markers = {
      rowContextPopup: 'ROW_CONTEXT',
      rowClickPopup: 'ROW_CLICK',
      rowDblClickPopup: 'ROW_DBL',
      groupContextPopup: 'GROUP_CONTEXT',
      groupClickPopup: 'GROUP_CLICK',
      groupDblClickPopup: 'GROUP_DBL',
      headerContextPopup: 'HEADER_CONTEXT',
      headerClickPopup: 'HEADER_CLICK',
      headerDblClickPopup: 'HEADER_DBL',
      headerPopup: 'HEADER_BUTTON',
      contextPopup: 'CELL_CONTEXT',
      clickPopup: 'CELL_CLICK',
      dblClickPopup: 'CELL_DBL'
    }

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data: [
          { id: 1, group: 'A', name: 'Alice' },
          { id: 2, group: 'A', name: 'Bob' }
        ],
        groupBy: 'group',
        rowContextPopup: () => markers.rowContextPopup,
        rowClickPopup: () => markers.rowClickPopup,
        rowDblClickPopup: () => markers.rowDblClickPopup,
        groupContextPopup: () => markers.groupContextPopup,
        groupClickPopup: () => markers.groupClickPopup,
        groupDblClickPopup: () => markers.groupDblClickPopup,
        columns: [
          { title: 'ID', field: 'id' },
          {
            title: 'Name',
            field: 'name',
            headerContextPopup: () => markers.headerContextPopup,
            headerClickPopup: () => markers.headerClickPopup,
            headerDblClickPopup: () => markers.headerDblClickPopup,
            headerPopup: () => markers.headerPopup,
            headerPopupIcon: '<span class="popup-icon-marker">ICON</span>',
            contextPopup: () => markers.contextPopup,
            clickPopup: () => markers.clickPopup,
            dblClickPopup: () => markers.dblClickPopup
          }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const popupModule = table.modules.popup
    const opened = []

    popupModule.loadPopup = (e, component, contents) => {
      opened.push(String(contents))
    }

    const fakeEvent = {
      preventDefault() {},
      stopPropagation() {}
    }

    const row = table.rowManager.getRows()[0]
    const group = table.modules.groupRows.getGroups(false)[0]
    const column = table.columnManager.columnsByIndex.find((col) => col.getField() === 'name')
    const cell = row.getCell(column)

    popupModule.dispatch('row-contextmenu', fakeEvent, row)
    popupModule.dispatch('row-click', fakeEvent, row)
    popupModule.dispatch('row-dblclick', fakeEvent, row)

    popupModule.dispatch('group-contextmenu', fakeEvent, group)
    popupModule.dispatch('group-click', fakeEvent, group)
    popupModule.dispatch('group-dblclick', fakeEvent, group)

    popupModule.dispatch('column-contextmenu', fakeEvent, column)
    popupModule.dispatch('column-click', fakeEvent, column)
    popupModule.dispatch('column-dblclick', fakeEvent, column)

    popupModule.dispatch('cell-contextmenu', fakeEvent, cell)
    popupModule.dispatch('cell-click', fakeEvent, cell)

    const headerPopupButton = holder.querySelector('.tabulator-header-popup-button')
    const iconExists = !!headerPopupButton?.querySelector('.popup-icon-marker')

    headerPopupButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    return {
      modulePresent: !!popupModule,
      iconExists,
      opened,
      expected: Object.values(markers)
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.modulePresent).toBe(true)
  expect(result.iconExists).toBe(true)
  result.expected.forEach((marker) => {
    expect(result.opened.includes(marker), `missing popup marker: ${marker}`).toBe(true)
  })
})
