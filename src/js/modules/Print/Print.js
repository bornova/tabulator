import Module from '../../core/Module.js'

export default class Print extends Module {
  static moduleName = 'print'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.element = false
    this.manualBlock = false
    this.beforeprintEventHandler = null
    this.afterprintEventHandler = null

    this.registerTableOption('printAsHtml', false) // enable print as html
    this.registerTableOption('printFormatter', false) // printing page formatter
    this.registerTableOption('printHeader', false) // page header contents
    this.registerTableOption('printFooter', false) // page footer contents
    this.registerTableOption('printStyled', true) // enable print as html styling
    this.registerTableOption('printRowRange', 'visible') // restrict print to visible rows only
    this.registerTableOption('printConfig', {}) // print config options

    this.registerColumnOption('print')
    this.registerColumnOption('titlePrint')
  }

  /**
   * Initialize print handlers and table print API.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.printAsHtml) {
      this.beforeprintEventHandler = this.replaceTable.bind(this)
      this.afterprintEventHandler = this.cleanup.bind(this)

      window.addEventListener('beforeprint', this.beforeprintEventHandler)
      window.addEventListener('afterprint', this.afterprintEventHandler)
      this.subscribe('table-destroy', this.destroy.bind(this))
    }

    this.registerTableFunction('print', this.printFullscreen.bind(this))
  }

  /**
   * Remove print listeners on module teardown.
   * @returns {void}
   */
  destroy() {
    if (this.table.options.printAsHtml) {
      window.removeEventListener('beforeprint', this.beforeprintEventHandler)
      window.removeEventListener('afterprint', this.afterprintEventHandler)
    }
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Resolve print section content option.
   * @param {string|HTMLElement|Function} contentOption Content value or resolver.
   * @returns {string|HTMLElement}
   */
  resolvePrintContent(contentOption) {
    return typeof contentOption === 'function' ? contentOption.call(this.table) : contentOption
  }

  /**
   * Append a print section to the print root element.
   * @param {HTMLElement} rootElement Root print wrapper.
   * @param {HTMLElement} sectionElement Section element.
   * @param {string|HTMLElement} content Section content.
   * @returns {void}
   */
  appendPrintSection(rootElement, sectionElement, content) {
    if (typeof content === 'string') {
      sectionElement.innerHTML = content
    } else {
      sectionElement.appendChild(content)
    }

    rootElement.appendChild(sectionElement)
  }

  /**
   * Replace table with printable markup for browser print events.
   * @returns {void}
   */
  replaceTable() {
    const { printConfig, printStyled, printRowRange } = this.table.options

    if (!this.manualBlock) {
      this.element = document.createElement('div')
      this.element.classList.add('tabulator-print-table')

      this.element.appendChild(
        this.table.modules.export.generateTable(printConfig, printStyled, printRowRange, 'print')
      )

      this.table.element.style.display = 'none'

      this.table.element.parentNode.insertBefore(this.element, this.table.element)
    }
  }

  /**
   * Cleanup print-only DOM and restore table display.
   * @returns {void}
   */
  cleanup() {
    document.body.classList.remove('tabulator-print-fullscreen-hide')

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
      this.table.element.style.display = ''
    }

    this.element = false
  }

  /**
   * Print the table in fullscreen print mode.
   * @param {string} [visible] Row range to print.
   * @param {boolean} [style] Include print styling.
   * @param {object} [config] Print config override.
   * @returns {void}
   */
  printFullscreen(visible, style, config) {
    const { printConfig, printStyled, printRowRange, printHeader, printFooter, printFormatter } = this.table.options
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    const headerEl = document.createElement('div')
    const footerEl = document.createElement('div')
    const tableEl = this.table.modules.export.generateTable(
      config !== undefined ? config : printConfig,
      style !== undefined ? style : printStyled,
      visible || printRowRange,
      'print'
    )

    this.manualBlock = true

    this.element = document.createElement('div')
    this.element.classList.add('tabulator-print-fullscreen')

    if (printHeader) {
      headerEl.classList.add('tabulator-print-header')
      this.appendPrintSection(this.element, headerEl, this.resolvePrintContent(printHeader))
    }

    this.element.appendChild(tableEl)

    if (printFooter) {
      footerEl.classList.add('tabulator-print-footer')
      this.appendPrintSection(this.element, footerEl, this.resolvePrintContent(printFooter))
    }

    document.body.classList.add('tabulator-print-fullscreen-hide')
    document.body.appendChild(this.element)

    if (printFormatter) {
      printFormatter(this.element, tableEl)
    }

    window.print()

    this.cleanup()

    window.scrollTo(scrollX, scrollY)

    this.manualBlock = false
  }
}
