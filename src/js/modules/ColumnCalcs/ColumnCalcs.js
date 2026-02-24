import Module from '../../core/Module.js'

import CalcComponent from './CalcComponent.js'

import Cell from '../../core/cell/Cell.js'
import Column from '../../core/column/Column.js'
import Row from '../../core/row/Row.js'

import defaultCalculations from './defaults/calculations.js'

export default class ColumnCalcs extends Module {
  static moduleName = 'columnCalcs'

  // load defaults
  static calculations = defaultCalculations

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.topCalcs = []
    this.botCalcs = []
    this.genColumn = false
    this.topElement = this.createElement()
    this.botElement = this.createElement()
    this.topRow = false
    this.botRow = false
    this.topInitialized = false
    this.botInitialized = false

    this.blocked = false
    this.recalcAfterBlock = false

    this.registerTableOption('columnCalcs', true)

    this.registerColumnOption('topCalc')
    this.registerColumnOption('topCalcParams')
    this.registerColumnOption('topCalcFormatter')
    this.registerColumnOption('topCalcFormatterParams')
    this.registerColumnOption('bottomCalc')
    this.registerColumnOption('bottomCalcParams')
    this.registerColumnOption('bottomCalcFormatter')
    this.registerColumnOption('bottomCalcFormatterParams')
  }

  /**
   * Create calc row holder element.
   * @returns {HTMLDivElement}
   */
  createElement() {
    const element = document.createElement('div')
    element.classList.add('tabulator-calcs-holder')
    return element
  }

  /**
   * Initialize calc subscriptions and APIs.
   */
  initialize() {
    this.genColumn = new Column({ field: 'value' }, this)

    this.subscribe('cell-value-changed', this.cellValueChanged.bind(this))
    this.subscribe('column-init', this.initializeColumnCheck.bind(this))
    this.subscribe('row-deleted', this.rowsUpdated.bind(this))
    this.subscribe('scroll-horizontal', this.scrollHorizontal.bind(this))
    this.subscribe('row-added', this.rowsUpdated.bind(this))
    this.subscribe('column-moved', this.recalcActiveRows.bind(this))
    this.subscribe('column-add', this.recalcActiveRows.bind(this))
    this.subscribe('data-refreshed', this.recalcActiveRowsRefresh.bind(this))
    this.subscribe('table-redraw', this.tableRedraw.bind(this))
    this.subscribe('rows-visible', this.visibleRows.bind(this))
    this.subscribe('scrollbar-vertical', this.adjustForScrollbar.bind(this))

    this.subscribe('redraw-blocked', this.blockRedraw.bind(this))
    this.subscribe('redraw-restored', this.restoreRedraw.bind(this))

    this.subscribe('table-redrawing', this.resizeHolderWidth.bind(this))
    this.subscribe('column-resized', this.resizeHolderWidth.bind(this))
    this.subscribe('column-show', this.resizeHolderWidth.bind(this))
    this.subscribe('column-hide', this.resizeHolderWidth.bind(this))

    this.registerTableFunction('getCalcResults', this.getResults.bind(this))
    this.registerTableFunction('recalc', this.userRecalc.bind(this))

    this.resizeHolderWidth()
  }

  /**
   * Resize calc holder to header width.
   */
  resizeHolderWidth() {
    this.topElement.style.minWidth = `${this.table.columnManager.headersElement.offsetWidth}px`
  }

  /**
   * Recalculate calcs on table redraw.
   * @param {boolean} force Force redraw after recalc.
   */
  tableRedraw(force) {
    this.recalc(this.table.rowManager.activeRows)

    if (force) {
      this.redraw()
    }
  }

  /**
   * Block calc redraw updates.
   */
  blockRedraw() {
    this.blocked = true
    this.recalcAfterBlock = false
  }

  /**
   * Restore redraw and run deferred recalculation.
   */
  restoreRedraw() {
    this.blocked = false

    if (this.recalcAfterBlock) {
      this.recalcAfterBlock = false
      this.recalcActiveRowsRefresh()
    }
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////
  /**
   * Public API: recalculate active-row calcs.
   */
  userRecalc() {
    this.recalc(this.table.rowManager.activeRows)
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Check redraw block state and queue recalc if blocked.
   * @returns {boolean}
   */
  blockCheck() {
    if (this.blocked) {
      this.recalcAfterBlock = true
    }

    return this.blocked
  }

  /**
   * Inject calc rows into visible row list.
   * @param {Array<object>} viewable Viewable rows.
   * @param {Array<object>} rows Visible rows.
   * @returns {Array<object>}
   */
  visibleRows(viewable, rows) {
    if (this.topRow) {
      rows.unshift(this.topRow)
    }

    if (this.botRow) {
      rows.push(this.botRow)
    }

    return rows
  }

  /**
   * Recalculate after row add/delete updates.
   * @param {object} row Updated row.
   */
  rowsUpdated(row) {
    if (this.table.options.groupBy) {
      this.recalcRowGroup(row)
    } else {
      this.recalcActiveRows()
    }
  }

  /**
   * Recalculate active rows or full tree/group set on refresh.
   */
  recalcActiveRowsRefresh() {
    if (this.table.options.groupBy && this.table.options.dataTreeStartExpanded && this.table.options.dataTree) {
      this.recalcAll()
    } else {
      this.recalcActiveRows()
    }
  }

  /**
   * Recalculate calcs for currently active rows.
   */
  recalcActiveRows() {
    this.recalc(this.table.rowManager.activeRows)
  }

  /**
   * Trigger recalc when a calc-enabled cell value changes.
   * @param {object} cell Internal cell.
   */
  cellValueChanged(cell) {
    if (cell.column.definition.topCalc || cell.column.definition.bottomCalc) {
      if (this.table.options.groupBy) {
        if (this.table.options.columnCalcs === 'table' || this.table.options.columnCalcs === 'both') {
          this.recalcActiveRows()
        }

        if (this.table.options.columnCalcs !== 'table') {
          this.recalcRowGroup(cell.row)
        }
      } else {
        this.recalcActiveRows()
      }
    }
  }

  /**
   * Initialize column calc config when calc options are present.
   * @param {object} column Internal column.
   */
  initializeColumnCheck(column) {
    if (column.definition.topCalc || column.definition.bottomCalc) {
      this.initializeColumn(column)
    }
  }

  // initialize column calcs
  /**
   * Build calc config for a column.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const def = column.definition

    const config = {
      topCalcParams: def.topCalcParams || {},
      botCalcParams: def.bottomCalcParams || {}
    }

    if (def.topCalc) {
      switch (typeof def.topCalc) {
        case 'string':
          if (ColumnCalcs.calculations[def.topCalc]) {
            config.topCalc = ColumnCalcs.calculations[def.topCalc]
          } else {
            console.warn('Column Calc Error - No such calculation found, ignoring: ', def.topCalc)
          }
          break

        case 'function':
          config.topCalc = def.topCalc
          break
      }

      if (config.topCalc) {
        column.modules.columnCalcs = config
        this.topCalcs.push(column)

        if (this.table.options.columnCalcs !== 'group') {
          this.initializeTopRow()
        }
      }
    }

    if (def.bottomCalc) {
      switch (typeof def.bottomCalc) {
        case 'string':
          if (ColumnCalcs.calculations[def.bottomCalc]) {
            config.botCalc = ColumnCalcs.calculations[def.bottomCalc]
          } else {
            console.warn('Column Calc Error - No such calculation found, ignoring: ', def.bottomCalc)
          }
          break

        case 'function':
          config.botCalc = def.bottomCalc
          break
      }

      if (config.botCalc) {
        column.modules.columnCalcs = config
        this.botCalcs.push(column)

        if (this.table.options.columnCalcs !== 'group') {
          this.initializeBottomRow()
        }
      }
    }
  }

  // dummy functions to handle being mock column manager
  /**
   * No-op placeholder for mock column manager API.
   */
  registerColumnField() {}

  /**
   * Remove initialized calc rows from DOM.
   */
  removeCalcs() {
    let changed = false

    if (this.topInitialized) {
      this.topInitialized = false
      if (this.topElement.parentNode) {
        this.topElement.parentNode.removeChild(this.topElement)
      }
      changed = true
    }

    if (this.botInitialized) {
      this.botInitialized = false
      this.footerRemove(this.botElement)
      changed = true
    }

    if (changed) {
      this.table.rowManager.adjustTableSize()
    }
  }

  /**
   * Reinitialize calc rows based on configured calc columns.
   */
  reinitializeCalcs() {
    if (this.topCalcs.length) {
      this.initializeTopRow()
    }

    if (this.botCalcs.length) {
      this.initializeBottomRow()
    }
  }

  /**
   * Initialize top calc row container.
   */
  initializeTopRow() {
    const fragment = document.createDocumentFragment()

    if (!this.topInitialized) {
      fragment.appendChild(this.topElement)

      this.table.columnManager
        .getContentsElement()
        .insertBefore(fragment, this.table.columnManager.headersElement.nextSibling)
      this.topInitialized = true
    }
  }

  /**
   * Initialize bottom calc row container.
   */
  initializeBottomRow() {
    if (!this.botInitialized) {
      this.footerPrepend(this.botElement)
      this.botInitialized = true
    }
  }

  /**
   * Sync calc footer horizontal scroll.
   * @param {number} left Horizontal scroll position.
   */
  scrollHorizontal(left) {
    if (this.botInitialized && this.botRow) {
      this.botElement.scrollLeft = left
    }
  }

  /**
   * Recalculate top/bottom calc rows.
   * @param {Array<object>} rows Internal rows.
   */
  recalc(rows) {
    let data, row

    if (!this.blockCheck()) {
      if (this.topInitialized || this.botInitialized) {
        data = this.rowsToData(rows)

        if (this.topInitialized) {
          if (this.topRow) {
            this.topRow.deleteCells()
          }

          row = this.generateRow('top', data)
          this.topRow = row
          this.topElement.replaceChildren()
          this.topElement.appendChild(row.getElement())
          row.initialize(true)
        }

        if (this.botInitialized) {
          if (this.botRow) {
            this.botRow.deleteCells()
          }

          row = this.generateRow('bottom', data)
          this.botRow = row
          this.botElement.replaceChildren()
          this.botElement.appendChild(row.getElement())
          row.initialize(true)
        }

        this.table.rowManager.adjustTableSize()

        // set resizable handles
        if (this.table.modExists('frozenColumns')) {
          this.table.modules.frozenColumns.layout()
        }
      }
    }
  }

  /**
   * Recalculate the row group containing a row.
   * @param {object} row Internal row.
   */
  recalcRowGroup(row) {
    this.recalcGroup(this.table.modules.groupRows.getRowGroup(row))
  }

  /**
   * Recalculate all table/group calc rows.
   */
  recalcAll() {
    if (this.topCalcs.length || this.botCalcs.length) {
      if (this.table.options.columnCalcs !== 'group') {
        this.recalcActiveRows()
      }

      if (this.table.options.groupBy && this.table.options.columnCalcs !== 'table') {
        const groups = this.table.modules.groupRows.getChildGroups()

        groups.forEach((group) => {
          this.recalcGroup(group)
        })
      }
    }
  }

  /**
   * Recalculate calc rows for a group.
   * @param {object} group Internal group.
   */
  recalcGroup(group) {
    let data, rowData

    if (!this.blockCheck()) {
      if (group) {
        if (group.calcs) {
          if (group.calcs.bottom || group.calcs.top) {
            data = this.rowsToData(group.rows)
          }

          if (group.calcs.bottom) {
            rowData = this.generateRowData('bottom', data)

            group.calcs.bottom.updateData(rowData)
            group.calcs.bottom.reinitialize()
          }

          if (group.calcs.top) {
            rowData = this.generateRowData('top', data)

            group.calcs.top.updateData(rowData)
            group.calcs.top.reinitialize()
          }
        }
      }
    }
  }

  // generate top stats row
  /**
   * Generate top calc row for given rows.
   * @param {Array<object>} rows Internal rows.
   * @returns {object}
   */
  generateTopRow(rows) {
    return this.generateRow('top', this.rowsToData(rows))
  }

  // generate bottom stats row
  /**
   * Generate bottom calc row for given rows.
   * @param {Array<object>} rows Internal rows.
   * @returns {object}
   */
  generateBottomRow(rows) {
    return this.generateRow('bottom', this.rowsToData(rows))
  }

  /**
   * Convert rows (and optionally open tree children) to raw data.
   * @param {Array<object>} rows Internal rows.
   * @returns {Array<object>}
   */
  rowsToData(rows) {
    const data = []
    const hasDataTreeColumnCalcs = this.table.options.dataTree && this.table.options.dataTreeChildColumnCalcs
    const dataTree = this.table.modules.dataTree

    rows.forEach((row) => {
      data.push(row.getData())

      if (hasDataTreeColumnCalcs && row.modules.dataTree?.open) {
        this.rowsToData(dataTree.getFilteredTreeChildren(row)).forEach((dataRow) => {
          data.push(dataRow)
        })
      }
    })
    return data
  }

  // generate stats row
  /**
   * Generate a calc row instance for top or bottom position.
   * @param {'top'|'bottom'} pos Calc row position.
   * @param {Array<object>} data Data rows.
   * @returns {object}
   */
  generateRow(pos, data) {
    const rowData = this.generateRowData(pos, data)
    let row

    if (this.table.modExists('mutator')) {
      this.table.modules.mutator.disable()
    }

    row = new Row(rowData, this, 'calc')

    if (this.table.modExists('mutator')) {
      this.table.modules.mutator.enable()
    }

    row.getElement().classList.add('tabulator-calcs', 'tabulator-calcs-' + pos)

    row.component = false

    row.getComponent = () => {
      if (!row.component) {
        row.component = new CalcComponent(row)
      }

      return row.component
    }

    row.generateCells = () => {
      const cells = []

      this.table.columnManager.columnsByIndex.forEach((column) => {
        // set field name of mock column
        this.genColumn.setField(column.getField())
        this.genColumn.hozAlign = column.hozAlign

        if (column.definition[`${pos}CalcFormatter`] && this.table.modExists('format')) {
          this.genColumn.modules.format = {
            formatter: this.table.modules.format.lookupFormatter(column.definition[`${pos}CalcFormatter`]),
            params: column.definition[`${pos}CalcFormatterParams`] || {}
          }
        } else {
          this.genColumn.modules.format = {
            formatter: this.table.modules.format.lookupFormatter('plaintext'),
            params: {}
          }
        }
        row.getElement().classList.add('tabulator-calcs', `tabulator-calcs-${pos}`)
        // ensure css class definition is replicated to calculation cell
        this.genColumn.definition.cssClass = column.definition.cssClass

        // generate cell and assign to correct column
        const cell = new Cell(this.genColumn, row)
        cell.getElement()
        cell.column = column
        cell.setWidth()

        column.cells.push(cell)
        cells.push(cell)

        if (!column.visible) {
          cell.hide()
        }
      })

      row.cells = cells
    }

    return row
  }

  // generate stats row
  /**
   * Generate calc row data object.
   * @param {'top'|'bottom'} pos Calc row position.
   * @param {Array<object>} data Data rows.
   * @returns {object}
   */
  generateRowData(pos, data) {
    const rowData = {}
    const calcs = pos === 'top' ? this.topCalcs : this.botCalcs
    const type = pos === 'top' ? 'topCalc' : 'botCalc'
    let params
    let paramKey

    calcs.forEach((column) => {
      const values = []

      if (column.modules.columnCalcs && column.modules.columnCalcs[type]) {
        data.forEach((item) => {
          values.push(column.getFieldValue(item))
        })

        paramKey = `${type}Params`
        params =
          typeof column.modules.columnCalcs[paramKey] === 'function'
            ? column.modules.columnCalcs[paramKey](values, data)
            : column.modules.columnCalcs[paramKey]

        column.setFieldValue(rowData, column.modules.columnCalcs[type](values, data, params))
      }
    })

    return rowData
  }

  /**
   * Check whether top calcs are configured.
   * @returns {boolean}
   */
  hasTopCalcs() {
    return !!this.topCalcs.length
  }

  /**
   * Check whether bottom calcs are configured.
   * @returns {boolean}
   */
  hasBottomCalcs() {
    return !!this.botCalcs.length
  }

  // handle table redraw
  /**
   * Normalize calc row heights after table redraw.
   */
  redraw() {
    if (this.topRow) {
      this.topRow.normalizeHeight(true)
    }
    if (this.botRow) {
      this.botRow.normalizeHeight(true)
    }
  }

  // return the calculated
  /**
   * Get calculated results for table or grouped rows.
   * @returns {object}
   */
  getResults() {
    let results = {}
    let groups

    if (this.table.options.groupBy && this.table.modExists('groupRows')) {
      groups = this.table.modules.groupRows.getGroups(true)

      groups.forEach((group) => {
        results[group.getKey()] = this.getGroupResults(group)
      })
    } else {
      results = {
        top: this.topRow ? this.topRow.getData() : {},
        bottom: this.botRow ? this.botRow.getData() : {}
      }
    }

    return results
  }

  // get results from a group
  /**
   * Get calc results for a specific group recursively.
   * @param {object} group Group component.
   * @returns {object}
   */
  getGroupResults(group) {
    const groupObj = group._getSelf()
    const subGroups = group.getSubGroups()
    const subGroupResults = {}
    let results

    subGroups.forEach((subgroup) => {
      subGroupResults[subgroup.getKey()] = this.getGroupResults(subgroup)
    })

    results = {
      top: groupObj.calcs.top ? groupObj.calcs.top.getData() : {},
      bottom: groupObj.calcs.bottom ? groupObj.calcs.bottom.getData() : {},
      groups: subGroupResults
    }

    return results
  }

  /**
   * Add calc footer padding for vertical scrollbar width.
   * @param {number} width Scrollbar width.
   */
  adjustForScrollbar(width) {
    if (this.botRow) {
      if (this.table.rtl) {
        this.botElement.style.paddingLeft = `${width}px`
      } else {
        this.botElement.style.paddingRight = `${width}px`
      }
    }
  }
}
