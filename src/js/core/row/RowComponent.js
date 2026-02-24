// public row object
export default class RowComponent {
  /**
   * @param {object} row Internal Row instance.
   * @returns {RowComponent}
   */
  constructor(row) {
    this._row = row

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (name in target) {
          return target[name]
        }

        return target._row.table.componentFunctionBinder.handle('row', target._row, name)
      }
    })
  }

  /**
   * Get row data.
   * @param {string|boolean} [transform] Optional transform lookup key.
   * @returns {object}
   */
  getData(transform) {
    return this._row.getData(transform)
  }

  /**
   * Get the row DOM element.
   * @returns {HTMLElement|boolean}
   */
  getElement() {
    return this._row.getElement()
  }

  /**
   * Get all cell components in this row.
   * @returns {Array<object>}
   */
  getCells() {
    return this._row.getCells().map((cell) => cell.getComponent())
  }

  /**
   * Get a cell component by column lookup.
   * @param {*} column Column lookup accepted by column manager.
   * @returns {object|boolean}
   */
  getCell(column) {
    const cell = this._row.getCell(column)
    return cell ? cell.getComponent() : false
  }

  /**
   * Get the row index value.
   * @returns {*}
   */
  getIndex() {
    return this._row.getData('data')[this._row.table.options.index]
  }

  /**
   * Get current row display position.
   * @returns {number|boolean}
   */
  getPosition() {
    return this._row.getPosition()
  }

  /**
   * Subscribe to row position changes.
   * @param {Function} callback Position update callback.
   */
  watchPosition(callback) {
    return this._row.watchPosition(callback)
  }

  /**
   * Delete this row.
   * @returns {Promise<void>}
   */
  delete() {
    return this._row.delete()
  }

  /**
   * Scroll this row into view.
   * @param {string} [position] Scroll alignment position.
   * @param {boolean} [ifVisible] Only scroll if not visible when true.
   * @returns {Promise<void>|boolean}
   */
  scrollTo(position, ifVisible) {
    return this._row.table.rowManager.scrollToRow(this._row, position, ifVisible)
  }

  /**
   * Move this row relative to another row.
   * @param {*} to Target row lookup.
   * @param {boolean} [after] Insert after target when true.
   */
  move(to, after) {
    this._row.moveToRow(to, after)
  }

  /**
   * Update this row's data.
   * @param {object|string} data Partial update object or serialized JSON.
   * @returns {Promise<void>}
   */
  update(data) {
    return this._row.updateData(data)
  }

  /**
   * Force row height normalization.
   */
  normalizeHeight() {
    this._row.normalizeHeight(true)
  }

  /**
   * Get internal row instance.
   * @returns {object}
   */
  _getSelf() {
    return this._row
  }

  /**
   * Reinitialize row formatting and layout.
   */
  reformat() {
    return this._row.reinitialize()
  }

  /**
   * Get parent table instance.
   * @returns {object}
   */
  getTable() {
    return this._row.table
  }

  /**
   * Get the next displayed row component.
   * @returns {object|boolean}
   */
  getNextRow() {
    const row = this._row.nextRow()
    return row ? row.getComponent() : row
  }

  /**
   * Get the previous displayed row component.
   * @returns {object|boolean}
   */
  getPrevRow() {
    const row = this._row.prevRow()
    return row ? row.getComponent() : row
  }
}
