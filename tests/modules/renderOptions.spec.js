import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('render options', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('renderVertical virtual mode initializes the row renderer', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const build = async (renderVertical) => {
        const holder = document.createElement('div')
        holder.style.width = '600px'
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            height: 200,
            renderVertical,
            data: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` })),
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
          renderVertical: table.options.renderVertical,
          rowRendererName: table.rowManager.renderer?.constructor?.name || ''
        }
      }

      return {
        virtual: await build('virtual'),
        basic: await build('basic')
      }
    })

    expect(result.virtual.renderVertical).toBe('virtual')
    expect(result.basic.renderVertical).toBe('basic')
    expect(result.virtual.rowRendererName).toContain('Virtual')
    expect(result.basic.rowRendererName).toContain('Basic')
  })

  await test.step('renderHorizontal virtual mode initializes the column renderer', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const build = async (renderHorizontal) => {
        const holder = document.createElement('div')
        holder.style.width = '600px'
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            renderHorizontal,
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
          renderHorizontal: table.options.renderHorizontal,
          colRendererName: table.columnManager.renderer?.constructor?.name || ''
        }
      }

      return {
        virtual: await build('virtual'),
        basic: await build('basic')
      }
    })

    expect(result.virtual.renderHorizontal).toBe('virtual')
    expect(result.basic.renderHorizontal).toBe('basic')
    expect(result.virtual.colRendererName).toContain('Virtual')
    expect(result.basic.colRendererName).toContain('Basic')
  })

  await test.step('renderVerticalBuffer sets the pixel buffer around the visible area', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          height: 200,
          renderVertical: 'virtual',
          renderVerticalBuffer: 120,
          data: Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` })),
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

      const renderer = table.rowManager.renderer

      return {
        optionSet: table.options.renderVerticalBuffer,
        rendererBuffer: renderer ? renderer.vDomWindowBuffer : null
      }
    })

    expect(result.optionSet).toBe(120)
    expect(result.rendererBuffer).toBe(120)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
