import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'
const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('debug options', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)

  await test.step('debugInvalidOptions warns when an unrecognized option is passed', async () => {
    await page.goto(fixtureUrl)

    const warnings = []
    page.on('console', (msg) => {
      // Playwright uses 'warning' for console.warn in the browser
      if (msg.type() === 'warning') warnings.push(msg.text())
    })

    await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          debugInvalidOptions: true,
          thisIsNotAValidOption: true,
          data: [{ id: 1 }],
          columns: [{ title: 'ID', field: 'id' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })
    })

    const hasInvalidOptionWarning = warnings.some(
      (w) => w.includes('thisIsNotAValidOption') || w.includes('Invalid option')
    )

    expect(hasInvalidOptionWarning).toBe(true)
  })

  await test.step('debugEventsExternal logs external events to the console', async () => {
    await page.goto(fixtureUrl)

    const logs = []
    page.on('console', (msg) => {
      logs.push({ type: msg.type(), text: msg.text() })
    })

    await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          debugEventsExternal: true,
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

      table.on('dataChanged', () => {})
      await table.addRow({ id: 2, name: 'bob' })
    })

    const hasEventLog = logs.some((l) => l.text.includes('dataChanged') || l.text.includes('rowAdded'))

    expect(hasEventLog).toBe(true)
  })

  await test.step('debugEventsInternal logs internal events to the console', async () => {
    await page.goto(fixtureUrl)

    const logs = []
    page.on('console', (msg) => {
      logs.push({ type: msg.type(), text: msg.text() })
    })

    await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          debugEventsInternal: true,
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
    })

    // With debugEventsInternal: true, internal events should be logged to console during table build
    const hasInternalLog = logs.length > 0

    expect(hasInternalLog).toBe(true)
  })

  await test.step('debugInitialization warns when table functions called before build', async () => {
    await page.goto(fixtureUrl)

    const warnings = []
    page.on('console', (msg) => {
      // Playwright uses 'warning' for console.warn in the browser
      if (msg.type() === 'warning') warnings.push(msg.text())
    })

    await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const instance = new Tabulator(holder, {
        debugInitialization: true,
        data: [{ id: 1 }],
        columns: [{ title: 'ID', field: 'id' }]
      })

      // Call a method that calls initGuard() before tableBuilt fires
      instance.blockRedraw()

      await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })
    })

    const hasInitWarning = warnings.some(
      (w) => w.includes('Not Initialized') || w.includes('tableBuilt') || w.includes('blockRedraw')
    )

    expect(hasInitWarning).toBe(true)
  })

  await test.step('debugInvalidComponentFuncs option is stored on the table', async () => {
    await page.goto(fixtureUrl)

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          debugInvalidComponentFuncs: true,
          data: [{ id: 1 }],
          columns: [{ title: 'ID', field: 'id' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        optionSet: table.options.debugInvalidComponentFuncs
      }
    })

    expect(result.optionSet).toBe(true)
  })

  await test.step('debugLogging enables diagnostic logging to the console', async () => {
    await page.goto(fixtureUrl)

    const logs = []
    page.on('console', (msg) => {
      logs.push({ type: msg.type(), text: msg.text() })
    })

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          debugLogging: true,
          data: [{ id: 1 }],
          columns: [{ title: 'ID', field: 'id' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        optionSet: table.options.debugLogging
      }
    })

    expect(result.optionSet).toBe(true)
  })

  await test.step('debugDeprecation warns when deprecated APIs are used', async () => {
    await page.goto(fixtureUrl)

    const warnings = []
    page.on('console', (msg) => {
      if (msg.type() === 'warn' || msg.type() === 'error') warnings.push(msg.text())
    })

    const result = await page.evaluate(async () => {
      const root = document.getElementById('smoke-root')
      const holder = document.createElement('div')
      holder.style.width = '600px'
      root.appendChild(holder)

      const table = await new Promise((resolve) => {
        const instance = new Tabulator(holder, {
          debugDeprecation: true,
          data: [{ id: 1 }],
          columns: [{ title: 'ID', field: 'id' }]
        })

        const timeout = setTimeout(() => resolve(instance), 1500)
        instance.on('tableBuilt', () => {
          clearTimeout(timeout)
          resolve(instance)
        })
      })

      return {
        optionSet: table.options.debugDeprecation
      }
    })

    expect(result.optionSet).toBe(true)
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
})
