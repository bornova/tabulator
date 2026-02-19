import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('print module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('printAsHtml enables before/after print event handlers', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          printAsHtml: true,
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
        beforeprintHandler: !!table.modules.print.beforeprintEventHandler,
        afterprintHandler: !!table.modules.print.afterprintEventHandler
      }
    })

    expect(result.beforeprintHandler).toBe(true)
    expect(result.afterprintHandler).toBe(true)
  })

  await test.step('printHeader and printFooter are rendered in fullscreen print', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      let headerContent = null
      let footerContent = null

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          printHeader: 'HEADER',
          printFooter: 'FOOTER',
          printFormatter(el, tableEl) {
            headerContent = el.querySelector('.tabulator-print-header')?.textContent || null
            footerContent = el.querySelector('.tabulator-print-footer')?.textContent || null
          },
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

      table.print()

      return { header: headerContent, footer: footerContent }
    })

    expect(result.header).toBeDefined()
    expect(result.header).toBe('HEADER')
    expect(result.footer).toBeDefined()
    expect(result.footer).toBe('FOOTER')
  })

  await test.step('printStyled toggles print styling', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          printStyled: false,
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

      let styledFlag = null
      const originalGenerateTable = table.modules.export.generateTable
      table.modules.export.generateTable = function (config, styled, range, mode) {
        styledFlag = styled
        return originalGenerateTable.call(this, config, styled, range, mode)
      }

      table.print()

      return { styledFlag }
    })

    expect(result.styledFlag).toBe(false)
  })

  await test.step('printRowRange and printConfig flow into export, and titlePrint is used in printed header', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          printRowRange: 'active',
          printConfig: { columnHeaders: true, rowHeaders: true },
          data: [
            { id: 1, name: 'alice' },
            { id: 2, name: 'bob' }
          ],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Name', field: 'name', titlePrint: 'Printed Name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      let captured = null
      let printedHeaderText = ''
      const originalGenerateTable = table.modules.export.generateTable
      const originalPrint = window.print

      table.modules.export.generateTable = function (config, styled, range, mode) {
        captured = {
          config: { ...config },
          styled,
          range,
          mode
        }

        const tableEl = originalGenerateTable.call(this, config, styled, range, mode)
        printedHeaderText = Array.from(tableEl.querySelectorAll('thead th'))
          .map((th) => th.textContent.trim())
          .join('|')

        return tableEl
      }

      window.print = () => {}

      table.print(undefined, undefined, undefined)

      window.print = originalPrint

      return {
        captured,
        printedHeaderText
      }
    })

    expect(result.captured.config).toEqual({ columnHeaders: true, rowHeaders: true })
    expect(result.captured.range).toBe('active')
    expect(result.captured.mode).toBe('print')
    expect(result.printedHeaderText.includes('Printed Name')).toBe(true)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
