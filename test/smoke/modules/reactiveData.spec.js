import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('reactiveData module', async ({ page }) => {
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
    const buildTable = (holder, options) => {
      return new Promise((resolve) => {
        const instance = new Tabulator(holder, options)
        const timeout = setTimeout(() => resolve(instance), 1500)

        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })
    }

    const holderReactive = document.createElement('div')
    holderReactive.id = 'reactive-table-true'
    holderReactive.style.width = '600px'
    root.appendChild(holderReactive)

    const reactiveData = [
      { id: 1, name: 'Alice', age: 22 },
      { id: 2, name: 'Bob', age: 31 }
    ]

    const table = await buildTable(holderReactive, {
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' },
        { title: 'Age', field: 'age' }
      ],
      data: reactiveData,
      reactiveData: true
    })

    reactiveData.push({ id: 3, name: 'Cara', age: 28 })
    reactiveData.unshift({ id: 0, name: 'Zed', age: 40 })
    reactiveData.pop()
    reactiveData.shift()
    reactiveData.splice(1, 0, { id: 9, name: 'Eve', age: 35 })
    reactiveData.splice(1, 1)
    reactiveData[0].name = 'AliceUpdated'

    await new Promise((resolve) => setTimeout(resolve, 10))

    const tableData = table.getData()

    const pushDescriptorBeforeDestroy = Object.getOwnPropertyDescriptor(reactiveData, 'push')
    table.destroy()
    const pushDescriptorAfterDestroy = Object.getOwnPropertyDescriptor(reactiveData, 'push')

    reactiveData.push({ id: 99, name: 'AfterDestroy', age: 10 })

    const holderNonReactive = document.createElement('div')
    holderNonReactive.id = 'reactive-table-false'
    holderNonReactive.style.width = '600px'
    root.appendChild(holderNonReactive)

    const nonReactiveData = [{ id: 1, name: 'Static' }]

    const nonReactiveTable = await buildTable(holderNonReactive, {
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Name', field: 'name' }
      ],
      data: nonReactiveData,
      reactiveData: false
    })

    nonReactiveData.push({ id: 2, name: 'ShouldNotAppear' })
    await new Promise((resolve) => setTimeout(resolve, 10))

    const nonReactiveCount = nonReactiveTable.getDataCount()

    const holderTree = document.createElement('div')
    holderTree.id = 'reactive-table-tree'
    holderTree.style.width = '600px'
    root.appendChild(holderTree)

    const treeData = [
      {
        id: 1,
        name: 'Root',
        _children: [{ id: 2, name: 'Child1' }]
      }
    ]

    const tableTree = await buildTable(holderTree, {
      columns: [{ title: 'Name', field: 'name' }],
      data: treeData,
      reactiveData: true,
      dataTree: true,
      dataTreeStartExpanded: true
    })

    const rootRow = tableTree.getRow(1)
    const beforeTreeChildren = rootRow.getTreeChildren().length

    const rootRowData = rootRow.getData()
    rootRowData._children.push({ id: 3, name: 'Child2' })
    await new Promise((resolve) => setTimeout(resolve, 25))

    const afterTreeChildren = rootRow.getTreeChildren().length

    return {
      modulePresent: !!table.modules.reactiveData,
      rowCount: tableData.length,
      firstName: tableData[0].name,
      pushEnumerableBeforeDestroy: pushDescriptorBeforeDestroy?.enumerable,
      pushEnumerableAfterDestroy: pushDescriptorAfterDestroy?.enumerable,
      reactiveDataLengthAfterDestroyPush: reactiveData.length,
      nonReactiveCount,
      beforeTreeChildren,
      afterTreeChildren
    }
  })

  expect(result.modulePresent).toBe(true)
  expect(result.rowCount).toBe(2)
  expect(result.firstName).toBe('AliceUpdated')
  expect(result.pushEnumerableBeforeDestroy).toBe(false)
  expect(result.pushEnumerableAfterDestroy).toBe(true)
  expect(result.reactiveDataLengthAfterDestroyPush).toBe(3)
  expect(result.nonReactiveCount).toBe(1)
  expect(result.beforeTreeChildren).toBe(1)
  expect(result.afterTreeChildren).toBe(2)
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
