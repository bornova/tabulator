import Module from '../../core/Module.js'

export default class FrozenRows extends Module {
  static moduleName = 'frozenRows'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.topElement = document.createElement('div')
    this.rows = []

    // register component functions
    this.registerComponentFunction('row', 'freeze', this.freezeRow.bind(this))
    this.registerComponentFunction('row', 'unfreeze', this.unfreezeRow.bind(this))
    this.registerComponentFunction('row', 'isFrozen', this.isRowFrozen.bind(this))

    // register table options
    this.registerTableOption('frozenRowsField', 'id') // field to choose frozen rows by
    this.registerTableOption('frozenRows', false) // holder for frozen row identifiers
  }

  /**
   * Initialize frozen row container, subscriptions, and handlers.
   * @returns {void}
   */
  initialize() {
    const fragment = document.createDocumentFragment()

    this.rows = []

    this.topElement.classList.add('tabulator-frozen-rows-holder')

    fragment.appendChild(this.topElement)

    // this.table.columnManager.element.append(this.topElement);
    this.table.columnManager
      .getContentsElement()
      .insertBefore(fragment, this.table.columnManager.headersElement.nextSibling)

    this.subscribe('row-deleting', this.detachRow.bind(this))
    this.subscribe('rows-visible', this.visibleRows.bind(this))

    this.registerDisplayHandler(this.getRows.bind(this), 10)

    if (this.table.options.frozenRows) {
      this.subscribe('data-processed', this.initializeRows.bind(this))
      this.subscribe('row-added', this.initializeRow.bind(this))
      this.subscribe('table-redrawing', this.resizeHolderWidth.bind(this))
      this.subscribe('column-resized', this.resizeHolderWidth.bind(this))
      this.subscribe('column-show', this.resizeHolderWidth.bind(this))
      this.subscribe('column-hide', this.resizeHolderWidth.bind(this))
    }

    this.resizeHolderWidth()
  }

  /**
   * Sync frozen-row holder width to headers.
   * @returns {void}
   */
  resizeHolderWidth() {
    this.topElement.style.minWidth = `${this.table.columnManager.headersElement.offsetWidth}px`
  }

  /**
   * Initialize configured frozen rows from existing rows.
   * @returns {void}
   */
  initializeRows() {
    this.table.rowManager.getRows().forEach((row) => {
      this.initializeRow(row)
    })
  }

  /**
   * Check whether a row should be frozen from config.
   * @param {object} row Internal row.
   * @returns {void}
   */
  initializeRow(row) {
    const frozenRows = this.table.options.frozenRows

    if (typeof frozenRows === 'number') {
      if (row.getPosition() && row.getPosition() + this.rows.length <= frozenRows) {
        this.freezeRow(row)
      }
    } else if (typeof frozenRows === 'function') {
      if (frozenRows.call(this.table, row.getComponent())) {
        this.freezeRow(row)
      }
    } else if (Array.isArray(frozenRows)) {
      if (frozenRows.includes(row.data[this.options('frozenRowsField')])) {
        this.freezeRow(row)
      }
    }
  }

  /**
   * Check if a row is currently frozen.
   * @param {object} row Internal row.
   * @returns {boolean}
   */
  isRowFrozen(row) {
    const index = this.rows.indexOf(row)
    return index > -1
  }

  /**
   * Check if any rows are frozen.
   * @returns {boolean}
   */
  isFrozen() {
    return !!this.rows.length
  }

  /**
   * Append frozen rows to visible row list.
   * @param {Array<object>} viewable Viewable rows.
   * @param {Array<object>} rows Display rows.
   * @returns {Array<object>}
   */
  visibleRows(viewable, rows) {
    this.rows.forEach((row) => {
      rows.push(row)
    })

    return rows
  }

  // filter frozen rows out of display data
  /**
   * Filter frozen rows from normal display rows.
   * @param {Array<object>} rows Display rows.
   * @returns {Array<object>}
   */
  getRows(rows) {
    if (!this.rows.length) {
      return rows.slice(0)
    }

    const frozenRows = new Set(this.rows)

    return rows.filter((row) => !frozenRows.has(row))
  }

  /**
   * Freeze a row at the top of the table.
   * @param {object} row Internal row.
   * @returns {void}
   */
  freezeRow(row) {
    if (!row.modules.frozen) {
      row.modules.frozen = true
      this.topElement.appendChild(row.getElement())
      row.initialize()
      row.normalizeHeight()

      this.rows.push(row)

      this.refreshData(false, 'display')

      this.table.rowManager.adjustTableSize()

      this.styleRows()
    } else {
      console.warn('Freeze Error - Row is already frozen')
    }
  }

  /**
   * Unfreeze a previously frozen row.
   * @param {object} row Internal row.
   * @returns {void}
   */
  unfreezeRow(row) {
    if (row.modules.frozen) {
      row.modules.frozen = false

      this.detachRow(row)

      this.table.rowManager.adjustTableSize()

      this.refreshData(false, 'display')

      if (this.rows.length) {
        this.styleRows()
      }
    } else {
      console.warn('Freeze Error - Row is already unfrozen')
    }
  }

  /**
   * Detach a frozen row from internal list and DOM.
   * @param {object} row Internal row.
   * @returns {void}
   */
  detachRow(row) {
    const index = this.rows.indexOf(row)

    if (index > -1) {
      const rowEl = row.getElement()

      if (rowEl.parentNode) {
        rowEl.parentNode.removeChild(rowEl)
      }

      this.rows.splice(index, 1)
    }
  }

  /**
   * Apply row striping/styles to frozen rows.
   * @returns {void}
   */
  styleRows() {
    this.rows.forEach((row, i) => {
      this.table.rowManager.styleRow(row, i)
    })
  }
}
