import Module from '../../core/Module.js'

import defaultFormatters from './defaults/formatters.js'

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

export default class Format extends Module {
  static moduleName = 'format'

  // load defaults
  static formatters = defaultFormatters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.registerColumnOption('formatter')
    this.registerColumnOption('formatterParams')

    this.registerColumnOption('formatterPrint')
    this.registerColumnOption('formatterPrintParams')
    this.registerColumnOption('formatterClipboard')
    this.registerColumnOption('formatterClipboardParams')
    this.registerColumnOption('formatterHtmlOutput')
    this.registerColumnOption('formatterHtmlOutputParams')
    this.registerColumnOption('titleFormatter')
    this.registerColumnOption('titleFormatterParams')
  }

  /**
   * Bind formatter lifecycle events.
   * @returns {void}
   */
  initialize() {
    this.subscribe('cell-format', this.formatValue.bind(this))
    this.subscribe('cell-rendered', this.cellRendered.bind(this))
    this.subscribe('column-layout', this.initializeColumn.bind(this))
    this.subscribe('column-format', this.formatHeader.bind(this))
  }

  /**
   * Initialize formatter config for a column.
   * @param {object} column Internal column.
   * @returns {void}
   */
  initializeColumn(column) {
    column.modules.format = this.lookupTypeFormatter(column, '')

    if (typeof column.definition.formatterPrint !== 'undefined') {
      column.modules.format.print = this.lookupTypeFormatter(column, 'Print')
    }

    if (typeof column.definition.formatterClipboard !== 'undefined') {
      column.modules.format.clipboard = this.lookupTypeFormatter(column, 'Clipboard')
    }

    if (typeof column.definition.formatterHtmlOutput !== 'undefined') {
      column.modules.format.htmlOutput = this.lookupTypeFormatter(column, 'HtmlOutput')
    }
  }

  /**
   * Resolve formatter config for a specific output type.
   * @param {object} column Internal column.
   * @param {string} type Formatter suffix type.
   * @returns {{params:object,formatter:Function}}
   */
  lookupTypeFormatter(column, type) {
    const config = { params: column.definition[`formatter${type}Params`] || {} }
    const formatter = column.definition[`formatter${type}`]

    config.formatter = this.lookupFormatter(formatter)

    return config
  }

  /**
   * Resolve formatter function by name or function reference.
   * @param {string|Function} formatter Formatter descriptor.
   * @returns {Function}
   */
  lookupFormatter(formatter) {
    // set column formatter
    switch (typeof formatter) {
      case 'string':
        if (Format.formatters[formatter]) {
          return Format.formatters[formatter]
        } else {
          console.warn('Formatter Error - No such formatter found: ', formatter)
          return Format.formatters.plaintext
        }

      case 'function':
        return formatter

      default:
        return Format.formatters.plaintext
    }
  }

  /**
   * Trigger formatter rendered callback for a cell.
   * @param {object} cell Internal cell.
   * @returns {void}
   */
  cellRendered(cell) {
    if (cell.modules.format && cell.modules.format.renderedCallback && !cell.modules.format.rendered) {
      cell.modules.format.renderedCallback()
      cell.modules.format.rendered = true
    }
  }

  /**
   * Generate callback setter used by formatters for post-render hooks.
   * @param {object} cell Internal cell.
   * @returns {Function}
   */
  generateOnRenderedCallback(cell) {
    return (callback) => {
      if (!cell.modules.format) {
        cell.modules.format = {}
      }

      cell.modules.format.renderedCallback = callback
      cell.modules.format.rendered = false
    }
  }

  /**
   * Format a column header title value.
   * @param {object} column Internal column.
   * @param {string} title Header title.
   * @param {HTMLElement} el Header element.
   * @returns {*}
   */
  formatHeader(column, title, el) {
    if (!column.definition.titleFormatter) {
      return title
    }

    const formatter = this.lookupFormatter(column.definition.titleFormatter)
    const onRendered = (callback) => {
      column.titleFormatterRendered = callback
    }
    const mockCell = {
      getValue() {
        return title
      },
      getElement() {
        return el
      },
      getType() {
        return 'header'
      },
      getColumn() {
        return column.getComponent()
      },
      getTable: () => {
        return this.table
      }
    }

    const params =
      typeof column.definition.titleFormatterParams === 'function'
        ? column.definition.titleFormatterParams()
        : column.definition.titleFormatterParams || {}

    return formatter.call(this, mockCell, params, onRendered)
  }

  /**
   * Format a cell value.
   * @param {object} cell Internal cell.
   * @returns {*}
   */
  formatValue(cell) {
    const component = cell.getComponent()
    const params =
      typeof cell.column.modules.format.params === 'function'
        ? cell.column.modules.format.params(component)
        : cell.column.modules.format.params
    const onRendered = this.generateOnRenderedCallback(cell)

    return cell.column.modules.format.formatter.call(this, component, params, onRendered)
  }

  /**
   * Format a cell value for export context.
   * @param {object} cell Internal cell.
   * @param {string} type Export format key.
   * @returns {*}
   */
  formatExportValue(cell, type) {
    const formatter = cell.column.modules.format[type]

    if (!formatter) {
      return this.formatValue(cell)
    }

    const component = cell.getComponent()
    const params = typeof formatter.params === 'function' ? formatter.params(component) : formatter.params
    const onRendered = this.generateOnRenderedCallback(cell)

    return formatter.formatter.call(this, component, params, onRendered)
  }

  /**
   * Escape HTML entities in a value.
   * @param {*} value Input value.
   * @returns {*}
   */
  sanitizeHTML(value) {
    if (value) {
      return String(value).replace(/[&<>"'`=/]/g, (character) => entityMap[character])
    }

    return value
  }

  /**
   * Convert empty values to a non-breaking space.
   * @param {*} value Input value.
   * @returns {*}
   */
  emptyToSpace(value) {
    return value === null || typeof value === 'undefined' || value === '' ? '&nbsp;' : value
  }
}
