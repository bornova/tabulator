import Module from '../../core/Module.js'

export default class HtmlTableImport extends Module {
  static moduleName = 'htmlTableImport'

  constructor(table) {
    super(table)

    this.fieldIndex = []
    this.hasIndex = false
  }

  initialize() {
    this.tableElementCheck()
  }

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

  parseTable() {
    const element = this.table.originalElement
    const options = this.table.options
    const headers = element.getElementsByTagName('th')
    const tableBody = element.getElementsByTagName('tbody')[0]
    const rows = tableBody ? tableBody.getElementsByTagName('tr') : []
    const data = []

    this.hasIndex = false

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
        if (typeof this.fieldIndex[i] !== 'undefined') {
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

        if (typeof optionsList[name] !== 'undefined') {
          options[optionsList[name]] = this._attribValue(attrib.value)
        }
      }
    }
  }

  // get value of attribute
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
  _findCol(title) {
    return this.table.options.columns.find((column) => column.title === title) || false
  }

  // extract column from headers
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
