import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('mutator module options smoke', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('mutator, mutatorParams, mutatorData, and mutatorDataParams are applied', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, generic: 'g', dataOnly: 'd' }],
          columns: [
            { title: 'ID', field: 'id' },
            {
              title: 'Generic',
              field: 'generic',
              mutator(value, data, type, params) {
                return `${value}-${type}-${params.tag}`
              },
              mutatorParams(value, data, type) {
                return { tag: `GEN-${type}` }
              }
            },
            {
              title: 'DataOnly',
              field: 'dataOnly',
              mutatorData(value, data, type, params) {
                return `${value}-${params.tag}`
              },
              mutatorDataParams(value, data, type) {
                return { tag: `DATA-${type}` }
              }
            }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const transformed = table.modules.mutator.transformRow({ generic: 'g', dataOnly: 'd' }, 'data')

      return {
        modulePresent: !!table.modules.mutator,
        generic: transformed.generic,
        dataOnly: transformed.dataOnly
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.generic).toBe('g-data-GEN-data')
    expect(result.dataOnly).toBe('d-DATA-data')
  })

  await test.step('mutatorEdit and mutatorEditParams are applied for edit transforms', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, editable: 'old' }],
          columns: [
            { title: 'ID', field: 'id' },
            {
              title: 'Editable',
              field: 'editable',
              mutatorEdit(value, data, type, params) {
                return `${value}-${params.tag}`
              },
              mutatorEditParams: { tag: 'EDIT' }
            }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const row = table.rowManager.getRows()[0]
      const cell = row.getCell('editable')
      const transformed = table.modules.mutator.transformCell(cell, 'new')

      return {
        transformed
      }
    })

    expect(result.transformed).toBe('new-EDIT')
  })

  await test.step('mutatorClipboard and mutatorClipboardParams are applied', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, clip: 'c' }],
          columns: [
            { title: 'ID', field: 'id' },
            {
              title: 'Clip',
              field: 'clip',
              mutatorClipboard(value, data, type, params) {
                return `${value}-${params.tag}`
              },
              mutatorClipboardParams: { tag: 'CLIP' }
            }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const transformed = table.modules.mutator.transformRow({ clip: 'c' }, 'clipboard')

      return {
        transformed: transformed.clip
      }
    })

    expect(result.transformed).toBe('c-CLIP')
  })

  await test.step('mutatorImport and mutatorImportParams are applied', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, imp: 'i' }],
          columns: [
            { title: 'ID', field: 'id' },
            {
              title: 'Imp',
              field: 'imp',
              mutatorImport(value, data, type, params) {
                return `${value}-${params.tag}`
              },
              mutatorImportParams: { tag: 'IMPORT' }
            }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const transformed = table.modules.mutator.transformRow({ imp: 'i' }, 'import')

      return {
        transformed: transformed.imp
      }
    })

    expect(result.transformed).toBe('i-IMPORT')
  })

  await test.step('mutateLink retriggers linked cell setValue', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, source: 10, target: 20 }],
          columns: [
            { title: 'ID', field: 'id' },
            { title: 'Source', field: 'source', mutateLink: 'target' },
            { title: 'Target', field: 'target' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const row = table.rowManager.getRows()[0]
      const sourceCell = row.getCell('source')
      const targetCell = row.getCell('target')
      const calls = []

      targetCell.setValue = (...args) => {
        calls.push(args)
      }

      table.modules.mutator.mutateLink(sourceCell)

      return {
        callCount: calls.length,
        firstCallArgs: calls[0] || []
      }
    })

    expect(result.callCount).toBe(1)
    expect(result.firstCallArgs[1]).toBe(true)
    expect(result.firstCallArgs[2]).toBe(true)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
