import CoreFeature from '../../core/CoreFeature.js'
import RangeComponent from './RangeComponent'

export default class Range extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   * @param {object} rangeManager Range manager.
   * @param {object} [start] Start boundary cell/column.
   * @param {object} [end] End boundary cell/column.
   */
  constructor(table, rangeManager, start, end) {
    super(table)

    this.rangeManager = rangeManager
    this.element = null
    this.initialized = false
    this.initializing = {
      start: false,
      end: false
    }
    this.destroyed = false

    this.top = 0
    this.bottom = 0
    this.left = 0
    this.right = 0

    this.table = table
    this.start = { row: undefined, col: undefined }
    this.end = { row: undefined, col: undefined }

    if (this.rangeManager.rowHeader) {
      this.left = 1
      this.right = 1
      this.start.col = 1
      this.end.col = 1
    }

    this.initElement()

    setTimeout(() => {
      this.initBounds(start, end)
    })
  }

  /**
   * Initialize range DOM element.
   * @returns {void}
   */
  initElement() {
    this.element = document.createElement('div')
    this.element.classList.add('tabulator-range')
  }

  /**
   * Initialize start/end bounds.
   * @param {object} [start] Start boundary.
   * @param {object} [end] End boundary.
   * @returns {void}
   */
  initBounds(start, end) {
    this._updateMinMax()

    if (start) {
      this.setBounds(start, end || start)
    }
  }

  /// ////////////////////////////////
  /// ////   Boundary Setup    ///////
  /// ////////////////////////////////

  /**
   * Set range start coordinates.
   * @param {number} row Row index.
   * @param {number} col Column index.
   * @returns {void}
   */
  setStart(row, col) {
    if (this.start.row !== row || this.start.col !== col) {
      this.start.row = row
      this.start.col = col

      this.initializing.start = true
      this._updateMinMax()
    }
  }

  /**
   * Set range end coordinates.
   * @param {number} row Row index.
   * @param {number} col Column index.
   * @returns {void}
   */
  setEnd(row, col) {
    if (this.end.row !== row || this.end.col !== col) {
      this.end.row = row
      this.end.col = col

      this.initializing.end = true
      this._updateMinMax()
    }
  }

  /**
   * Set range bounds from boundary components.
   * @param {object} start Start boundary.
   * @param {object} [end] End boundary.
   * @param {Array<object>} [visibleRows] Visible rows.
   * @returns {void}
   */
  setBounds(start, end, visibleRows) {
    if (start) {
      this.setStartBound(start)
    }

    this.setEndBound(end || start)
    this.rangeManager.layoutElement(visibleRows)
  }

  /**
   * Resolve and set start bound from element.
   * @param {object} element Cell/column element.
   * @returns {void}
   */
  setStartBound(element) {
    let row, col

    if (element.type === 'column') {
      if (this.rangeManager.columnSelection) {
        this.setStart(0, element.getPosition() - 1)
      }
    } else {
      row = element.row.position - 1
      col = element.column.getPosition() - 1

      if (element.column === this.rangeManager.rowHeader) {
        this.setStart(row, 1)
      } else {
        this.setStart(row, col)
      }
    }
  }

  /**
   * Resolve and set end bound from element.
   * @param {object} element Cell/column element.
   * @returns {void}
   */
  setEndBound(element) {
    const rowsCount = this._getTableRows().length
    let row
    let col
    let isRowHeader

    if (element.type === 'column') {
      if (this.rangeManager.columnSelection) {
        if (this.rangeManager.selecting === 'column') {
          this.setEnd(rowsCount - 1, element.getPosition() - 1)
        } else if (this.rangeManager.selecting === 'cell') {
          this.setEnd(0, element.getPosition() - 1)
        }
      }
    } else {
      row = element.row.position - 1
      col = element.column.getPosition() - 1
      isRowHeader = element.column === this.rangeManager.rowHeader

      if (this.rangeManager.selecting === 'row') {
        this.setEnd(row, this._getTableColumns().length - 1)
      } else if (this.rangeManager.selecting !== 'row' && isRowHeader) {
        this.setEnd(row, 0)
      } else if (this.rangeManager.selecting === 'column') {
        this.setEnd(rowsCount - 1, col)
      } else {
        this.setEnd(row, col)
      }
    }
  }

  /**
   * Recompute normalized min/max bounds and emit range events.
   * @returns {void}
   */
  _updateMinMax() {
    this.top = Math.min(this.start.row, this.end.row)
    this.bottom = Math.max(this.start.row, this.end.row)
    this.left = Math.min(this.start.col, this.end.col)
    this.right = Math.max(this.start.col, this.end.col)

    if (this.initialized) {
      this.dispatchExternal('rangeChanged', this.getComponent())
      return
    }

    if (this.initializing.start && this.initializing.end) {
      this.initialized = true
      this.dispatchExternal('rangeAdded', this.getComponent())
    }
  }

  /**
   * Get visible table columns by index.
   * @returns {Array<object>}
   */
  _getTableColumns() {
    return this.table.columnManager.getVisibleColumnsByIndex()
  }

  /**
   * Get display rows excluding non-row types.
   * @returns {Array<object>}
   */
  _getTableRows() {
    return this.table.rowManager.getDisplayRows().filter((row) => row.type === 'row')
  }

  /// ////////////////////////////////
  /// ////      Rendering      ///////
  /// ////////////////////////////////

  /**
   * Layout range highlight element.
   * @returns {void}
   */
  layout() {
    let _vDomTop = this.table.rowManager.renderer.vDomTop
    let _vDomBottom = this.table.rowManager.renderer.vDomBottom
    let _vDomLeft = this.table.columnManager.renderer.leftCol
    let _vDomRight = this.table.columnManager.renderer.rightCol
    let top
    let bottom
    let left
    let right
    let topLeftCell
    let bottomRightCell
    let topLeftCellEl
    let bottomRightCellEl
    let topLeftRowEl
    let bottomRightRowEl

    if (this.table.options.renderHorizontal === 'virtual' && this.rangeManager.rowHeader) {
      _vDomRight += 1
    }

    if (_vDomTop == null) {
      _vDomTop = 0
    }

    if (_vDomBottom == null) {
      _vDomBottom = Infinity
    }

    if (_vDomLeft == null) {
      _vDomLeft = 0
    }

    if (_vDomRight == null) {
      _vDomRight = Infinity
    }

    if (this.overlaps(_vDomLeft, _vDomTop, _vDomRight, _vDomBottom)) {
      top = Math.max(this.top, _vDomTop)
      bottom = Math.min(this.bottom, _vDomBottom)
      left = Math.max(this.left, _vDomLeft)
      right = Math.min(this.right, _vDomRight)

      topLeftCell = this.rangeManager.getCell(top, left)
      bottomRightCell = this.rangeManager.getCell(bottom, right)
      topLeftCellEl = topLeftCell.getElement()
      bottomRightCellEl = bottomRightCell.getElement()
      topLeftRowEl = topLeftCell.row.getElement()
      bottomRightRowEl = bottomRightCell.row.getElement()

      this.element.classList.add('tabulator-range-active')
      // this.element.classList.toggle("tabulator-range-active", this === this.rangeManager.activeRange);

      if (this.table.rtl) {
        this.element.style.right = `${topLeftRowEl.offsetWidth - topLeftCellEl.offsetLeft - topLeftCellEl.offsetWidth}px`
        this.element.style.width = `${topLeftCellEl.offsetLeft + topLeftCellEl.offsetWidth - bottomRightCellEl.offsetLeft}px`
      } else {
        this.element.style.left = `${topLeftRowEl.offsetLeft + topLeftCellEl.offsetLeft}px`
        this.element.style.width = `${bottomRightCellEl.offsetLeft + bottomRightCellEl.offsetWidth - topLeftCellEl.offsetLeft}px`
      }

      this.element.style.top = `${topLeftRowEl.offsetTop}px`
      this.element.style.height = `${bottomRightRowEl.offsetTop + bottomRightRowEl.offsetHeight - topLeftRowEl.offsetTop}px`
    }
  }

  /**
   * Check if cell matches top-left bound.
   * @param {object} cell Internal cell.
   * @returns {boolean}
   */
  atTopLeft(cell) {
    return cell.row.position - 1 === this.top && cell.column.getPosition() - 1 === this.left
  }

  /**
   * Check if cell matches bottom-right bound.
   * @param {object} cell Internal cell.
   * @returns {boolean}
   */
  atBottomRight(cell) {
    return cell.row.position - 1 === this.bottom && cell.column.getPosition() - 1 === this.right
  }

  /**
   * Check if range occupies a cell.
   * @param {object} cell Internal cell.
   * @returns {boolean}
   */
  occupies(cell) {
    return this.occupiesRow(cell.row) && this.occupiesColumn(cell.column)
  }

  /**
   * Check if range occupies a row.
   * @param {object} row Internal row.
   * @returns {boolean}
   */
  occupiesRow(row) {
    const position = row.position - 1

    return this.top <= position && position <= this.bottom
  }

  /**
   * Check if range occupies a column.
   * @param {object} col Internal column.
   * @returns {boolean}
   */
  occupiesColumn(col) {
    const position = col.getPosition() - 1

    return this.left <= position && position <= this.right
  }

  /**
   * Check if range overlaps bounds.
   * @param {number} left Left index.
   * @param {number} top Top index.
   * @param {number} right Right index.
   * @param {number} bottom Bottom index.
   * @returns {boolean}
   */
  overlaps(left, top, right, bottom) {
    return !(this.left > right || left > this.right || this.top > bottom || top > this.bottom)
  }

  /**
   * Get range data as array of row objects.
   * @returns {Array<object>}
   */
  getData() {
    const data = []
    const rows = this.getRows()
    const columns = this.getColumns()

    rows.forEach((row) => {
      const rowData = row.getData()
      const result = {}

      columns.forEach((column) => {
        result[column.field] = rowData[column.field]
      })

      data.push(result)
    })

    return data
  }

  /**
   * Get range cells.
   * @param {boolean} [structured] Return 2D structure.
   * @param {boolean} [component] Return components.
   * @returns {Array<object>}
   */
  getCells(structured, component) {
    let cells = []
    const rows = this.getRows()
    const columns = this.getColumns()

    if (structured) {
      cells = rows.map((row) => {
        const arr = []

        row.getCells().forEach((cell) => {
          if (columns.includes(cell.column)) {
            arr.push(component ? cell.getComponent() : cell)
          }
        })

        return arr
      })
    } else {
      rows.forEach((row) => {
        row.getCells().forEach((cell) => {
          if (columns.includes(cell.column)) {
            cells.push(component ? cell.getComponent() : cell)
          }
        })
      })
    }

    return cells
  }

  /**
   * Get range cells as a structured component matrix.
   * @returns {Array<Array<object>>}
   */
  getStructuredCells() {
    return this.getCells(true, true)
  }

  /**
   * Get range rows.
   * @returns {Array<object>}
   */
  getRows() {
    return this._getTableRows().slice(this.top, this.bottom + 1)
  }

  /**
   * Get range columns.
   * @returns {Array<object>}
   */
  getColumns() {
    return this._getTableColumns().slice(this.left, this.right + 1)
  }

  /**
   * Clear values across range cells.
   * @returns {void}
   */
  clearValues() {
    const cells = this.getCells()
    const clearValue = this.table.options.selectableRangeClearCellsValue

    this.table.blockRedraw()

    cells.forEach((cell) => {
      cell.setValue(clearValue)
    })

    this.table.restoreRedraw()
  }

  /**
   * Get start/end range bounds.
   * @param {boolean} [component] Return cell components.
   * @returns {{start:object|null,end:object|null}}
   */
  getBounds(component) {
    const cells = this.getCells(false, component)
    const output = {
      start: null,
      end: null
    }

    if (cells.length) {
      output.start = cells[0]
      output.end = cells[cells.length - 1]
    } else {
      console.warn('No bounds defined on range')
    }

    return output
  }

  /**
   * Get range component wrapper.
   * @returns {RangeComponent}
   */
  getComponent() {
    if (!this.component) {
      this.component = new RangeComponent(this)
    }
    return this.component
  }

  /**
   * Destroy range and optionally notify manager.
   * @param {boolean} [notify] Notify range manager.
   * @returns {void}
   */
  destroy(notify) {
    this.destroyed = true

    this.element.remove()

    if (notify) {
      this.rangeManager.rangeRemoved(this)
    }

    if (this.initialized) {
      this.dispatchExternal('rangeRemoved', this.getComponent())
    }
  }

  /**
   * Guard against use-after-destroy for a method.
   * @param {string} func Method name.
   * @returns {boolean}
   */
  destroyedGuard(func) {
    if (this.destroyed) {
      console.warn(`You cannot call the ${func} function on a destroyed range`)
    }

    return !this.destroyed
  }
}
