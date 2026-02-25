import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('format module', async ({ page }) => {
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
        return new FakeDateTime(new Date('2024-01-10T00:00:00Z'))
      }

      static fromISO(value) {
        return new FakeDateTime(new Date(value))
      }

      static fromFormat(value) {
        return new FakeDateTime(new Date(String(value).replace(' ', 'T')))
      }

      static isDateTime(value) {
        return value instanceof FakeDateTime
      }

      get isValid() {
        return !isNaN(this.date.getTime())
      }

      setZone() {
        return this
      }

      toFormat() {
        const pad = (num) => String(num).padStart(2, '0')
        return `${this.date.getUTCFullYear()}-${pad(this.date.getUTCMonth() + 1)}-${pad(this.date.getUTCDate())} ${pad(this.date.getUTCHours())}:${pad(this.date.getUTCMinutes())}:${pad(this.date.getUTCSeconds())}`
      }

      diff(other, unit) {
        const diffMs = this.date.getTime() - other.date.getTime()
        const unitMap = {
          milliseconds: 1,
          seconds: 1000,
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000
        }
        const divisor = unitMap[unit] || unitMap.days
        const value = Math.floor(diffMs / divisor)

        return {
          [unit]: value,
          toHuman() {
            return `${Math.abs(value)} ${unit}`
          }
        }
      }
    }

    window.luxon = { DateTime: FakeDateTime }

    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.id = 'format-all-table'
    holder.style.width = '1400px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        height: 260,
        data: [
          {
            id: 1,
            handle: 1,
            plain: '<b>x</b>',
            html: '<b>bold</b>',
            textarea: 'line1\nline2',
            money: 1234.5,
            link: '/docs',
            image: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
            tick: true,
            datetime: '2024-01-02T03:04:05Z',
            datediff: '2024-01-12T00:00:00Z',
            lookup: 'A',
            star: 3,
            traffic: 70,
            progress: 40,
            color: '#ff0000',
            toggle: true,
            adaptable: true,
            array: [{ name: 'one' }, { name: 'two' }],
            json: { a: 1 },
            exportVal: 5
          }
        ],
        columns: [
          { title: 'ID', field: 'id', formatter: 'rownum' },
          { title: 'Plain', field: 'plain', formatter: 'plaintext' },
          { title: 'HTML', field: 'html', formatter: 'html' },
          { title: 'Textarea', field: 'textarea', formatter: 'textarea' },
          { title: 'Money', field: 'money', formatter: 'money', formatterParams: { symbol: '$' } },
          { title: 'Link', field: 'link', formatter: 'link', formatterParams: { urlPrefix: 'https://example.com' } },
          {
            title: 'Image',
            field: 'image',
            formatter: 'image',
            formatterParams: { width: 12, height: 12 }
          },
          { title: 'TickCross', field: 'tick', formatter: 'tickCross' },
          {
            title: 'Datetime',
            field: 'datetime',
            formatter: 'datetime',
            formatterParams: { inputFormat: 'iso', outputFormat: 'yyyy-MM-dd HH:mm:ss' }
          },
          {
            title: 'DateDiff',
            field: 'datediff',
            formatter: 'datetimediff',
            formatterParams: { inputFormat: 'iso', unit: 'days', suffix: 'days' }
          },
          { title: 'Lookup', field: 'lookup', formatter: 'lookup', formatterParams: { A: 'Alpha' } },
          { title: 'Star', field: 'star', formatter: 'star' },
          { title: 'Traffic', field: 'traffic', formatter: 'traffic' },
          { title: 'Progress', field: 'progress', formatter: 'progress' },
          { title: 'Color', field: 'color', formatter: 'color' },
          { title: 'ButtonTick', field: 'tick', formatter: 'buttonTick' },
          { title: 'ButtonCross', field: 'tick', formatter: 'buttonCross' },
          {
            title: 'Toggle',
            field: 'toggle',
            formatter: 'toggle',
            formatterParams: { onValue: true, offValue: false }
          },
          { title: 'Handle', field: 'handle', formatter: 'handle' },
          { title: 'Adaptable', field: 'adaptable', formatter: 'adaptable' },
          {
            title: 'Array',
            field: 'array',
            formatter: 'array',
            formatterParams: { valueMap: 'name', delimiter: '|' }
          },
          {
            title: 'JSON',
            field: 'json',
            formatter: 'json',
            formatterParams: { multiline: false, indent: 0 }
          },
          {
            title: 'Export',
            field: 'exportVal',
            titleFormatter(cell, params) {
              return `${params.prefix}${cell.getValue()}`
            },
            titleFormatterParams: { prefix: 'TF:' },
            formatter: 'plaintext',
            formatterPrint(cell, params) {
              return `P:${cell.getValue() * params.multiplier}`
            },
            formatterPrintParams: { multiplier: 2 },
            formatterClipboard(cell, params) {
              return `C:${cell.getValue() * params.multiplier}`
            },
            formatterClipboardParams: { multiplier: 3 },
            formatterHtmlOutput(cell, params) {
              return `H:${cell.getValue() * params.multiplier}`
            },
            formatterHtmlOutputParams: { multiplier: 4 }
          }
        ]
      })

      const timeout = setTimeout(() => resolve(instance), 1500)

      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const firstRow = holder.querySelector('.tabulator-row')

    const cellFor = (field) => firstRow.querySelector(`.tabulator-cell[tabulator-field="${field}"]`)

    const plainCell = cellFor('plain')
    const htmlCell = cellFor('html')
    const textareaCell = cellFor('textarea')
    const moneyCell = cellFor('money')
    const linkCell = cellFor('link')
    const imageCell = cellFor('image')
    const tickCell = cellFor('tick')
    const datetimeCell = cellFor('datetime')
    const dateDiffCell = cellFor('datediff')
    const lookupCell = cellFor('lookup')
    const starCell = cellFor('star')
    const trafficCell = cellFor('traffic')
    const progressCell = cellFor('progress')
    const colorCell = cellFor('color')
    const toggleCell = cellFor('toggle')
    const handleCell = cellFor('handle')
    const adaptableCell = cellFor('adaptable')
    const arrayCell = cellFor('array')
    const jsonCell = cellFor('json')
    const exportHeader = holder.querySelector('.tabulator-col[tabulator-field="exportVal"] .tabulator-col-title')

    const extractExportCell = (tableEl) => {
      const headerCells = Array.from(tableEl.querySelectorAll('thead tr:last-child th')).map((th) =>
        th.textContent.trim()
      )
      const exportIndex = headerCells.findIndex((title) => title === 'Export' || title === 'TF:Export')

      if (exportIndex < 0) {
        return null
      }

      const bodyRow = tableEl.querySelector('tbody tr')
      if (!bodyRow) {
        return null
      }

      const bodyCells = Array.from(bodyRow.querySelectorAll('td'))
      return bodyCells[exportIndex]?.textContent.trim() || null
    }

    const printTable = table.modules.export.generateTable({}, false, 'active', 'print')
    const clipboardTable = table.modules.export.generateTable({}, false, 'active', 'clipboard')
    const htmlOutputTable = table.modules.export.generateTable({}, false, 'active', 'htmlOutput')

    return {
      modulePresent: !!table.modules.format,
      plaintextEscaped: !plainCell.querySelector('b') && plainCell.textContent.includes('<b>x</b>'),
      htmlRendered: !!htmlCell.querySelector('b'),
      textareaWrapped: textareaCell.classList.contains('tabulator-cell-pre-wrap'),
      moneyFormatted: moneyCell.textContent.includes('$1,234.50'),
      linkRendered: !!linkCell.querySelector('a[href="https://example.com/docs"]'),
      imageRendered: !!imageCell.querySelector('img'),
      tickCrossRendered: !!tickCell.querySelector('svg'),
      datetimeRendered: datetimeCell.textContent.trim().length > 0,
      dateDiffRendered: dateDiffCell.textContent.includes('days'),
      lookupRendered: lookupCell.textContent.trim() === 'Alpha',
      starRendered: starCell.querySelectorAll('svg').length === 5,
      trafficRendered: !!trafficCell.querySelector('.tabulator-traffic-light'),
      progressRendered: !!progressCell.querySelector('[data-max][data-min]'),
      colorRendered: window.getComputedStyle(colorCell).backgroundColor === 'rgb(255, 0, 0)',
      buttonTickRendered: !!holder.querySelector('.tabulator-row .tabulator-cell svg path[fill="#2DC214"]'),
      buttonCrossRendered: !!holder.querySelector('.tabulator-row .tabulator-cell svg path[fill="#CE1515"]'),
      toggleRendered: !!toggleCell.querySelector('.tabulator-toggle'),
      handleRendered:
        handleCell.classList.contains('tabulator-row-handle') &&
        !!handleCell.querySelector('.tabulator-row-handle-bar'),
      adaptableRendered: !!adaptableCell.querySelector('svg'),
      arrayRendered: arrayCell.textContent.trim() === 'one|two',
      jsonRendered: /"a"\s*:\s*1/.test(jsonCell.textContent),
      titleFormatterRendered: exportHeader?.textContent.trim() === 'TF:Export',
      printExportValue: extractExportCell(printTable),
      clipboardExportValue: extractExportCell(clipboardTable),
      htmlOutputExportValue: extractExportCell(htmlOutputTable)
    }
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  expect(result.modulePresent).toBe(true)
  expect(result.plaintextEscaped).toBe(true)
  expect(result.htmlRendered).toBe(true)
  expect(result.textareaWrapped).toBe(true)
  expect(result.moneyFormatted).toBe(true)
  expect(result.linkRendered).toBe(true)
  expect(result.imageRendered).toBe(true)
  expect(result.tickCrossRendered).toBe(true)
  expect(result.datetimeRendered).toBe(true)
  expect(result.dateDiffRendered).toBe(true)
  expect(result.lookupRendered).toBe(true)
  expect(result.starRendered).toBe(true)
  expect(result.trafficRendered).toBe(true)
  expect(result.progressRendered).toBe(true)
  expect(result.colorRendered).toBe(true)
  expect(result.buttonTickRendered).toBe(true)
  expect(result.buttonCrossRendered).toBe(true)
  expect(result.toggleRendered).toBe(true)
  expect(result.handleRendered).toBe(true)
  expect(result.adaptableRendered).toBe(true)
  expect(result.arrayRendered).toBe(true)
  expect(result.jsonRendered).toBe(true)
  expect(result.titleFormatterRendered).toBe(true)
  expect(result.printExportValue).toBe('P:10')
  expect(result.clipboardExportValue).toBe('C:15')
  expect(result.htmlOutputExportValue).toBe('H:20')
})
