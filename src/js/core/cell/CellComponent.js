// public cell object
export default class CellComponent {
  /**
   * @param {object} cell Internal Cell instance.
   * @returns {CellComponent}
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
   * @returns {*}
   */
  getValue() {
    return this._cell.getValue()
  }

  /**
   * Get the previous cell value.
   * @returns {*}
   */
  getOldValue() {
    return this._cell.getOldValue()
  }

  /**
   * Get the initial cell value captured during construction.
   * @returns {*}
   */
  getInitialValue() {
    return this._cell.initialValue
  }

  /**
   * Get the DOM element for this cell.
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._cell.getElement()
  }

  /**
   * Get the row component this cell belongs to.
   * @returns {object}
   */
  getRow() {
    return this._cell.row.getComponent()
  }

  /**
   * Get row data for this cell.
   * @param {string|boolean} [transform] Optional transform lookup key.
   * @returns {object}
   */
  getData(transform) {
    return this._cell.row.getData(transform)
  }

  /**
   * Get this component type.
   * @returns {string}
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
   * @returns {object}
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
   * @returns {object}
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
}
