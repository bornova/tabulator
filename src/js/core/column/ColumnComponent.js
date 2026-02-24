// public column object
export default class ColumnComponent {
  /**
   * @param {object} column Internal Column instance.
   * @returns {ColumnComponent}
   */
  constructor(column) {
    this._column = column
    this.type = 'ColumnComponent'

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (target[name] !== undefined) {
          return target[name]
        }

        return target._column.table.componentFunctionBinder.handle('column', target._column, name)
      }
    })
  }

  /**
   * Get the column header element.
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._column.getElement()
  }

  /**
   * Get the column definition object.
   * @returns {object}
   */
  getDefinition() {
    return this._column.getDefinition()
  }

  /**
   * Get the column field.
   * @returns {string}
   */
  getField() {
    return this._column.getField()
  }

  /**
   * Get the download title for the column.
   * @returns {string|null}
   */
  getTitleDownload() {
    return this._column.getTitleDownload()
  }

  /**
   * Get cell components belonging to this column.
   * @returns {Array<object>}
   */
  getCells() {
    return this._column.cells.map((cell) => cell.getComponent())
  }

  /**
   * Check whether the column is visible.
   * @returns {boolean}
   */
  isVisible() {
    return this._column.visible
  }

  /**
   * Show this column (or all child columns for groups).
   */
  show() {
    if (this._column.isGroup) {
      this._column.columns.forEach((column) => {
        column.show()
      })
    } else {
      this._column.show()
    }
  }

  /**
   * Hide this column (or all child columns for groups).
   */
  hide() {
    if (this._column.isGroup) {
      this._column.columns.forEach((column) => {
        column.hide()
      })
    } else {
      this._column.hide()
    }
  }

  /**
   * Toggle column visibility.
   */
  toggle() {
    this._column.visible ? this.hide() : this.show()
  }

  /**
   * Delete this column.
   * @returns {Promise<void>}
   */
  delete() {
    return this._column.delete()
  }

  /**
   * Get direct child column components.
   * @returns {Array<object>}
   */
  getSubColumns() {
    return this._column.columns.map((column) => column.getComponent())
  }

  /**
   * Get parent column component if this column is grouped.
   * @returns {object|boolean}
   */
  getParentColumn() {
    return this._column.getParentComponent()
  }

  /**
   * Get internal column instance.
   * @returns {object}
   */
  _getSelf() {
    return this._column
  }

  /**
   * Scroll this column into view.
   * @param {string} [position] Scroll alignment position.
   * @param {boolean} [ifVisible] Only scroll if not visible when true.
   * @returns {Promise<void>|boolean}
   */
  scrollTo(position, ifVisible) {
    return this._column.table.columnManager.scrollToColumn(this._column, position, ifVisible)
  }

  /**
   * Get parent table instance.
   * @returns {object}
   */
  getTable() {
    return this._column.table
  }

  /**
   * Move this column relative to another column.
   * @param {*} to Target column lookup.
   * @param {boolean} [after] Insert after target when true.
   */
  move(to, after) {
    const toColumn = this._column.table.columnManager.findColumn(to)

    if (toColumn) {
      this._column.table.columnManager.moveColumn(this._column, toColumn, after)
    } else {
      console.warn('Move Error - No matching column found:', to)
    }
  }

  /**
   * Get next visible column component.
   * @returns {object|boolean}
   */
  getNextColumn() {
    const nextCol = this._column.nextColumn()

    return nextCol ? nextCol.getComponent() : false
  }

  /**
   * Get previous visible column component.
   * @returns {object|boolean}
   */
  getPrevColumn() {
    const prevCol = this._column.prevColumn()

    return prevCol ? prevCol.getComponent() : false
  }

  /**
   * Update this column definition.
   * @param {object} updates Partial definition updates.
   * @returns {Promise<object>}
   */
  updateDefinition(updates) {
    return this._column.updateDefinition(updates)
  }

  /**
   * Get the computed column width.
   * @returns {number}
   */
  getWidth() {
    return this._column.getWidth()
  }

  /**
   * Set column width or reset to fit-content width.
   * @param {number|string|boolean} width Pixel/percent width, or true to refit width.
   * @returns {*}
   */
  setWidth(width) {
    const result = width === true ? this._column.reinitializeWidth(true) : this._column.setWidth(width)

    this._column.table.columnManager.rerenderColumns(true)

    return result
  }
}
