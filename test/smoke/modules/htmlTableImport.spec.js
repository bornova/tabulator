import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

async function checkHtmlImportBasicParsing(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const tableEl = document.createElement('table')

    tableEl.innerHTML = `
			<thead>
				<tr>
					<th>ID</th>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>1</td><td>Alice</td></tr>
				<tr><td>2</td><td>Bob</td></tr>
			</tbody>
		`

    root.appendChild(tableEl)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(tableEl, {})

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const columns = table.getColumnDefinitions()
    const data = table.getData()

    return {
      modulePresent: !!table.modules.htmlTableImport,
      fields: columns.map((column) => column.field),
      data
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.modulePresent).toBe(true)
  expect(result.fields).toEqual(['id', 'name'])
  expect(result.data).toEqual([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' }
  ])
}

async function checkHtmlImportTableAttributes(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const tableEl = document.createElement('table')

    tableEl.setAttribute('tabulator-layout', 'fitColumns')
    tableEl.setAttribute('tabulator-selectablerows', 'true')

    tableEl.innerHTML = `
			<thead>
				<tr>
					<th>ID</th>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>1</td><td>Alice</td></tr>
			</tbody>
		`

    root.appendChild(tableEl)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(tableEl, {})

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    return {
      layout: table.options.layout,
      selectableRows: table.options.selectableRows
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.layout).toBe('fitColumns')
  expect(result.selectableRows).toBe(true)
}

async function checkHtmlImportHeaderAttributes(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const tableEl = document.createElement('table')

    tableEl.innerHTML = `
			<thead>
				<tr>
					<th width="140" tabulator-field="identifier" tabulator-hozalign="right">ID</th>
					<th tabulator-visible="false">Name</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>1</td><td>Alice</td></tr>
			</tbody>
		`

    root.appendChild(tableEl)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(tableEl, {})

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const definitions = table.getColumnDefinitions()

    return {
      definitions
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.definitions[0].field).toBe('identifier')
  expect(result.definitions[0].hozAlign).toBe('right')
  expect(result.definitions[0].width).toBe('140')
  expect(result.definitions[1].visible).toBe(false)
}

async function checkHtmlImportPredefinedColumnsMerge(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const tableEl = document.createElement('table')

    tableEl.innerHTML = `
			<thead>
				<tr>
					<th width="120">Name</th>
					<th>Age</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>Alice</td><td>20</td></tr>
			</tbody>
		`

    root.appendChild(tableEl)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(tableEl, {
        columns: [
          { title: 'Name', field: 'full_name', width: 200 },
          { title: 'Age', field: 'age_years' }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const definitions = table.getColumnDefinitions()
    const row = table.getData()[0]

    return {
      definitions,
      row
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.definitions.map((column) => column.field)).toEqual(['full_name', 'age_years'])
  expect(result.definitions[0].width).toBe(200)
  expect(result.row).toEqual({ full_name: 'Alice', age_years: '20', id: 0 })
}

async function checkHtmlImportIndexHandling(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')

    const tableWithIndexField = document.createElement('table')
    tableWithIndexField.innerHTML = `
			<thead>
				<tr>
					<th tabulator-field="id">ID</th>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>10</td><td>Alice</td></tr>
				<tr><td>11</td><td>Bob</td></tr>
			</tbody>
		`

    const tableWithoutIndexField = document.createElement('table')
    tableWithoutIndexField.innerHTML = `
			<thead>
				<tr>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>Cara</td></tr>
				<tr><td>Dan</td></tr>
			</tbody>
		`

    root.appendChild(tableWithIndexField)
    root.appendChild(tableWithoutIndexField)

    const first = await new Promise((resolve) => {
      const instance = new Tabulator(tableWithIndexField, {})

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const second = await new Promise((resolve) => {
      const instance = new Tabulator(tableWithoutIndexField, {})

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    return {
      existingIndexData: first.getData(),
      generatedIndexData: second.getData()
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.existingIndexData).toEqual([
    { id: '10', name: 'Alice' },
    { id: '11', name: 'Bob' }
  ])
  expect(result.generatedIndexData).toEqual([
    { id: 0, name: 'Cara' },
    { id: 1, name: 'Dan' }
  ])
}

async function checkHtmlImportTabulatorIndexAttribute(page) {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const tableEl = document.createElement('table')

    tableEl.setAttribute('tabulator-index', 'rowId')

    tableEl.innerHTML = `
			<thead>
				<tr>
          <th>Name</th>
				</tr>
			</thead>
			<tbody>
        <tr><td>Alice</td></tr>
        <tr><td>Bob</td></tr>
			</tbody>
		`

    root.appendChild(tableEl)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(tableEl, {})

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    return {
      data: table.getData()
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  expect(result.data).toEqual([
    { rowId: 0, name: 'Alice' },
    { rowId: 1, name: 'Bob' }
  ])
}

test('htmlTableImport module options smoke', async ({ page }) => {
  await test.step('basic parsing', async () => {
    await checkHtmlImportBasicParsing(page)
  })

  await test.step('table attributes extraction', async () => {
    await checkHtmlImportTableAttributes(page)
  })

  await test.step('header attributes extraction', async () => {
    await checkHtmlImportHeaderAttributes(page)
  })

  await test.step('predefined columns merge', async () => {
    await checkHtmlImportPredefinedColumnsMerge(page)
  })

  await test.step('index handling', async () => {
    await checkHtmlImportIndexHandling(page)
  })

  await test.step('tabulator-index attribute', async () => {
    await checkHtmlImportTabulatorIndexAttribute(page)
  })
})
