import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('sort module', async ({ page }) => {
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

    class FakeDateTime {
      constructor(date) {
        this.date = date instanceof Date ? date : new Date(date)
      }

      static now() {
        return new FakeDateTime(new Date('2024-01-01T00:00:00Z'))
      }

      static fromISO(value) {
        return new FakeDateTime(new Date(value))
      }

      static fromFormat(value, format) {
        const str = String(value)

        if (format === 'dd/MM/yyyy') {
          const [day, month, year] = str.split('/').map((item) => parseInt(item, 10))
          return new FakeDateTime(new Date(Date.UTC(year, month - 1, day, 0, 0, 0)))
        }

        if (format === 'HH:mm') {
          const [hours, minutes] = str.split(':').map((item) => parseInt(item, 10))
          return new FakeDateTime(new Date(Date.UTC(1970, 0, 1, hours, minutes, 0)))
        }

        if (format === 'dd/MM/yyyy HH:mm:ss') {
          const [datePart, timePart] = str.split(' ')
          const [day, month, year] = datePart.split('/').map((item) => parseInt(item, 10))
          const [hours, minutes, seconds] = timePart.split(':').map((item) => parseInt(item, 10))
          return new FakeDateTime(new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds)))
        }

        return new FakeDateTime(new Date(str))
      }

      static isDateTime(value) {
        return value instanceof FakeDateTime
      }

      get isValid() {
        return !isNaN(this.date.getTime())
      }

      valueOf() {
        return this.date.getTime()
      }
    }

    window.luxon = { DateTime: FakeDateTime }

    const root = document.getElementById('smoke-root')

    const holder = document.createElement('div')
    holder.id = 'sort-all-table'
    holder.style.width = '1200px'
    root.appendChild(holder)

    const table = await buildTable(holder, {
      height: 260,
      data: [
        {
          id: 1,
          num: 10,
          str: 'beta',
          date: '02/01/2024',
          time: '10:00',
          datetime: '02/01/2024 10:00:00',
          bool: true,
          arrayVal: [1, 2],
          existsVal: 'x',
          alphanum: 'a10'
        },
        {
          id: 2,
          num: 2,
          str: 'alpha',
          date: '01/01/2024',
          time: '09:30',
          datetime: '01/01/2024 09:00:00',
          bool: false,
          arrayVal: [1],
          existsVal: '',
          alphanum: 'a2'
        },
        {
          id: 3,
          num: 1,
          str: 'gamma',
          date: '03/01/2024',
          time: '12:00',
          datetime: '03/01/2024 08:00:00',
          bool: true,
          arrayVal: [1, 2, 3],
          alphanum: 'a1'
        }
      ],
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Number', field: 'num', sorter: 'number' },
        { title: 'String', field: 'str', sorter: 'string' },
        { title: 'Date', field: 'date', sorter: 'date' },
        { title: 'Time', field: 'time', sorter: 'time' },
        { title: 'Datetime', field: 'datetime', sorter: 'datetime' },
        { title: 'Boolean', field: 'bool', sorter: 'boolean' },
        { title: 'Array', field: 'arrayVal', sorter: 'array' },
        { title: 'Exists', field: 'existsVal', sorter: 'exists' },
        { title: 'Alphanum', field: 'alphanum', sorter: 'alphanum' }
      ]
    })

    const sortAndIds = (field) => {
      table.modules.sort.userSetSort(field, 'asc')
      return table.getData('active').map((row) => row.id)
    }

    const holderInitial = document.createElement('div')
    holderInitial.style.width = '600px'
    root.appendChild(holderInitial)

    const sorterParamSeen = { value: false }

    const tableInitial = await buildTable(holderInitial, {
      data: [
        { id: 10, value: 2 },
        { id: 11, value: 1 }
      ],
      initialSort: [{ column: 'value', dir: 'desc' }],
      columns: [
        { title: 'ID', field: 'id' },
        {
          title: 'Value',
          field: 'value',
          sorter(a, b, _aRow, _bRow, _column, _dir, params) {
            sorterParamSeen.value = !!params && params.multiplier === 2
            return a * params.multiplier - b * params.multiplier
          },
          sorterParams: { multiplier: 2 }
        }
      ]
    })

    const initialSortOrder = tableInitial.getData('active').map((row) => row.id)
    const sortersBeforeClear = tableInitial.getSorters().map((sorter) => ({ field: sorter.field, dir: sorter.dir }))
    tableInitial.clearSort()
    const sortersAfterClear = tableInitial.getSorters().length

    const holderIcon = document.createElement('div')
    holderIcon.style.width = '600px'
    root.appendChild(holderIcon)

    const tableIcon = await buildTable(holderIcon, {
      headerSortClickElement: 'icon',
      headerSortElement: '<span class="custom-sort-arrow">↑</span>',
      data: [
        { id: 1, value: 2 },
        { id: 2, value: 1 }
      ],
      columns: [
        { title: 'ID', field: 'id' },
        {
          title: 'Value',
          field: 'value',
          sorter: 'number',
          headerSortStartingDir: 'desc',
          headerSortTristate: true
        }
      ]
    })

    const valueHeader = holderIcon.querySelector('.tabulator-col[tabulator-field="value"]')
    const iconEl = valueHeader.querySelector('.tabulator-col-sorter')

    valueHeader.click()
    const iconSortAfterHeaderClick = tableIcon.getSorters().map((sorter) => sorter.dir)

    iconEl.click()
    const iconSortAfterFirstIconClick = tableIcon.getSorters().map((sorter) => sorter.dir)

    iconEl.click()
    const iconSortAfterSecondIconClick = tableIcon.getSorters().map((sorter) => sorter.dir)

    iconEl.click()
    const iconSortAfterThirdIconClick = tableIcon.getSorters().length

    const holderMulti = document.createElement('div')
    holderMulti.style.width = '600px'
    root.appendChild(holderMulti)

    const tableMulti = await buildTable(holderMulti, {
      columnHeaderSortMulti: false,
      data: [
        { id: 1, a: 2, b: 1 },
        { id: 2, a: 1, b: 2 }
      ],
      columns: [
        { title: 'A', field: 'a', sorter: 'number' },
        { title: 'B', field: 'b', sorter: 'number' }
      ]
    })

    const aHeader = holderMulti.querySelector('.tabulator-col[tabulator-field="a"]')
    const bHeader = holderMulti.querySelector('.tabulator-col[tabulator-field="b"]')
    aHeader.click()
    bHeader.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))

    const multiSortFields = tableMulti.getSorters().map((sorter) => sorter.field)

    const buildReverseTable = async (sortOrderReverse) => {
      const reverseHolder = document.createElement('div')
      reverseHolder.style.width = '600px'
      root.appendChild(reverseHolder)

      const reverseTable = await buildTable(reverseHolder, {
        sortOrderReverse,
        data: [
          { id: 1, primary: 1, secondary: 2 },
          { id: 2, primary: 2, secondary: 1 },
          { id: 3, primary: 1, secondary: 1 }
        ],
        columns: [
          { title: 'Primary', field: 'primary', sorter: 'number' },
          { title: 'Secondary', field: 'secondary', sorter: 'number' }
        ]
      })

      reverseTable.setSort([
        { column: 'primary', dir: 'asc' },
        { column: 'secondary', dir: 'asc' }
      ])

      return reverseTable.getData('active').map((row) => row.id)
    }

    const defaultOrderReverseFalse = await buildReverseTable(false)
    const defaultOrderReverseTrue = await buildReverseTable(true)

    const holderRemote = document.createElement('div')
    holderRemote.style.width = '600px'
    root.appendChild(holderRemote)

    let remoteParams = null

    const tableRemote = await buildTable(holderRemote, {
      sortMode: 'remote',
      ajaxURL: '/remote-sort',
      ajaxRequestFunc(url, _config, params) {
        if (url === '/remote-sort') {
          remoteParams = { ...params }
        }

        return Promise.resolve([
          { id: 1, score: 2 },
          { id: 2, score: 1 }
        ])
      },
      columns: [
        { title: 'ID', field: 'id' },
        { title: 'Score', field: 'score', sorter: 'number' }
      ]
    })

    tableRemote.setSort('score', 'asc')
    await new Promise((resolve) => setTimeout(resolve, 25))

    return {
      modulePresent: !!table.modules.sort,
      numberOrder: sortAndIds('num'),
      stringOrder: sortAndIds('str'),
      dateOrder: sortAndIds('date'),
      timeOrder: sortAndIds('time'),
      datetimeOrder: sortAndIds('datetime'),
      booleanOrder: sortAndIds('bool'),
      arrayOrder: sortAndIds('arrayVal'),
      existsOrder: sortAndIds('existsVal'),
      alphanumOrder: sortAndIds('alphanum'),
      initialSortOrder,
      sortersBeforeClear,
      sortersAfterClear,
      sorterParamSeen: sorterParamSeen.value,
      hasCustomSortArrow: !!holderIcon.querySelector('.custom-sort-arrow'),
      iconSortAfterHeaderClick,
      iconSortAfterFirstIconClick,
      iconSortAfterSecondIconClick,
      iconSortAfterThirdIconClick,
      multiSortFields,
      defaultOrderReverseFalse,
      defaultOrderReverseTrue,
      remoteSortParams: remoteParams
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
  expect(result.modulePresent).toBe(true)

  expect(result.numberOrder).toEqual([3, 2, 1])
  expect(result.stringOrder).toEqual([2, 1, 3])
  expect(result.dateOrder).toEqual([2, 1, 3])
  expect(result.timeOrder).toEqual([2, 1, 3])
  expect(result.datetimeOrder).toEqual([2, 1, 3])
  expect(result.booleanOrder).toEqual([2, 1, 3])
  expect(result.arrayOrder).toEqual([3, 1, 2])
  expect(result.existsOrder).toEqual([1, 2, 3])
  expect(result.alphanumOrder).toEqual([3, 2, 1])

  expect(result.initialSortOrder).toEqual([10, 11])
  expect(result.sortersBeforeClear).toEqual([{ field: 'value', dir: 'desc' }])
  expect(result.sortersAfterClear).toBe(0)
  expect(result.sorterParamSeen).toBe(true)

  expect(result.hasCustomSortArrow).toBe(true)
  expect(result.iconSortAfterHeaderClick).toEqual([])
  expect(result.iconSortAfterFirstIconClick).toEqual(['desc'])
  expect(result.iconSortAfterSecondIconClick).toEqual(['asc'])
  expect(result.iconSortAfterThirdIconClick).toBe(0)

  expect(result.multiSortFields).toEqual(['b'])
  expect(result.defaultOrderReverseFalse).toEqual([3, 2, 1])
  expect(result.defaultOrderReverseTrue).toEqual([3, 1, 2])
  expect(result.remoteSortParams?.sort).toEqual([{ field: 'score', dir: 'asc' }])
})
