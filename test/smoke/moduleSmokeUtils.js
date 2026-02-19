import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixtureUrl = pathToFileURL(path.resolve(__dirname, 'features.smoke.html')).toString()

export function defineModuleSpec(test, expect, moduleName, config = {}) {
  const { tableOptions = {}, selectors = [], apiFunctions = [] } = config

  test(`${moduleName} module smoke`, async ({ page }) => {
    const pageErrors = []
    const consoleErrors = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto(fixtureUrl)

    const result = await page.evaluate(
      ({ moduleName, tableOptions, selectors, apiFunctions }) => {
        const root = document.getElementById('smoke-root')
        const holder = document.createElement('div')

        holder.id = `module-${moduleName}`
        holder.style.width = '900px'
        root.appendChild(holder)

        const defaultData = [
          { id: 1, name: 'Alice', age: 22, group: 'A', progress: 40, rating: 3, active: true, color: '#ff0000' },
          { id: 2, name: 'Bob', age: 31, group: 'B', progress: 70, rating: 4, active: false, color: '#00ff00' },
          { id: 3, name: 'Cara', age: 28, group: 'A', progress: 55, rating: 2, active: true, color: '#0000ff' },
          { id: 4, name: 'Dan', age: 45, group: 'B', progress: 80, rating: 5, active: false, color: '#ffff00' }
        ]

        const defaultColumns = [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'Age', field: 'age' }
        ]

        const options = Object.assign(
          {
            height: 220,
            data: defaultData,
            columns: defaultColumns
          },
          tableOptions
        )

        return new Promise((resolve) => {
          const table = new Tabulator(holder, options)

          const finalize = () => {
            resolve({
              modulePresent: !!table.modules[moduleName],
              selectorResults: selectors.map((selector) => !!holder.querySelector(selector)),
              apiResults: apiFunctions.map((fnName) => typeof table[fnName] === 'function')
            })
          }

          const timeout = setTimeout(finalize, 1500)

          table.on('tableBuilt', () => {
            clearTimeout(timeout)
            finalize()
          })
        })
      },
      { moduleName, tableOptions, selectors, apiFunctions }
    )

    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
    expect(result.modulePresent).toBe(true)
    result.selectorResults.forEach((found, index) => {
      expect(found, `selector check failed for ${moduleName}: ${selectors[index]}`).toBe(true)
    })
    result.apiResults.forEach((found, index) => {
      expect(found, `api check failed for ${moduleName}: ${apiFunctions[index]}`).toBe(true)
    })
  })
}
