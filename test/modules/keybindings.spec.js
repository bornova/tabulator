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
      const key9Bindings = module.watchKeys.tab || []

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
      const tabBindings = module.watchKeys.tab || []
      const key65Bindings = module.watchKeys.a || []
      const key66Bindings = module.watchKeys.b || []

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

  await test.step('keybindings internal checks and default actions behave as expected', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '900px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          data: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Cara' }
          ],
          columns: [{ title: 'Name', field: 'name', editor: 'input' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      const mod = table.modules.keybindings

      const bindingActionCalls = []
      const binding = {
        action() {
          bindingActionCalls.push('called')
        },
        keys: ['arrowup'],
        ctrl: true,
        shift: false,
        meta: false
      }

      mod.pressedKeys = ['arrowup']
      const checkMatch = mod.checkBinding({ ctrlKey: true, shiftKey: false, metaKey: false }, binding)
      const checkNoMatch = mod.checkBinding({ ctrlKey: true, shiftKey: true, metaKey: false }, binding)

      const removeEventListenerCalls = []
      const originalRemoveEventListener = table.element.removeEventListener
      table.element.removeEventListener = (...args) => {
        removeEventListenerCalls.push(args)
        return originalRemoveEventListener.apply(table.element, args)
      }

      mod.keyupBinding = () => {}
      mod.keydownBinding = () => {}
      mod.clearBindings()

      table.element.removeEventListener = originalRemoveEventListener

      const rowManager = table.rowManager
      const displayRows = rowManager.getDisplayRows()

      rowManager.scrollTop = 100
      rowManager.element.scrollTop = 100
      rowManager.element.clientHeight = 200
      rowManager.element.scrollHeight = 600

      const scrollToRowCalls = []
      const originalScrollToRow = rowManager.scrollToRow
      rowManager.scrollToRow = (row) => {
        scrollToRowCalls.push(row)
      }

      let focusCalls = 0
      const originalFocus = table.element.focus
      table.element.focus = () => {
        focusCalls += 1
      }

      const eventFactory = () => ({
        stopPropagationCalled: false,
        preventDefaultCalled: false,
        stopPropagation() {
          this.stopPropagationCalled = true
        },
        preventDefault() {
          this.preventDefaultCalled = true
        }
      })

      const pageUpEvent = eventFactory()
      mod.constructor.actions.scrollPageUp.call(mod, pageUpEvent)

      rowManager.scrollTop = 500
      rowManager.element.scrollTop = 500
      const pageDownEvent = eventFactory()
      mod.constructor.actions.scrollPageDown.call(mod, pageDownEvent)

      const startEvent = eventFactory()
      mod.constructor.actions.scrollToStart.call(mod, startEvent)

      const endEvent = eventFactory()
      mod.constructor.actions.scrollToEnd.call(mod, endEvent)

      const keyBlockEvent = eventFactory()
      mod.constructor.actions.keyBlock.call(mod, keyBlockEvent)

      const dispatchCalls = []
      const originalDispatch = mod.dispatch
      mod.dispatch = (...args) => {
        dispatchCalls.push(args)
      }

      const navEvent = {}
      mod.constructor.actions.navPrev.call(mod, navEvent)
      mod.constructor.actions.navNext.call(mod, navEvent)
      mod.constructor.actions.navUp.call(mod, navEvent)
      mod.constructor.actions.navDown.call(mod, navEvent)
      mod.constructor.actions.navLeft.call(mod, navEvent)
      mod.constructor.actions.navRight.call(mod, navEvent)

      mod.dispatch = originalDispatch
      rowManager.scrollToRow = originalScrollToRow
      table.element.focus = originalFocus

      return {
        checkMatch,
        checkNoMatch,
        bindingActionCalls: bindingActionCalls.length,
        removeEventListenerEventNames: removeEventListenerCalls.map((call) => call[0]),
        keyupBindingCleared: mod.keyupBinding === false,
        keydownBindingCleared: mod.keydownBinding === false,
        pressedKeysCleared: Array.isArray(mod.pressedKeys) && mod.pressedKeys.length === 0,
        scrollToRowCallCount: scrollToRowCalls.length,
        pageUpCalledFirstRow: scrollToRowCalls[0] === displayRows[0],
        pageDownCalledLastRow: scrollToRowCalls[1] === displayRows[displayRows.length - 1],
        scrollToStartCalledFirstRow: scrollToRowCalls[2] === displayRows[0],
        scrollToEndCalledLastRow: scrollToRowCalls[3] === displayRows[displayRows.length - 1],
        pageUpPreventDefault: pageUpEvent.preventDefaultCalled,
        pageDownPreventDefault: pageDownEvent.preventDefaultCalled,
        startPreventDefault: startEvent.preventDefaultCalled,
        endPreventDefault: endEvent.preventDefaultCalled,
        keyBlockPreventDefault: keyBlockEvent.preventDefaultCalled,
        keyBlockStopPropagation: keyBlockEvent.stopPropagationCalled,
        focusCalls,
        navDispatches: dispatchCalls.map((call) => call[0])
      }
    })

    expect(result.checkMatch).toBe(true)
    expect(result.checkNoMatch).toBe(false)
    expect(result.bindingActionCalls).toBe(1)
    expect(result.removeEventListenerEventNames).toEqual(['keydown', 'keyup'])
    expect(result.keyupBindingCleared).toBe(true)
    expect(result.keydownBindingCleared).toBe(true)
    expect(result.pressedKeysCleared).toBe(true)
    expect(result.scrollToRowCallCount).toBe(4)
    expect(result.pageUpCalledFirstRow).toBe(true)
    expect(result.pageDownCalledLastRow).toBe(true)
    expect(result.scrollToStartCalledFirstRow).toBe(true)
    expect(result.scrollToEndCalledLastRow).toBe(true)
    expect(result.pageUpPreventDefault).toBe(true)
    expect(result.pageDownPreventDefault).toBe(true)
    expect(result.startPreventDefault).toBe(true)
    expect(result.endPreventDefault).toBe(true)
    expect(result.keyBlockPreventDefault).toBe(true)
    expect(result.keyBlockStopPropagation).toBe(true)
    expect(result.focusCalls).toBe(4)
    expect(result.navDispatches).toEqual([
      'keybinding-nav-prev',
      'keybinding-nav-next',
      'keybinding-nav-up',
      'keybinding-nav-down',
      'keybinding-nav-left',
      'keybinding-nav-right'
    ])
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
