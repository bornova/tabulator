// public column object
/** @typedef {import('../Tabulator').default} Tabulator */
/** @typedef {import('../cell/CellComponent').default} CellComponent */
/** @typedef {import('../../modules/SelectRange/RangeComponent').default} RangeComponent */

export default class ColumnComponent {
  /**
   * @param {object} column Internal Column instance.
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
   * @returns {import('../types').ColumnDefinition}
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
   * @returns {CellComponent[]}
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
   * @returns {Array<ColumnComponent>}
   */
  getSubColumns() {
    return this._column.columns.map((column) => column.getComponent())
  }

  /**
   * Get parent column component if this column is grouped.
   * @returns {ColumnComponent|false}
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
   * @param {"left" | "center" | "middle" | "right"} [position] Scroll alignment position.
   * @param {boolean} [ifVisible] Skip scroll when the column is already visible.
   * @returns {Promise<void>}
   */
  scrollTo(position, ifVisible) {
    return this._column.table.columnManager.scrollToColumn(this._column, position, ifVisible)
  }

  /**
   * Get parent table instance.
   * @returns {Tabulator}
   */
  getTable() {
    return this._column.table
  }

  /**
   * Move this column relative to another column.
   * @param {ColumnComponent|HTMLElement|string} to Target column lookup.
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
   * @returns {ColumnComponent|false}
   */
  getNextColumn() {
    const nextCol = this._column.nextColumn()

    return nextCol ? nextCol.getComponent() : false
  }

  /**
   * Get previous visible column component.
   * @returns {ColumnComponent|false}
   */
  getPrevColumn() {
    const prevCol = this._column.prevColumn()

    return prevCol ? prevCol.getComponent() : false
  }

  /**
   * Update this column definition.
   * @param {import('../types').ColumnDefinition} updates Partial definition updates.
   * @returns {Promise<ColumnComponent>}
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
   */
  setWidth(width) {
    const result = width === true ? this._column.reinitializeWidth(true) : this._column.setWidth(width)

    this._column.table.columnManager.rerenderColumns(true)

    return result
  }

  _callBinder(name, ...args) {
    const handler = this._column.table.componentFunctionBinder.handle('column', this._column, name)
    if (handler) {
      return handler(...args)
    }
    throw new Error(`Module providing column component function '${name}' is not installed.`)
  }

  /**
   * Focus the header filter element for this column.
   */
  headerFilterFocus() {
    this._callBinder('headerFilterFocus')
  }

  /**
   * Rebuild the header filter element.
   */
  reloadHeaderFilter() {
    this._callBinder('reloadHeaderFilter')
  }

  /**
   * Get the current header filter value of a column.
   * @returns {*}
   */
  getHeaderFilterValue() {
    return this._callBinder('getHeaderFilterValue')
  }

  /**
   * Set the value of the columns header filter element.
   * @param {*} value Header filter value.
   */
  setHeaderFilterValue(value) {
    this._callBinder('setHeaderFilterValue', value)
  }

  /**
   * Get all ranges that overlap this column.
   * @returns {RangeComponent[]} Array of Range Components.
   */
  getRanges() {
    return this._callBinder('getRanges')
  }

  /**
   * Open popup menu.
   * @param {string} contents Popup content.
   * @param {"click" | "right" | "bottom" | "left" | "top" | "center"} [position] Popup position.
   */
  popup(contents, position) {
    this._callBinder('popup', contents, position)
  }

  /**
   * Validate this column.
   * @returns {boolean|CellComponent[]} True if passes validation, or array of failed cell components.
   */
  validate() {
    return this._callBinder('validate')
  }
}
