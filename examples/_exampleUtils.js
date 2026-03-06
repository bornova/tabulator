import { faker } from 'https://esm.sh/@faker-js/faker'

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const generateData = (rowCount) => {
  const data = []

  for (let i = 1; i <= rowCount; i++) {
    data.push({
      id: i,
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 100 }),
      gender: faker.person.sex(), // Generates 'male' or 'female'
      rating: faker.number.int({ min: 1, max: 5 }),
      col: faker.color.human(), // Generates human-readable colors like 'red', 'blue'
      dob: formatDate(faker.date.birthdate({ min: 18, max: 65, mode: 'age' })),
      salary: faker.number.int({ min: 30000, max: 150000 }), // Generates a random salary
      address: faker.location.streetAddress(), // Generates a random street address
      state: faker.location.state(), // Generates a random state
      zip: parseInt(faker.location.zipCode(), 10), // Generates a random zip code
      progress: faker.number.int({ min: 0, max: 100 }), // Generates a random progress percentage
      completed: faker.datatype.boolean()
    })
  }

  return data
}

const createRow = (id) => {
  return {
    id,
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 100 }),
    gender: faker.person.sex(),
    rating: faker.number.int({ min: 1, max: 5 }),
    col: faker.color.human(),
    dob: formatDate(faker.date.birthdate({ min: 18, max: 65, mode: 'age' })),
    salary: faker.number.int({ min: 30000, max: 150000 }),
    address: faker.location.streetAddress(),
    state: faker.location.state(),
    zip: parseInt(faker.location.zipCode(), 10),
    progress: faker.number.int({ min: 0, max: 100 }),
    completed: faker.datatype.boolean()
  }
}

const createRowWithChildren = (counter, depth, maxDepth, maxChildren) => {
  const row = createRow(counter.value++)

  if (depth < maxDepth) {
    const childCount = faker.number.int({ min: 0, max: maxChildren })

    if (childCount > 0) {
      row._children = []

      for (let i = 0; i < childCount; i++) {
        row._children.push(createRowWithChildren(counter, depth + 1, maxDepth, maxChildren))
      }
    }
  }

  return row
}

export const generateNestedData = (rowCount = 1, maxChildren = 4, maxDepth = 1) => {
  initializeTestFileNavigator()
  initializeThemeSelector()

  const data = []
  const counter = { value: 1 }

  for (let i = 0; i < rowCount; i++) {
    data.push(createRowWithChildren(counter, 0, maxDepth, maxChildren))
  }

  return data
}

export const ensureExampleTable = (id = 'example-table') => {
  let tableElement = document.getElementById(id)

  if (!tableElement) {
    tableElement = document.createElement('div')
    tableElement.id = id

    if (document.currentScript?.parentNode) {
      document.currentScript.parentNode.insertBefore(tableElement, document.currentScript)
    } else {
      document.body.appendChild(tableElement)
    }
  }

  return tableElement
}

export const initializeTestPage = (rowCount = 100) => {
  ensureExampleTable()
  initializeTestFileNavigator()
  initializeThemeSelector()

  return generateData(rowCount)
}

export const initializeThemeSelector = () => {
  let themeToggle = document.getElementById('theme-toggle')

  if (!themeToggle) {
    const wrapper = document.createElement('div')
    const label = document.createElement('label')
    themeToggle = document.createElement('div')

    wrapper.id = 'theme-select-wrapper'
    label.htmlFor = 'theme-toggle'
    label.textContent = 'Theme: '

    themeToggle.id = 'theme-toggle'
    themeToggle.setAttribute('role', 'group')
    themeToggle.setAttribute('aria-label', 'Theme')

    const options = [
      { label: 'Auto', value: 'light dark' },
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' }
    ]

    options.forEach((option) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'theme-toggle-button'
      button.dataset.theme = option.value
      button.textContent = option.label
      themeToggle.appendChild(button)
    })

    wrapper.appendChild(label)
    wrapper.appendChild(themeToggle)

    const navigatorWrapper = document.getElementById('test-file-nav')

    if (navigatorWrapper) {
      navigatorWrapper.appendChild(wrapper)
    } else {
      const firstTable = document.querySelector('[id^="example-table"]')
      if (firstTable) {
        firstTable.parentNode.insertBefore(wrapper, firstTable)
      } else {
        document.body.insertBefore(wrapper, document.body.firstChild)
      }
    }
  }

  let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')

  if (!colorSchemeMeta) {
    colorSchemeMeta = document.createElement('meta')
    colorSchemeMeta.setAttribute('name', 'color-scheme')
    document.head.appendChild(colorSchemeMeta)
  }

  const applyTheme = (theme) => {
    colorSchemeMeta.setAttribute('content', theme)
    localStorage.setItem('tabulator-theme', theme)

    themeToggle.querySelectorAll('.theme-toggle-button').forEach((button) => {
      const isActive = button.dataset.theme === theme
      button.classList.toggle('active', isActive)
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    })
  }

  const storedTheme = localStorage.getItem('tabulator-theme')
  const currentTheme = storedTheme || 'light dark'

  applyTheme(currentTheme)

  themeToggle.addEventListener('click', (event) => {
    const button = event.target.closest('.theme-toggle-button')

    if (!button) {
      return
    }

    const nextTheme = button.dataset.theme

    if (nextTheme) {
      applyTheme(nextTheme)
    }
  })
}

const testFiles = [
  'clipboard.html',
  'column-calculations.html',
  'column-groups.html',
  'core.html',
  'download-table-data.html',
  'editable-data.html',
  'filter-data-in-column-header.html',
  'formatters.html',
  'frozen-columns.html',
  'frozen-rows.html',
  'grouping-data.html',
  'layouts.html',
  'menus.html',
  'movable-between-tables.html',
  'movable-rows.html',
  'multisheet-spreadsheet.html',
  'nested-data-trees.html',
  'no-column-headers.html',
  'pagination.html',
  'resizable-columns.html',
  'responsive-layout.html',
  'row-header.html',
  'RTL-text-direction.html',
  'selectable-cell-range.html',
  'selectable-rows.html',
  'selectable-rows-with-tickbox.html',
  'sorters.html',
  'spreadsheet.html',
  'validate-input.html',
  'vertical-columns.html'
]

export const initializeTestFileNavigator = () => {
  if (document.getElementById('test-file-nav')) {
    return
  }

  document.body.classList.add('with-test-nav')

  const nav = document.createElement('nav')
  const title = document.createElement('div')
  const list = document.createElement('ul')

  nav.id = 'test-file-nav'
  title.id = 'test-file-nav-title'
  title.textContent = 'Test Pages'
  list.id = 'test-file-nav-list'

  const currentFile = window.location.pathname.split('/').pop() || ''

  testFiles.forEach((file) => {
    const listItem = document.createElement('li')
    const link = document.createElement('a')

    link.href = file
    link.textContent = file
      .replace('.html', '')
      .replaceAll('-', ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    if (file === currentFile) {
      link.classList.add('active')
      link.setAttribute('aria-current', 'page')
    }

    listItem.appendChild(link)
    list.appendChild(listItem)
  })

  nav.appendChild(title)
  nav.appendChild(list)

  document.body.insertBefore(nav, document.body.firstChild)
}
