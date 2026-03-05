export default class RangeComponent {
  /**
   * @param {object} range Internal range instance.
   * @returns {RangeComponent}
   */
  constructor(range) {
    this._range = range

    return new Proxy(this, {
      get(target, name, receiver) {
        if (Reflect.has(target, name)) {
          return Reflect.get(target, name, receiver)
        }

        return target._range.table.componentFunctionBinder.handle('range', target._range, name)
      }
    })
  }

  /**
   * Resolve public cell component or internal cell to internal cell instance.
   * @param {*} cell Cell-like value.
   * @returns {*}
   */
  _resolveCell(cell) {
    return cell ? cell._cell || cell : cell
  }

  /**
   * Get the range overlay element.
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._range.element
  }

  /**
   * Get range values as a data structure.
   * @returns {*}
   */
  getData() {
    return this._range.getData()
  }

  /**
   * Get all cells in the range.
   * @returns {Array<object>}
   */
  getCells() {
    return this._range.getCells(true, true)
  }

  /**
   * Get cells grouped by row/column structure.
   * @returns {Array<Array<object>>}
   */
  getStructuredCells() {
    return this._range.getStructuredCells()
  }

  /**
   * Get row components covered by this range.
   * @returns {Array<object>}
   */
  getRows() {
    return this._range.getRows().map((row) => row.getComponent())
  }

  /**
   * Get column components covered by this range.
   * @returns {Array<object>}
   */
  getColumns() {
    return this._range.getColumns().map((column) => column.getComponent())
  }

  /**
   * Get range bounds.
   * @returns {object}
   */
  getBounds() {
    return this._range.getBounds()
  }

  /**
   * Get the top boundary cell.
   * @returns {*}
   */
  getTopEdge() {
    return this._range.top
  }

  /**
   * Get the bottom boundary cell.
   * @returns {*}
   */
  getBottomEdge() {
    return this._range.bottom
  }

  /**
   * Get the left boundary cell.
   * @returns {*}
   */
  getLeftEdge() {
    return this._range.left
  }

  /**
   * Get the right boundary cell.
   * @returns {*}
   */
  getRightEdge() {
    return this._range.right
  }

  /**
   * Set both start and end bounds.
   * @param {*} start Start cell or cell component.
   * @param {*} end End cell or cell component.
   */
  setBounds(start, end) {
    if (this._range.destroyedGuard('setBounds')) {
      this._range.setBounds(this._resolveCell(start), this._resolveCell(end))
    }
  }

  /**
   * Set the start bound.
   * @param {*} start Start cell or cell component.
   */
  setStartBound(start) {
    if (this._range.destroyedGuard('setStartBound')) {
      this._range.setStartBound(this._resolveCell(start))
      this._range.rangeManager.layoutElement()
    }
  }

  /**
   * Set the end bound.
   * @param {*} end End cell or cell component.
   */
  setEndBound(end) {
    if (this._range.destroyedGuard('setEndBound')) {
      this._range.setEndBound(this._resolveCell(end))
      this._range.rangeManager.layoutElement()
    }
  }

  /**
   * Clear values inside the range.
   */
  clearValues() {
    if (this._range.destroyedGuard('clearValues')) {
      this._range.clearValues()
    }
  }

  /**
   * Remove this range.
   */
  remove() {
    if (this._range.destroyedGuard('remove')) {
      this._range.destroy(true)
    }
  }
}
