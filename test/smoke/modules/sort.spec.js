import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('sort module smoke - all default sorters', async ({ page }) => {
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

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
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

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const sortAndIds = (field) => {
      table.modules.sort.userSetSort(field, 'asc')
      return table.getData('active').map((row) => row.id)
    }

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
      alphanumOrder: sortAndIds('alphanum')
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
})
