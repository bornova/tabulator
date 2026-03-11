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

    window.tabulatorInstance = table

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

  await test.step('localize internals handle install/merge, fallbacks, placeholders, text paths, and bindings', async () => {
    const internal = await page.evaluate(() => {
      const table = window.tabulatorInstance || null
      const activeTable =
        table ||
        (() => {
          const holder = document.getElementById('localize-table')
          return holder?.tabulator || null
        })()

      const localize = activeTable ? activeTable.modules.localize : null

      if (!localize) {
        return { hasLocalize: false }
      }

      const defaultPlaceholderBefore = localize.langList.default.headerFilters.default
      localize.setHeaderFilterPlaceholder('Type to filter...')
      const defaultPlaceholderAfter = localize.langList.default.headerFilters.default

      localize.installLang('de', {
        groups: {
          item: 'Element',
          items: 'Elemente'
        }
      })

      localize.installLang('fr', {
        data: {
          loading: 'Chargement'
        }
      })

      const warningMessages = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        warningMessages.push(args.map((value) => String(value)).join(' '))
      }

      localize.setLocale('fr-ca')
      const localeAfterPrefixFallback = localize.getLocale()

      localize.setLocale('ja')
      const localeAfterDefaultFallback = localize.getLocale()

      console.warn = originalWarn

      localize.setLocale('fr')
      const textPath = localize.getText('pagination|next')
      const textPathSimplified = localize.getText('pagination', 'next')
      const missingText = localize.getText('missing|path')

      const bindingCalls = []
      localize.bind('pagination|next', (text, lang) => {
        bindingCalls.push({ text, hasLang: !!lang })
      })

      localize.setLocale('default')
      localize.setLocale('fr')

      return {
        hasLocalize: true,
        defaultPlaceholderBefore,
        defaultPlaceholderAfter,
        germanInstalledItem: localize.langList.de?.groups?.item,
        frenchMergedLoading: localize.langList.fr?.data?.loading,
        localeAfterPrefixFallback,
        localeAfterDefaultFallback,
        hasPrefixFallbackWarning: warningMessages.some((msg) => msg.includes('Exact matching locale not found')),
        hasDefaultFallbackWarning: warningMessages.some((msg) => msg.includes('Matching locale not found')),
        textPath,
        textPathSimplified,
        missingText,
        bindingCalls
      }
    })

    expect(internal.hasLocalize).toBe(true)
    expect(internal.defaultPlaceholderAfter).toBe('Type to filter...')
    expect(internal.defaultPlaceholderBefore).not.toBe('Type to filter...')
    expect(internal.germanInstalledItem).toBe('Element')
    expect(internal.frenchMergedLoading).toBe('Chargement')
    expect(internal.localeAfterPrefixFallback).toBe('fr')
    expect(internal.localeAfterDefaultFallback).toBe('default')
    expect(internal.hasPrefixFallbackWarning).toBe(true)
    expect(internal.hasDefaultFallbackWarning).toBe(true)
    expect(internal.textPath).toBe('Suivant')
    expect(internal.textPathSimplified).toBe('Suivant')
    expect(internal.missingText).toBe('')
    expect(internal.bindingCalls.length).toBeGreaterThanOrEqual(3)
    expect(internal.bindingCalls[0].text).toBe('Suivant')
    expect(internal.bindingCalls.some((call) => call.text === 'Next')).toBe(true)
    expect(internal.bindingCalls[internal.bindingCalls.length - 1].text).toBe('Suivant')
  })

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
