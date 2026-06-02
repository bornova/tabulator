import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('table config options', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('placeholder shows custom text when table has no data', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          placeholder: 'NO DATA AVAILABLE',
          data: [],
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

      const el = holder.querySelector('.tabulator-placeholder')

      return {
        visible: !!el,
        text: el?.textContent?.trim() || ''
      }
    })

    expect(result.visible).toBe(true)
    expect(result.text).toBe('NO DATA AVAILABLE')
  })

  await test.step('footerElement appends custom HTML to the table footer', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          footerElement: '<div class="custom-footer-test">FOOTER CONTENT</div>',
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

      const footerEl = holder.querySelector('.custom-footer-test')

      return {
        visible: !!footerEl,
        text: footerEl?.textContent || ''
      }
    })

    expect(result.visible).toBe(true)
    expect(result.text).toBe('FOOTER CONTENT')
  })

  await test.step('textDirection sets the dir attribute on the table element', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const build = async (textDirection) => {
        const holder = document.createElement('div')
        holder.style.width = '600px'
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            textDirection,
            data: [{ id: 1 }],
            columns: [{ title: 'ID', field: 'id' }]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        return {
          hasRtlClass: table.element.classList.contains('tabulator-rtl'),
          hasLtrClass: table.element.classList.contains('tabulator-ltr')
        }
      }

      return {
        rtl: await build('rtl'),
        ltr: await build('ltr'),
        auto: await build('auto')
      }
    })

    expect(result.rtl.hasRtlClass).toBe(true)
    expect(result.rtl.hasLtrClass).toBe(false)
    expect(result.ltr.hasLtrClass).toBe(true)
    expect(result.ltr.hasRtlClass).toBe(false)
    // 'auto' uses computed style; in test env direction defaults to ltr so neither class applied
    expect(result.auto.hasRtlClass).toBe(false)
  })

  await test.step('headerVisible false hides the column header bar', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const build = async (headerVisible) => {
        const holder = document.createElement('div')
        holder.style.width = '600px'
        root.appendChild(holder)

        await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            headerVisible,
            data: [{ id: 1 }],
            columns: [{ title: 'ID', field: 'id' }]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        const headerEl = holder.querySelector('.tabulator-header')
        return getComputedStyle(headerEl).display
      }

      return {
        visible: await build(true),
        hidden: await build(false)
      }
    })

    expect(result.visible).not.toBe('none')
    expect(result.hidden).toBe('none')
  })

  await test.step('columnDefaults applies default properties to all columns', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          columnDefaults: {
            headerSort: false,
            resizable: false
          },
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name', headerSort: true }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const idDef = table.getColumn('id').getDefinition()
      const nameDef = table.getColumn('name').getDefinition()

      return {
        idHeaderSort: idDef.headerSort,
        idResizable: idDef.resizable,
        nameHeaderSort: nameDef.headerSort,
        nameResizable: nameDef.resizable
      }
    })

    // id column inherits defaults
    expect(result.idHeaderSort).toBe(false)
    expect(result.idResizable).toBe(false)
    // name column overrides headerSort but inherits resizable
    expect(result.nameHeaderSort).toBe(true)
    expect(result.nameResizable).toBe(false)
  })

  await test.step('nestedFieldSeparator uses custom separator for nested data fields', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          nestedFieldSeparator: '->',
          data: [{ id: 1, address: { city: 'Boston' } }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'City', field: 'address->city' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const row = table.getRows()[0]
      const cityCell = row.getCell('address->city')

      return {
        cityValue: cityCell ? cityCell.getValue() : null
      }
    })

    expect(result.cityValue).toBe('Boston')
  })

  await test.step('columnHeaderVertAlign sets vertical-align class on all header cells', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          columnHeaderVertAlign: 'bottom',
          data: [{ id: 1 }],
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

      const headerCells = Array.from(holder.querySelectorAll('.tabulator-col'))
      // columnHeaderVertAlign sets style.justifyContent on each column element
      // 'bottom' maps to 'flex-end' via mapFlexAlignment
      const allHaveBottomAlign = headerCells.every((cell) => cell.style.justifyContent === 'flex-end')

      return {
        optionSet: table.options.columnHeaderVertAlign,
        allHaveBottomAlign,
        cellCount: headerCells.length
      }
    })

    expect(result.optionSet).toBe('bottom')
    expect(result.cellCount).toBeGreaterThan(0)
    expect(result.allHaveBottomAlign).toBe(true)
  })

  await test.step('index option sets the field used for row lookup by key', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          index: 'name',
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

      const row = table.getRow('alice')

      return {
        rowFound: !!row,
        rowData: row ? row.getData() : null,
        indexField: table.options.index
      }
    })

    expect(result.indexField).toBe('name')
    expect(result.rowFound).toBe(true)
    expect(result.rowData.name).toBe('alice')
  })

  await test.step('autoColumnsDefinitions modifies auto-generated column definitions', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          autoColumns: true,
          autoColumnsDefinitions(definitions) {
            return definitions.map((def) => ({ ...def, headerSort: false }))
          },
          data: [{ id: 1, name: 'alice' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const columns = table.getColumns()
      const allNoSort = columns.every((col) => col.getDefinition().headerSort === false)

      return {
        columnCount: columns.length,
        allNoSort
      }
    })

    expect(result.columnCount).toBeGreaterThan(0)
    expect(result.allNoSort).toBe(true)
  })

  await test.step('validationMode blocking option is stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const build = async (validationMode) => {
        const holder = document.createElement('div')
        holder.style.width = '600px'
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            validationMode,
            data: [{ id: 1, value: 10 }],
            columns: [
              { title: 'ID', field: 'id' },
              { title: 'Value', field: 'value', editor: 'number', validator: 'min:5' }
            ]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        return table.options.validationMode
      }

      return {
        blocking: await build('blocking'),
        highlight: await build('highlight')
      }
    })

    expect(result.blocking).toBe('blocking')
    expect(result.highlight).toBe('highlight')
  })

  await test.step('scrollToColumnPosition and scrollToColumnIfVisible are stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '400px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          scrollToColumnPosition: 'center',
          scrollToColumnIfVisible: false,
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id', width: 150 },
            { title: 'Name', field: 'name', width: 150 }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        scrollToColumnPosition: table.options.scrollToColumnPosition,
        scrollToColumnIfVisible: table.options.scrollToColumnIfVisible
      }
    })

    expect(result.scrollToColumnPosition).toBe('center')
    expect(result.scrollToColumnIfVisible).toBe(false)
  })

  await test.step('dataSendParams and dataReceiveParams options are stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          dataSendParams: { sort: 'orderBy', filter: 'where' },
          dataReceiveParams: { data: 'rows', total: 'count' },
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
        dataSendParams: table.options.dataSendParams,
        dataReceiveParams: table.options.dataReceiveParams
      }
    })

    expect(result.dataSendParams).toEqual({ sort: 'orderBy', filter: 'where' })
    expect(result.dataReceiveParams).toEqual({ data: 'rows', total: 'count' })
  })

  await test.step('popupContainer option is stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          popupContainer: 'body',
          data: [{ id: 1 }],
          columns: [{ title: 'ID', field: 'id' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        popupContainer: table.options.popupContainer
      }
    })

    expect(result.popupContainer).toBe('body')
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
