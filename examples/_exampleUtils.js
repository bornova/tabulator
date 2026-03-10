const TABULATOR_SOURCE_STORAGE_KEY = 'tabulator-example-source'
const TABULATOR_SOURCE_QUERY_KEY = 'tabulator-source'
const TABULATOR_STYLESHEET_ID = 'tabulator-example-stylesheet'
const TABULATOR_BROWSER_SCRIPT_ID = 'tabulator-example-browser-script'
const TABULATOR_CDN_SCRIPT_ID = 'tabulator-example-cdn-script'

const tabulatorSources = {
  esm: {
    label: 'ESM',
    stylesheetHref: './../../dist/css/themes/default/tabulator.min.css'
  },
  browser: {
    label: 'BRO',
    scriptSrc: './../../dist/js/browser/tabulator.min.js',
    stylesheetHref: './../../dist/css/themes/default/tabulator.min.css'
  },
  cdn: {
    label: 'CDN',
    scriptSrc: 'https://unpkg.com/tabulator-tables/dist/js/tabulator.min.js',
    stylesheetHref: 'https://unpkg.com/tabulator-tables/dist/css/tabulator.min.css'
  }
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

export const initializeTestPage = async () => {
  const source = getSelectedTabulatorSource()

  await ensureTabulatorStylesheet(source)
  ensureExampleTable()
  initializeTestFileNavigator()
  initializeThemeSelector()
  initializeTabulatorSourceSelector(source)
}

export const loadExampleTabulator = async () => {
  const source = getSelectedTabulatorSource()

  if (source === 'browser') {
    await ensureBrowserTabulatorScript()

    return window.Tabulator
  }

  if (source === 'cdn') {
    await ensureCdnTabulatorScript()

    return window.Tabulator
  }

  const { TabulatorFull } = await import('./../../dist/js/esm/tabulator.min.js')

  return TabulatorFull
}

export const initializeThemeSelector = () => {
  let themeToggle = document.getElementById('theme-toggle')

  if (!themeToggle) {
    const wrapper = document.createElement('div')
    const label = document.createElement('label')
    themeToggle = document.createElement('div')

    wrapper.id = 'theme-select-wrapper'
    wrapper.className = 'example-theme-control-wrapper'
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

export const initializeTabulatorSourceSelector = (initialSource = getSelectedTabulatorSource()) => {
  let sourceToggle = document.getElementById('tabulator-source-toggle')

  if (!sourceToggle) {
    const wrapper = document.createElement('div')
    const label = document.createElement('label')
    sourceToggle = document.createElement('div')

    wrapper.id = 'tabulator-source-wrapper'
    wrapper.className = 'example-source-control-wrapper'
    label.htmlFor = 'tabulator-source-toggle'
    label.textContent = 'Source: '

    sourceToggle.id = 'tabulator-source-toggle'
    sourceToggle.setAttribute('role', 'group')
    sourceToggle.setAttribute('aria-label', 'Tabulator source')

    Object.entries(tabulatorSources).forEach(([value, option]) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'source-toggle-button'
      button.dataset.source = value
      button.textContent = option.label
      sourceToggle.appendChild(button)
    })

    wrapper.appendChild(label)
    wrapper.appendChild(sourceToggle)

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

  applySourceSelection(sourceToggle, initialSource)

  sourceToggle.addEventListener('click', (event) => {
    const button = event.target.closest('.source-toggle-button')

    if (!button) {
      return
    }

    const nextSource = button.dataset.source

    if (nextSource && nextSource !== getSelectedTabulatorSource()) {
      localStorage.setItem(TABULATOR_SOURCE_STORAGE_KEY, nextSource)

      const url = new URL(window.location.href)
      url.searchParams.set(TABULATOR_SOURCE_QUERY_KEY, nextSource)
      window.location.href = url.toString()
    }
  })
}

const applySourceSelection = (sourceToggle, selectedSource) => {
  sourceToggle.querySelectorAll('.source-toggle-button').forEach((button) => {
    const isActive = button.dataset.source === selectedSource
    button.classList.toggle('active', isActive)
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
  })
}

const getSelectedTabulatorSource = () => {
  const params = new URLSearchParams(window.location.search)
  const sourceFromQuery = params.get(TABULATOR_SOURCE_QUERY_KEY)

  if (sourceFromQuery && tabulatorSources[sourceFromQuery]) {
    localStorage.setItem(TABULATOR_SOURCE_STORAGE_KEY, sourceFromQuery)
    return sourceFromQuery
  }

  const storedSource = localStorage.getItem(TABULATOR_SOURCE_STORAGE_KEY)

  return storedSource && tabulatorSources[storedSource] ? storedSource : 'esm'
}

const ensureTabulatorStylesheet = (source) => {
  const stylesheetHref = tabulatorSources[source].stylesheetHref

  return new Promise((resolve) => {
    let stylesheet = document.getElementById(TABULATOR_STYLESHEET_ID)

    if (!stylesheet) {
      stylesheet = document.createElement('link')
      stylesheet.id = TABULATOR_STYLESHEET_ID
      stylesheet.rel = 'stylesheet'
      document.head.insertBefore(stylesheet, document.head.firstChild)
    }

    if (stylesheet.getAttribute('href') === stylesheetHref) {
      resolve()
      return
    }

    stylesheet.addEventListener('load', () => resolve(), { once: true })
    stylesheet.addEventListener('error', () => resolve(), { once: true })
    stylesheet.setAttribute('href', stylesheetHref)
  })
}

const ensureBrowserTabulatorScript = () => {
  if (window.Tabulator) {
    return Promise.resolve(window.Tabulator)
  }

  return ensureTabulatorScript({
    id: TABULATOR_BROWSER_SCRIPT_ID,
    src: tabulatorSources.browser.scriptSrc,
    errorMessage: 'Failed to load Tabulator browser bundle'
  })
}

const ensureCdnTabulatorScript = () => {
  if (window.Tabulator) {
    return Promise.resolve(window.Tabulator)
  }

  return ensureTabulatorScript({
    id: TABULATOR_CDN_SCRIPT_ID,
    src: tabulatorSources.cdn.scriptSrc,
    errorMessage: 'Failed to load Tabulator CDN bundle'
  })
}

const ensureTabulatorScript = ({ id, src, errorMessage }) => {
  return new Promise((resolve, reject) => {
    let script = document.getElementById(id)

    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.src = src
      script.async = true
      document.head.appendChild(script)
    }

    script.addEventListener('load', () => resolve(window.Tabulator), { once: true })
    script.addEventListener('error', () => reject(new Error(errorMessage)), { once: true })
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
  'responsive-layout-collapsed.html',
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
  const currentSearch = window.location.search

  testFiles.forEach((file) => {
    const listItem = document.createElement('li')
    const link = document.createElement('a')

    link.href = currentSearch ? `${file}${currentSearch}` : file
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
