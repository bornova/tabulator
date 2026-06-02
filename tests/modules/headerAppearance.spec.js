import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('header appearance options', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('headerVertical true rotates column headers to vertical orientation', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id', headerVertical: true },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const idHeader = holder.querySelector('.tabulator-col[tabulator-field="id"]')
      const nameHeader = holder.querySelector('.tabulator-col[tabulator-field="name"]')

      return {
        idHasVertical: idHeader ? idHeader.classList.contains('tabulator-col-vertical') : false,
        nameHasVertical: nameHeader ? nameHeader.classList.contains('tabulator-col-vertical') : false
      }
    })

    expect(result.idHasVertical).toBe(true)
    expect(result.nameHasVertical).toBe(false)
  })

  await test.step('headerVertical always rotates header even without any resize', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, score: 99 }],
          columns: [
            { title: 'Score', field: 'score', headerVertical: 'always' },
            { title: 'ID', field: 'id' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const scoreHeader = holder.querySelector('.tabulator-col[tabulator-field="score"]')

      return {
        hasVertical: scoreHeader ? scoreHeader.classList.contains('tabulator-col-vertical') : false
      }
    })

    expect(result.hasVertical).toBe(true)
  })

  await test.step('editableTitle adds an input element in the column header', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'ID', field: 'id', editableTitle: true },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const idHeader = holder.querySelector('.tabulator-col[tabulator-field="id"]')
      const nameHeader = holder.querySelector('.tabulator-col[tabulator-field="name"]')

      return {
        idHasInput: !!idHeader?.querySelector('input'),
        nameHasInput: !!nameHeader?.querySelector('input')
      }
    })

    expect(result.idHasInput).toBe(true)
    expect(result.nameHasInput).toBe(false)
  })

  await test.step('titleFormatter customizes column header title rendering', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            {
              title: 'ID',
              field: 'id',
              titleFormatter(cell) {
                return `[${cell.getValue()}]`
              }
            },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const idHeader = holder.querySelector('.tabulator-col[tabulator-field="id"] .tabulator-col-title')
      const nameHeader = holder.querySelector('.tabulator-col[tabulator-field="name"] .tabulator-col-title')

      return {
        idTitle: idHeader?.textContent?.trim() || '',
        nameTitle: nameHeader?.textContent?.trim() || ''
      }
    })

    expect(result.idTitle).toBe('[ID]')
    expect(result.nameTitle).toBe('Name')
  })

  await test.step('titleFormatterParams passes parameters to the title formatter function', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            {
              title: 'ID',
              field: 'id',
              titleFormatter(cell, formatterParams) {
                return `${cell.getValue()} (${formatterParams.unit})`
              },
              titleFormatterParams: { unit: 'px' }
            },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const idHeader = holder.querySelector('.tabulator-col[tabulator-field="id"] .tabulator-col-title')

      return {
        idTitle: idHeader?.textContent?.trim() || ''
      }
    })

    expect(result.idTitle).toBe('ID (px)')
  })

  await test.step('headerWordWrap wraps long header text in the header cell', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'alice' }],
          columns: [
            { title: 'A Very Long Column Title That Should Wrap', field: 'id', headerWordWrap: true, width: 100 },
            { title: 'Name', field: 'name' }
          ]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const idHeader = holder.querySelector('.tabulator-col[tabulator-field="id"]')
      const nameHeader = holder.querySelector('.tabulator-col[tabulator-field="name"]')
      const idTitle = idHeader ? idHeader.querySelector('.tabulator-col-title') : null
      const nameTitle = nameHeader ? nameHeader.querySelector('.tabulator-col-title') : null

      return {
        idHasWordWrap: idTitle ? idTitle.classList.contains('tabulator-col-title-wrap') : false,
        nameHasWordWrap: nameTitle ? nameTitle.classList.contains('tabulator-col-title-wrap') : false
      }
    })

    expect(result.idHasWordWrap).toBe(true)
    expect(result.nameHasWordWrap).toBe(false)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
