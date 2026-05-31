// public cell object
/** @typedef {import('../row/RowComponent').default} RowComponent */
/** @typedef {import('../column/ColumnComponent').default} ColumnComponent */
/** @typedef {import('../Tabulator').default} Tabulator */
/** @typedef {import('../../modules/SelectRange/RangeComponent').default} RangeComponent */

export default class CellComponent {
  /**
   * @param {object} cell Internal Cell instance.
   */
  constructor(cell) {
    this._cell = cell

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (name in target) {
          return target[name]
        }

        return target._cell.table.componentFunctionBinder.handle('cell', target._cell, name)
      }
    })
  }

  /**
   * Get the current cell value.
   */
  getValue() {
    return this._cell.getValue()
  }

  /**
   * Get the previous cell value.
   */
  getOldValue() {
    return this._cell.getOldValue()
  }

  /**
   * Get the initial cell value captured during construction.
   */
  getInitialValue() {
    return this._cell.initialValue
  }

  /**
   * Get the DOM element for this cell.
   * @returns {HTMLElement}
   */
  getElement() {
    return this._cell.getElement()
  }

  /**
   * Get the row component this cell belongs to.
   * @returns {RowComponent}
   */
  getRow() {
    return this._cell.row.getComponent()
  }

  /**
   * Get row data for this cell.
   * @param {"data" | "download" | "clipboard"} [transform] Optional transform lookup key.
   * @returns {object}
   */
  getData(transform) {
    return this._cell.row.getData(transform)
  }

  /**
   * Get this component type.
   * @returns {"cell" | "header"}
   */
  getType() {
    return 'cell'
  }

  /**
   * Get the backing column field.
   * @returns {string}
   */
  getField() {
    return this._cell.column.getField()
  }

  /**
   * Get the column component this cell belongs to.
   * @returns {ColumnComponent}
   */
  getColumn() {
    return this._cell.column.getComponent()
  }

  /**
   * Set the cell value.
   * @param {*} value New value.
   * @param {boolean} [mutate=true] Run value mutators before setting.
   */
  setValue(value, mutate = true) {
    this._cell.setValue(value, mutate)
  }

  /**
   * Restore the previous value.
   */
  restoreOldValue() {
    this._cell.setValueActual(this._cell.getOldValue())
  }

  /**
   * Restore the initial value.
   */
  restoreInitialValue() {
    this._cell.setValueActual(this._cell.initialValue)
  }

  /**
   * Recalculate row height based on this cell.
   */
  checkHeight() {
    this._cell.checkHeight()
  }

  /**
   * Get the parent table instance.
   * @returns {Tabulator}
   */
  getTable() {
    return this._cell.table
  }

  /**
   * Get the internal cell instance.
   * @returns {object}
   */
  _getSelf() {
    return this._cell
  }

  _callBinder(name, ...args) {
    const handler = this._cell.table.componentFunctionBinder.handle('cell', this._cell, name)
    if (handler) {
      return handler(...args)
    }
    throw new Error(`Module providing cell component function '${name}' is not installed.`)
  }

  /**
   * Get all ranges that overlap this cell.
   * @returns {RangeComponent[]} Array of Range Components.
   */
  getRanges() {
    return this._callBinder('getRanges')
  }

  /**
   * Check if the cell has been edited.
   * @returns {boolean} True if edited.
   */
  isEdited() {
    return this._callBinder('isEdited')
  }

  /**
   * Clear the edited flag on the cell.
   */
  clearEdited() {
    this._callBinder('clearEdited')
  }

  /**
   * Programmatically cause a cell to open its editor.
   * @param {boolean} [ignoreEditable] Ignore editable settings.
   */
  edit(ignoreEditable) {
    return this._callBinder('edit', ignoreEditable)
  }

  /**
   * Programmatically cancel a cell edit in progress.
   */
  cancelEdit() {
    this._callBinder('cancelEdit')
  }

  /**
   * Move editor focus to the previous editable cell.
   * @returns {boolean} True if move successful.
   */
  navigatePrev() {
    return this._callBinder('navigatePrev')
  }

  /**
   * Move editor focus to the next editable cell.
   * @returns {boolean} True if move successful.
   */
  navigateNext() {
    return this._callBinder('navigateNext')
  }

  /**
   * Move editor focus left.
   * @returns {boolean} True if move successful.
   */
  navigateLeft() {
    return this._callBinder('navigateLeft')
  }

  /**
   * Move editor focus right.
   * @returns {boolean} True if move successful.
   */
  navigateRight() {
    return this._callBinder('navigateRight')
  }

  /**
   * Move editor focus up.
   */
  navigateUp() {
    this._callBinder('navigateUp')
  }

  /**
   * Move editor focus down.
   */
  navigateDown() {
    this._callBinder('navigateDown')
  }

  /**
   * Open popup menu.
   * @param {string} contents Popup content.
   * @param {"click" | "right" | "bottom" | "left" | "top" | "center"} [position] Popup position.
   * @returns {*}
   */
  popup(contents, position) {
    return this._callBinder('popup', contents, position)
  }

  /**
   * Check if the cell has previously passed validation.
   * @returns {boolean|object[]} True if valid, or array of failed validator definitions/rules.
   */
  isValid() {
    return this._callBinder('isValid')
  }

  /**
   * Clear the invalid flag on the cell.
   */
  clearValidation() {
    this._callBinder('clearValidation')
  }

  /**
   * Validate the cell.
   * @returns {boolean|object[]} True if passes validation, or array of failed validator definitions/rules.
   */
  validate() {
    return this._callBinder('validate')
  }
}
