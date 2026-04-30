import { expect, test } from '@playwright/test'
import { attachErrorCollectors, expectNoBrowserErrors, getSmokeFixtureUrl } from '../smokeTestUtils.js'

const fixtureUrl = getSmokeFixtureUrl(import.meta.url)

test('Collapsing a group whose rows are inside the viewport does not jump', async ({ page }) => {
  const { pageErrors, consoleErrors } = attachErrorCollectors(page)
  await page.goto(fixtureUrl)

  const result = await page.evaluate(async () => {
    const root = document.getElementById('smoke-root')
    const holder = document.createElement('div')
    holder.style.width = '900px'
    root.appendChild(holder)

    // Mimic the grouping-data example: small groups, nested groupBy, virtual scroll.
    const data = []
    const states = [
      'Alabama',
      'Alaska',
      'Arizona',
      'California',
      'Colorado',
      'Florida',
      'Georgia',
      'Hawaii',
      'Idaho',
      'Illinois',
      'Indiana',
      'Iowa',
      'Kansas',
      'Kentucky',
      'Maine',
      'Maryland',
      'Michigan',
      'Minnesota',
      'Missouri',
      'Montana',
      'Nebraska',
      'Nevada',
      'NewYork',
      'Ohio',
      'Oklahoma',
      'Oregon',
      'Texas',
      'Utah',
      'Vermont',
      'Wyoming'
    ]
    const genders = ['male', 'female']
    let id = 0
    for (let s = 0; s < states.length; s++) {
      // 2-5 rows per state, randomly across genders
      const count = 2 + (s % 4)
      for (let i = 0; i < count; i++) {
        data.push({ id: id++, name: 'P' + id, state: states[s], gender: genders[i % 2] })
      }
    }

    const table = await new Promise((resolve) => {
      const instance = new Tabulator(holder, {
        data,
        height: 400,
        columns: [
          { title: 'ID', field: 'id' },
          { title: 'Name', field: 'name' },
          { title: 'State', field: 'state' },
          { title: 'Gender', field: 'gender' }
        ],
        groupBy: ['state', 'gender']
      })
      instance.on('tableBuilt', () => resolve(instance))
    })
    void table

    const tableHolder = holder.querySelector('.tabulator-tableholder')

    // Scroll incrementally until Oklahoma is in DOM (it's deep down).
    let oklahoma = null
    for (let s = 0; s <= tableHolder.scrollHeight; s += 200) {
      tableHolder.scrollTop = s
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      oklahoma = Array.from(holder.querySelectorAll('.tabulator-group-level-0')).find((el) =>
        el.textContent.startsWith('Oklahoma')
      )
      if (oklahoma) break
    }
    if (!oklahoma) {
      return { error: 'never found Oklahoma' }
    }
    const targetOffset = oklahoma.offsetTop - 80 // a little above viewport top
    tableHolder.scrollTop = Math.max(0, targetOffset)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    // Settle: re-measure and adjust until Oklahoma sits comfortably in viewport.
    for (let attempt = 0; attempt < 6; attempt++) {
      const node = Array.from(holder.querySelectorAll('.tabulator-group-level-0')).find((el) =>
        el.textContent.startsWith('Oklahoma')
      )
      if (!node) {
        return { error: 'lost oklahoma during settle' }
      }
      const rect = node.getBoundingClientRect()
      const hRect = tableHolder.getBoundingClientRect()
      const rel = rect.top - hRect.top
      if (rel >= 60 && rel <= 200) break
      tableHolder.scrollTop += rel - 100
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    }

    // Re-find after potential virtual-scroll re-render
    const oklahomaNow = Array.from(holder.querySelectorAll('.tabulator-group-level-0')).find((el) =>
      el.textContent.startsWith('Oklahoma')
    )
    const holderRect = tableHolder.getBoundingClientRect()
    const beforeRect = oklahomaNow.getBoundingClientRect()
    const groupRelativeBefore = beforeRect.top - holderRect.top
    const scrollBefore = tableHolder.scrollTop

    // Click the arrow
    const arrow = oklahomaNow.querySelector('.tabulator-arrow')
    arrow.click()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    // Re-query after rebuild
    const oklahomaAfter = Array.from(holder.querySelectorAll('.tabulator-group-level-0')).find((el) =>
      el.textContent.startsWith('Oklahoma')
    )
    const holderRectAfter = tableHolder.getBoundingClientRect()
    const afterRect = oklahomaAfter.getBoundingClientRect()
    const groupRelativeAfter = afterRect.top - holderRectAfter.top
    const scrollAfter = tableHolder.scrollTop

    return {
      scrollBefore,
      scrollAfter,
      groupRelativeBefore,
      groupRelativeAfter,
      jumpDelta: Math.abs(groupRelativeAfter - groupRelativeBefore)
    }
  })

  expectNoBrowserErrors(pageErrors, consoleErrors)
  if (result.error) throw new Error(result.error)
  expect(result.jumpDelta).toBeLessThan(50)
})
