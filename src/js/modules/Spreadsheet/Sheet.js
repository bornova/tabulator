import CoreFeature from '../../core/CoreFeature.js'
import GridCalculator from './GridCalculator'
import SheetComponent from './SheetComponent'

export default class Sheet extends CoreFeature {
  /**
   * @param {object} spreadsheetManager Spreadsheet manager.
   * @param {object} definition Sheet definition.
   */
  constructor(spreadsheetManager, definition) {
    super(spreadsheetManager.table)

    this.spreadsheetManager = spreadsheetManager
    this.definition = definition

    this.title = this.definition.title || ''
    this.key = this.definition.key || this.definition.title
    this.rowCount = this.definition.rows
    this.columnCount = this.definition.columns
    this.data = this.definition.data || []
    this.element = null
    this.isActive = false

    this.grid = new GridCalculator(this.columnCount, this.rowCount)

    this.defaultColumnDefinition = { width: 100, headerHozAlign: 'center', headerSort: false }
    this.columnDefinition = { ...this.defaultColumnDefinition, ...this.options('spreadsheetColumnDefinition') }

    this.columnDefs = []
    this.rowDefs = []
    this.columnFields = []
    this.columns = []
    this.rows = []

    this.scrollTop = null
    this.scrollLeft = null

    this.initialize()

    this.dispatchExternal('sheetAdded', this.getComponent())
  }

  /// ////////////////////////////////
  /// ////// Initialization //////////
  /// ////////////////////////////////

  /**
   * Initialize sheet element, columns, and rows.
   */
  initialize() {
    this.initializeElement()
    this.initializeColumns()
    this.initializeRows()
  }

  /**
   * Reinitialize generated columns and rows.
   */
  reinitialize() {
    this.initializeColumns()
    this.initializeRows()
  }

  /**
   * Create tab element for this sheet.
   */
  initializeElement() {
    this.element = document.createElement('div')
    this.element.classList.add('tabulator-spreadsheet-tab')
    this.element.innerText = this.title

    this.element.addEventListener('click', () => {
      this.spreadsheetManager.loadSheet(this)
    })
  }

  /**
   * Generate column field references and defs.
   */
  initializeColumns() {
    this.grid.setColumnCount(this.columnCount)
    this.columnFields = this.grid.genColumns(this.data)

    this.columnDefs = this.columnFields.map((ref) => ({
      ...this.columnDefinition,
      field: ref,
      title: ref
    }))
  }

  /**
   * Generate row defs from grid and data.
   */
  initializeRows() {
    this.grid.setRowCount(this.rowCount)

    const refs = this.grid.genRows(this.data)

    this.rowDefs = refs.map((ref, i) => {
      const def = { _id: ref }
      const data = this.data[i]

      if (data) {
        data.forEach((val, j) => {
          const field = this.columnFields[j]

          if (field) {
            def[field] = val
          }
        })
      }

      return def
    })
  }

  /**
   * Unload active sheet state.
   */
  unload() {
    this.isActive = false
    this.scrollTop = this.table.rowManager.scrollTop
    this.scrollLeft = this.table.rowManager.scrollLeft
    this.data = this.getData(true)
    this.element.classList.remove('tabulator-spreadsheet-tab-active')
  }

  /**
   * Load sheet data/columns into table.
   */
  load() {
    const wasInactive = !this.isActive

    this.isActive = true
    this.table.blockRedraw()
    this.table.setData([])
    this.table.setColumns(this.columnDefs)
    this.table.setData(this.rowDefs)
    this.table.restoreRedraw()

    if (wasInactive && this.scrollTop !== null) {
      this.table.rowManager.element.scrollLeft = this.scrollLeft
      this.table.rowManager.element.scrollTop = this.scrollTop
    }

    this.element.classList.add('tabulator-spreadsheet-tab-active')

    this.dispatchExternal('sheetLoaded', this.getComponent())
  }

  /// ////////////////////////////////
  /// ///// Helper Functions /////////
  /// ////////////////////////////////

  /**
   * Get sheet component wrapper.
   * @returns {SheetComponent}
   */
  getComponent() {
    return new SheetComponent(this)
  }

  /**
   * Get serialized sheet definition.
   * @returns {object}
   */
  getDefinition() {
    return {
      title: this.title,
      key: this.key,
      rows: this.rowCount,
      columns: this.columnCount,
      data: this.getData()
    }
  }

  /**
   * Get sheet data array.
   * @param {boolean} [full] Return full grid output.
   * @returns {Array<Array<*>>}
   */
  getData(full) {
    let output
    let rowWidths
    let outputWidth
    let outputHeight

    // map data to array format
    output = this.rowDefs.map((rowData) => this.columnFields.map((field) => rowData[field]))

    // trim output
    if (!full && !this.options('spreadsheetOutputFull')) {
      // calculate used area of data
      rowWidths = output.map((row) => row.findLastIndex((val) => val !== undefined) + 1)
      outputWidth = rowWidths.length ? Math.max(...rowWidths) : 0
      outputHeight = rowWidths.findLastIndex((width) => width > 0) + 1

      output = output.slice(0, outputHeight)
      output = output.map((row) => row.slice(0, outputWidth))
    }

    return output
  }

  /**
   * Set sheet data and refresh active view.
   * @param {Array<Array<*>>} data Sheet data.
   */
  setData(data) {
    this.data = data
    this.reinitialize()

    this.dispatchExternal('sheetUpdated', this.getComponent())

    if (this.isActive) {
      this.load()
    }
  }

  /**
   * Clear all sheet data.
   */
  clear() {
    this.setData([])
  }

  /**
   * Set sheet title.
   * @param {string} title Sheet title.
   */
  setTitle(title) {
    this.title = title
    this.element.innerText = title

    this.dispatchExternal('sheetUpdated', this.getComponent())
  }

  /**
   * Set sheet row count.
   * @param {number} rows Row count.
   */
  setRows(rows) {
    this.rowCount = rows
    this.initializeRows()

    this.dispatchExternal('sheetUpdated', this.getComponent())

    if (this.isActive) {
      this.load()
    }
  }

  /**
   * Set sheet column count.
   * @param {number} columns Column count.
   */
  setColumns(columns) {
    this.columnCount = columns
    this.reinitialize()

    this.dispatchExternal('sheetUpdated', this.getComponent())

    if (this.isActive) {
      this.load()
    }
  }

  /**
   * Remove sheet via manager.
   */
  remove() {
    this.spreadsheetManager.removeSheet(this)
  }

  /**
   * Destroy sheet element and emit removal event.
   */
  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    this.dispatchExternal('sheetRemoved', this.getComponent())
  }

  /**
   * Activate this sheet.
   */
  active() {
    this.spreadsheetManager.loadSheet(this)
  }
}
