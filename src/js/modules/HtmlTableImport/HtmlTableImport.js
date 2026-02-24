import Module from '../../core/Module.js'

export default class HtmlTableImport extends Module {
  static moduleName = 'htmlTableImport'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.fieldIndex = []
    this.hasIndex = false
  }

  /**
   * Initialize table-element import check.
   */
  initialize() {
    this.tableElementCheck()
  }

  /**
   * Validate original element and trigger table parsing.
   */
  tableElementCheck() {
    if (!(this.table.originalElement && this.table.originalElement.tagName === 'TABLE')) {
      return
    }

    if (this.table.originalElement.childNodes.length) {
      this.parseTable()
    } else {
      console.warn(
        'Unable to parse data from empty table tag, Tabulator should be initialized on a div tag unless importing data from a table element.'
      )
    }
  }

  /**
   * Parse source HTML table into Tabulator columns and data.
   */
  parseTable() {
    const element = this.table.originalElement
    const options = this.table.options
    const headers = element.getElementsByTagName('th')
    const tableBody = element.getElementsByTagName('tbody')[0]
    const rows = tableBody ? tableBody.getElementsByTagName('tr') : []
    const data = []

    this.hasIndex = false

    options.columns = Array.isArray(options.columns) ? options.columns : []

    this.dispatchExternal('htmlImporting')

    // check for Tabulator inline options
    this._extractOptions(element, options)

    if (headers.length) {
      this._extractHeaders(headers)
    } else {
      this._generateBlankHeaders(headers)
    }

    // iterate through table rows and build data set
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      const cells = row.getElementsByTagName('td')
      const item = {}

      // create index if the don't exist in table
      if (!this.hasIndex) {
        item[options.index] = index
      }

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (this.fieldIndex[i] !== undefined) {
          item[this.fieldIndex[i]] = cell.innerHTML
        }
      }

      // add row data to item
      data.push(item)
    }

    options.data = data

    this.dispatchExternal('htmlImported')
  }

  // extract tabulator attribute options
  /**
   * Extract inline Tabulator attributes from an element.
   * @param {HTMLElement} element Source element.
   * @param {object} options Target options object.
   * @param {object} [defaultOptions] Optional defaults map.
   */
  _extractOptions(element, options, defaultOptions) {
    const attributes = element.attributes
    const optionsArr = defaultOptions ? Object.keys(defaultOptions) : Object.keys(options)
    const optionsList = {}

    optionsArr.forEach((item) => {
      optionsList[item.toLowerCase()] = item
    })

    for (const attrib of attributes) {
      let name

      if (attrib && typeof attrib === 'object' && attrib.name && attrib.name.indexOf('tabulator-') === 0) {
        name = attrib.name.replace('tabulator-', '')

        if (optionsList[name] !== undefined) {
          options[optionsList[name]] = this._attribValue(attrib.value)
        }
      }
    }
  }

  // get value of attribute
  /**
   * Parse a string attribute value to boolean or string.
   * @param {string} value Attribute value.
   * @returns {boolean|string}
   */
  _attribValue(value) {
    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }

    return value
  }

  // find column if it has already been defined
  /**
   * Find existing column by title.
   * @param {string} title Column title.
   * @returns {object|boolean}
   */
  _findCol(title) {
    const columns = this.table.options.columns

    return Array.isArray(columns) ? columns.find((column) => column.title === title) || false : false
  }

  // extract column from headers
  /**
   * Extract or create column definitions from header cells.
   * @param {HTMLCollection} headers Header elements.
   */
  _extractHeaders(headers) {
    for (let index = 0; index < headers.length; index++) {
      const header = headers[index]
      let exists = false
      let col = this._findCol(header.textContent)
      const width = header.getAttribute('width')

      if (col) {
        exists = true
      } else {
        col = { title: header.textContent.trim() }
      }

      if (!col.field) {
        col.field = header.textContent.trim().toLowerCase().replaceAll(' ', '_')
      }

      if (width && !col.width) {
        col.width = width
      }

      // check for Tabulator inline options
      this._extractOptions(header, col, this.table.columnManager.optionsList.registeredDefaults)

      this.fieldIndex[index] = col.field

      if (col.field === this.table.options.index) {
        this.hasIndex = true
      }

      if (!exists) {
        this.table.options.columns.push(col)
      }
    }
  }

  // generate blank headers
  /**
   * Generate placeholder column definitions when no headers are defined.
   * @param {HTMLCollection} headers Header elements.
   */
  _generateBlankHeaders(headers) {
    for (let index = 0; index < headers.length; index++) {
      const header = headers[index]
      const col = { title: '', field: `col${index}` }

      this.fieldIndex[index] = col.field

      const width = header.getAttribute('width')

      if (width) {
        col.width = width
      }

      this.table.options.columns.push(col)
    }
  }
}
