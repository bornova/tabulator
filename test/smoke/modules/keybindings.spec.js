import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('keybindings module', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('default keybindings map expected actions', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name', editor: 'input' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.keybindings
      const key9Bindings = module.watchKeys[9] || []

      return {
        modulePresent: !!module,
        hasWatchKey9: key9Bindings.length > 0,
        hasNavNextOnTab: key9Bindings.some((binding) => binding.action === module.constructor.actions.navNext),
        hasNavPrevOnShiftTab: key9Bindings.some(
          (binding) => binding.action === module.constructor.actions.navPrev && binding.shift
        )
      }
    })

    expect(result.modulePresent).toBe(true)
    expect(result.hasWatchKey9).toBe(true)
    expect(result.hasNavNextOnTab).toBe(true)
    expect(result.hasNavPrevOnShiftTab).toBe(true)
  })

  await test.step('keybindings false disables binding map and DOM listeners', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          keybindings: false,
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.keybindings

      return {
        watchKeysCount: Object.keys(module.watchKeys || {}).length,
        keydownListenerBound: !!module.keyupBinding,
        keyupListenerBound: !!module.keydownBinding
      }
    })

    expect(result.watchKeysCount).toBe(0)
    expect(result.keydownListenerBound).toBe(false)
    expect(result.keyupListenerBound).toBe(false)
  })

  await test.step('keybindings supports overriding, disabling, and custom combinations', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          keybindings: {
            navNext: false,
            navDown: ['65', ['ctrl + 66']]
          },
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const module = table.modules.keybindings
      const tabBindings = module.watchKeys[9] || []
      const key65Bindings = module.watchKeys[65] || []
      const key66Bindings = module.watchKeys[66] || []

      return {
        tabHasNavNext: tabBindings.some((binding) => binding.action === module.constructor.actions.navNext),
        hasKey65NavDown: key65Bindings.some((binding) => binding.action === module.constructor.actions.navDown),
        hasCtrlKey66NavDown: key66Bindings.some(
          (binding) => binding.action === module.constructor.actions.navDown && binding.ctrl
        )
      }
    })

    expect(result.tabHasNavNext).toBe(false)
    expect(result.hasKey65NavDown).toBe(true)
    expect(result.hasCtrlKey66NavDown).toBe(true)
  })

  await test.step('keybindings warns for unknown actions', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const warnings = []
      const originalWarn = console.warn
      console.warn = (...args) => {
        warnings.push(args.map((value) => String(value)).join(' '))
        originalWarn(...args)
      }

      await new Promise((resolve) => {
        const table = new Tabulator(holder, {
          keybindings: {
            fakeAction: 65
          },
          data: [{ id: 1, name: 'Alice' }],
          columns: [{ title: 'Name', field: 'name' }]
        })

        const timeout = setTimeout(resolve, 1500)
        table.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      console.warn = originalWarn

      return {
        warningCount: warnings.filter((warning) => warning.includes('Key Binding Error - no such action')).length
      }
    })

    expect(result.warningCount).toBeGreaterThan(0)
  })

  await test.step('tabEndNewRow supports false, true, object, and function values', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')

      const runCase = async (tabEndNewRow) => {
        const holder = document.createElement('div')
        holder.style.width = '900px'
        root.appendChild(holder)

        const table = await new Promise((resolve) => {
          const instance = new Tabulator(holder, {
            keybindings: {},
            tabEndNewRow,
            data: [{ id: 1, name: 'Alice' }],
            columns: [{ title: 'Name', field: 'name', editor: 'input' }]
          })

          const timeout = setTimeout(() => resolve(instance), 1500)
          instance.on('tableBuilt', () => {
            clearTimeout(timeout)
            resolve(instance)
          })
        })

        const editModule = table.modules.edit
        const addRowPayloads = []

        table.addRow = (payload) => {
          addRowPayloads.push(payload)
          return Promise.resolve({})
        }

        const currentRowComponent = table.getRow(1)

        editModule.currentCell = {
          getElement() {
            return {
              firstChild: {
                blur() {}
              }
            }
          },
          getComponent() {
            return {
              navigateNext() {}
            }
          },
          row: {
            getComponent() {
              return currentRowComponent
            }
          }
        }

        editModule.navigateNext = () => false
        editModule.invalidEdit = false

        editModule.keybindingNavigateNext({
          preventDefault() {}
        })

        await new Promise((resolve) => setTimeout(resolve, 20))

        return addRowPayloads
      }

      const falseCase = await runCase(false)
      const trueCase = await runCase(true)
      const objectCase = await runCase({ status: 'new' })
      const functionCase = await runCase((row) => ({ fromId: row.getData().id }))

      return {
        falseCase,
        trueCase,
        objectCase,
        functionCase
      }
    })

    expect(result.falseCase).toEqual([])
    expect(result.trueCase).toEqual([{}])
    expect(result.objectCase).toEqual([{ status: 'new' }])
    expect(result.functionCase).toEqual([{ fromId: 1 }])
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
