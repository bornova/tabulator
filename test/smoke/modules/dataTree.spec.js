import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

async function checkDataTreeEnabled(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        dataTree: true,
        dataTreeStartExpanded: true,
        data: [
          {
            id: 1,
            name: 'Root',
            _children: [{ id: 2, name: 'Child 1' }]
          }
        ],
        columns: [{ title: 'Name', field: 'name' }]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    return {
      modulePresent: !!table.modules.dataTree,
      controlCount: holder.querySelectorAll('.tabulator-data-tree-control').length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.modulePresent).toBe(true)
  expect(result.controlCount).toBeGreaterThan(0)
}

async function checkDataTreeChildField(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        dataTree: true,
        dataTreeChildField: 'children',
        dataTreeStartExpanded: true,
        data: [
          {
            id: 1,
            name: 'Root',
            children: [{ id: 2, name: 'Child via children field' }]
          }
        ],
        columns: [{ title: 'Name', field: 'name' }]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const names = Array.from(holder.querySelectorAll('.tabulator-row .tabulator-cell[tabulator-field="name"]')).map(
      (el) => el.textContent.trim()
    )

    return {
      hasChildFromConfiguredField: names.includes('Child via children field')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hasChildFromConfiguredField).toBe(true)
}

async function checkDataTreeElementColumn(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        dataTree: true,
        dataTreeElementColumn: 'age',
        data: [
          {
            id: 1,
            name: 'Root',
            age: 30,
            _children: [{ id: 2, name: 'Child', age: 10 }]
          }
        ],
        columns: [
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age' }
        ]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const rootRow = holder.querySelector('.tabulator-row.tabulator-tree-level-0')
    const nameCell = rootRow.querySelector('.tabulator-cell[tabulator-field="name"]')
    const ageCell = rootRow.querySelector('.tabulator-cell[tabulator-field="age"]')

    return {
      hasControlInName: !!nameCell.querySelector('.tabulator-data-tree-control'),
      hasControlInAge: !!ageCell.querySelector('.tabulator-data-tree-control')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hasControlInName).toBe(false)
  expect(result.hasControlInAge).toBe(true)
}

async function checkDataTreeBranchAndIndent(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holderCustom = document.createElement('div')
    const holderEmpty = document.createElement('div')

    holderCustom.style.width = '900px'
    holderEmpty.style.width = '900px'
    root.appendChild(holderCustom)
    root.appendChild(holderEmpty)

    await new Promise((resolve) => {
      const table = new Tabulator(holderCustom, {
        dataTree: true,
        dataTreeStartExpanded: true,
        dataTreeBranchElement: '<span class="dt-branch-custom"></span>',
        dataTreeChildIndent: 20,
        data: [
          {
            id: 1,
            name: 'Root',
            _children: [{ id: 2, name: 'Child' }]
          }
        ],
        columns: [{ title: 'Name', field: 'name' }]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    await new Promise((resolve) => {
      const table = new Tabulator(holderEmpty, {
        dataTree: true,
        dataTreeStartExpanded: true,
        dataTreeBranchElement: false,
        data: [
          {
            id: 10,
            name: 'Root 2',
            _children: [{ id: 20, name: 'Child 2' }]
          }
        ],
        columns: [{ title: 'Name', field: 'name' }]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const childRow = holderCustom.querySelector('.tabulator-row.tabulator-tree-level-1')
    const customBranch = childRow.querySelector('.dt-branch-custom')
    const marginLeft = customBranch ? parseInt(customBranch.style.marginLeft, 10) : 0

    return {
      hasCustomBranchElement: !!customBranch,
      hasConfiguredIndent: Number.isFinite(marginLeft) && marginLeft >= 20,
      hasEmptyBranchClass: !!holderEmpty.querySelector('.tabulator-data-tree-branch-empty')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hasCustomBranchElement).toBe(true)
  expect(result.hasConfiguredIndent).toBe(true)
  expect(result.hasEmptyBranchClass).toBe(true)
}

async function checkDataTreeExpandCollapseElements(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')

    holder.style.width = '900px'
    root.appendChild(holder)

    await new Promise((resolve) => {
      const table = new Tabulator(holder, {
        dataTree: true,
        dataTreeStartExpanded: false,
        dataTreeExpandElement: '<button class="dt-expand">+</button>',
        dataTreeCollapseElement: '<button class="dt-collapse">-</button>',
        data: [
          {
            id: 1,
            name: 'Root',
            _children: [{ id: 2, name: 'Child' }]
          }
        ],
        columns: [{ title: 'Name', field: 'name' }]
      })

      const timeout = setTimeout(resolve, 1500)
      table.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const hadExpandControl = !!holder.querySelector('.dt-expand')

    holder.querySelector('.dt-expand').click()
    await new Promise((resolve) => setTimeout(resolve, 25))

    return {
      hadExpandControl,
      hasCollapseControlAfterExpand: !!holder.querySelector('.dt-collapse')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hadExpandControl).toBe(true)
  expect(result.hasCollapseControlAfterExpand).toBe(true)
}

async function checkDataTreeStartExpanded(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const buildTable = (holder, startExpanded) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          dataTree: true,
          dataTreeStartExpanded: startExpanded,
          data: [
            {
              id: 1,
              name: 'Root',
              _children: [
                {
                  id: 2,
                  name: 'Child',
                  _children: [{ id: 3, name: 'Grandchild' }]
                }
              ]
            }
          ],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      })
    }

    const holderBoolean = document.createElement('div')
    const holderArray = document.createElement('div')
    const holderFunction = document.createElement('div')

    holderBoolean.style.width = '900px'
    holderArray.style.width = '900px'
    holderFunction.style.width = '900px'

    root.appendChild(holderBoolean)
    root.appendChild(holderArray)
    root.appendChild(holderFunction)

    await buildTable(holderBoolean, true)
    await buildTable(holderArray, [true, false])
    await buildTable(holderFunction, (row, index) => index === 0)

    return {
      booleanVisibleRows: holderBoolean.querySelectorAll('.tabulator-row').length,
      arrayVisibleRows: holderArray.querySelectorAll('.tabulator-row').length,
      functionVisibleRows: holderFunction.querySelectorAll('.tabulator-row').length
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.booleanVisibleRows).toBe(3)
  expect(result.arrayVisibleRows).toBe(2)
  expect(result.functionVisibleRows).toBe(2)
}

async function checkDataTreeFilter(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const data = [
      {
        id: 1,
        name: 'Root A',
        group: 'A',
        _children: [
          { id: 2, name: 'Child A', group: 'A' },
          { id: 3, name: 'Child B', group: 'B' }
        ]
      },
      {
        id: 10,
        name: 'Root B',
        group: 'B',
        _children: [{ id: 11, name: 'Child B2', group: 'B' }]
      }
    ]

    const buildAndFilter = (holder, dataTreeFilter) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          dataTree: true,
          dataTreeStartExpanded: true,
          dataTreeFilter,
          data,
          columns: [
            { title: 'Name', field: 'name' },
            { title: 'Group', field: 'group' }
          ]
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      }).then(async (table) => {
        table.setFilter('group', '=', 'A')
        await new Promise((resolve) => setTimeout(resolve, 25))

        return Array.from(holder.querySelectorAll('.tabulator-row .tabulator-cell[tabulator-field="name"]')).map((el) =>
          el.textContent.trim()
        )
      })
    }

    const holderFilterChildren = document.createElement('div')
    const holderNoChildFilter = document.createElement('div')

    holderFilterChildren.style.width = '900px'
    holderNoChildFilter.style.width = '900px'
    root.appendChild(holderFilterChildren)
    root.appendChild(holderNoChildFilter)

    const namesWithChildFilter = await buildAndFilter(holderFilterChildren, true)
    const namesWithoutChildFilter = await buildAndFilter(holderNoChildFilter, false)

    return {
      hasChildBWhenFilteringChildren: namesWithChildFilter.includes('Child B'),
      hasChildBWithoutFilteringChildren: namesWithoutChildFilter.includes('Child B')
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.hasChildBWhenFilteringChildren).toBe(false)
  expect(result.hasChildBWithoutFilteringChildren).toBe(true)
}

async function checkDataTreeSort(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const data = [
      {
        id: 1,
        name: 'Root',
        _children: [
          { id: 2, name: 'Zulu' },
          { id: 3, name: 'Alpha' }
        ]
      }
    ]

    const buildAndSort = (holder, dataTreeSort) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          dataTree: true,
          dataTreeStartExpanded: true,
          dataTreeSort,
          data,
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      }).then(async (table) => {
        table.setSort('name', 'asc')
        await new Promise((resolve) => setTimeout(resolve, 25))

        return Array.from(
          holder.querySelectorAll('.tabulator-row.tabulator-tree-level-1 .tabulator-cell[tabulator-field="name"]')
        ).map((el) => el.textContent.trim())
      })
    }

    const holderSortChildren = document.createElement('div')
    const holderNoChildSort = document.createElement('div')

    holderSortChildren.style.width = '900px'
    holderNoChildSort.style.width = '900px'
    root.appendChild(holderSortChildren)
    root.appendChild(holderNoChildSort)

    const childOrderWithSort = await buildAndSort(holderSortChildren, true)
    const childOrderWithoutSort = await buildAndSort(holderNoChildSort, false)

    return {
      childOrderWithSort,
      childOrderWithoutSort
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.childOrderWithSort).toEqual(['Alpha', 'Zulu'])
  expect(result.childOrderWithoutSort).toEqual(['Zulu', 'Alpha'])
}

async function checkDataTreeChildColumnCalcs(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const data = [
      {
        id: 1,
        value: 10,
        _children: [
          { id: 2, value: 20 },
          { id: 3, value: 30 }
        ]
      }
    ]

    const buildWithCalcs = (holder, dataTreeChildColumnCalcs) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          dataTree: true,
          dataTreeStartExpanded: true,
          dataTreeChildColumnCalcs,
          data,
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Value', field: 'value', bottomCalc: 'count' }
          ]
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      }).then((table) => table.getCalcResults().bottom.value)
    }

    const holderWithoutChildren = document.createElement('div')
    const holderWithChildren = document.createElement('div')

    holderWithoutChildren.style.width = '900px'
    holderWithChildren.style.width = '900px'
    root.appendChild(holderWithoutChildren)
    root.appendChild(holderWithChildren)

    const bottomCountWithoutChildren = await buildWithCalcs(holderWithoutChildren, false)
    const bottomCountWithChildren = await buildWithCalcs(holderWithChildren, true)

    return {
      bottomCountWithoutChildren,
      bottomCountWithChildren
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.bottomCountWithoutChildren).toBe(1)
  expect(result.bottomCountWithChildren).toBe(3)
}

async function checkDataTreeSelectPropagate(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const data = [
      {
        id: 1,
        name: 'Root',
        _children: [
          { id: 2, name: 'Child 1' },
          { id: 3, name: 'Child 2' }
        ]
      }
    ]

    const buildAndSelect = (holder, dataTreeSelectPropagate) => {
      return new Promise((resolve) => {
        const table = new Tabulator(holder, {
          dataTree: true,
          dataTreeStartExpanded: true,
          dataTreeSelectPropagate,
          selectableRows: true,
          data,
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(table), 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(table)
        })
      }).then(async (table) => {
        table.selectRow(1)
        await new Promise((resolve) => setTimeout(resolve, 25))
        const selectedAfterSelect = table
          .getSelectedData()
          .map((row) => row.id)
          .sort((a, b) => a - b)

        table.deselectRow(1)
        await new Promise((resolve) => setTimeout(resolve, 25))
        const selectedAfterDeselect = table
          .getSelectedData()
          .map((row) => row.id)
          .sort((a, b) => a - b)

        return {
          selectedAfterSelect,
          selectedAfterDeselect
        }
      })
    }

    const holderNoPropagate = document.createElement('div')
    const holderPropagate = document.createElement('div')

    holderNoPropagate.style.width = '900px'
    holderPropagate.style.width = '900px'
    root.appendChild(holderNoPropagate)
    root.appendChild(holderPropagate)

    const withoutPropagate = await buildAndSelect(holderNoPropagate, false)
    const withPropagate = await buildAndSelect(holderPropagate, true)

    return {
      withoutPropagate,
      withPropagate
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.withoutPropagate.selectedAfterSelect).toEqual([1])
  expect(result.withPropagate.selectedAfterSelect).toEqual([1, 2, 3])
  expect(result.withoutPropagate.selectedAfterDeselect).toEqual([])
  expect(result.withPropagate.selectedAfterDeselect).toEqual([])
}

test('dataTree module options smoke', async ({ page }) => {
  await test.step('dataTree enablement', async () => {
    await checkDataTreeEnabled(page)
  })

  await test.step('dataTreeChildField', async () => {
    await checkDataTreeChildField(page)
  })

  await test.step('dataTreeElementColumn', async () => {
    await checkDataTreeElementColumn(page)
  })

  await test.step('dataTreeBranchElement and dataTreeChildIndent', async () => {
    await checkDataTreeBranchAndIndent(page)
  })

  await test.step('dataTreeExpandElement and dataTreeCollapseElement', async () => {
    await checkDataTreeExpandCollapseElements(page)
  })

  await test.step('dataTreeStartExpanded', async () => {
    await checkDataTreeStartExpanded(page)
  })

  await test.step('dataTreeFilter', async () => {
    await checkDataTreeFilter(page)
  })

  await test.step('dataTreeSort', async () => {
    await checkDataTreeSort(page)
  })

  await test.step('dataTreeChildColumnCalcs', async () => {
    await checkDataTreeChildColumnCalcs(page)
  })

  await test.step('dataTreeSelectPropagate', async () => {
    await checkDataTreeSelectPropagate(page)
  })
})
