import { expect, test } from '@playwright/test'
import { getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('localize module', async ({ page }) => {
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
    const holder = document.createElement('div')
    holder.id = 'localize-table'
    holder.style.width = '600px'
    root.appendChild(holder)

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        locale: 'fr-fr',
        langs: {
          fr: {
            columns: {
              name: 'Nom'
            },
            pagination: {
              next: 'Suivant'
            }
          }
        },
        columns: [{ title: 'Name', field: 'name' }],
        data: []
      })

      const timeout = setTimeout(() => resolve(instance), 1500)
      instance.on('tableBuilt', () => {
        clearTimeout(timeout)
        resolve(instance)
      })
    })

    const localizedEvents = []
    table.on('localized', (locale) => {
      localizedEvents.push(locale)
    })

    const initialLocale = table.getLocale()
    const frenchLang = table.getLang('fr')
    const activeTextAtStart = table.modules.localize.getText('pagination|next')

    table.setLocale('default')

    const defaultLocale = table.getLocale()
    const activeTextAfterDefault = table.modules.localize.getText('pagination|next')

    table.setLocale('fr')

    const finalLocale = table.getLocale()
    const activeLang = table.getLang()

    return {
      modulePresent: !!table.modules.localize,
      hasFunctions: {
        setLocale: typeof table.setLocale === 'function',
        getLocale: typeof table.getLocale === 'function',
        getLang: typeof table.getLang === 'function'
      },
      initialLocale,
      defaultLocale,
      finalLocale,
      frenchNext: frenchLang.pagination.next,
      activeNextAtStart: activeTextAtStart,
      activeNextAfterDefault: activeTextAfterDefault,
      activeNextAtEnd: activeLang.pagination.next,
      localizedEvents
    }
  })

  expect(result.modulePresent).toBe(true)
  expect(result.hasFunctions).toEqual({
    setLocale: true,
    getLocale: true,
    getLang: true
  })
  expect(result.initialLocale).toBe('fr')
  expect(result.defaultLocale).toBe('default')
  expect(result.finalLocale).toBe('fr')
  expect(result.frenchNext).toBe('Suivant')
  expect(result.activeNextAtStart).toBe('Suivant')
  expect(result.activeNextAfterDefault).toBe('Next')
  expect(result.activeNextAtEnd).toBe('Suivant')
  expect(result.localizedEvents).toEqual(['default', 'fr'])
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
