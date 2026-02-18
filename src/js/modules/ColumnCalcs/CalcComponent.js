export default class CalcComponent {
  /**
   * @param {object} row Internal calc row instance.
   * @returns {CalcComponent}
   */
  constructor(row) {
    this._row = row

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (typeof target[name] !== 'undefined') {
          return target[name]
        }

        return target._row.table.componentFunctionBinder.handle('row', target._row, name)
      }
    })
  }

  /**
   * Get calc row data.
   * @param {string|boolean} [transform] Optional transform lookup key.
   * @returns {object}
   */
  getData(transform) {
    return this._row.getData(transform)
  }

  /**
   * Get the calc row DOM element.
   * @returns {HTMLElement|boolean}
   */
  getElement() {
    return this._row.getElement()
  }

  /**
   * Get parent table instance.
   * @returns {object}
   */
  getTable() {
    return this._row.table
  }

  /**
   * Get cell components in this calc row.
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
   * Get internal row instance.
   * @returns {object}
   */
  _getSelf() {
    return this._row
  }
}
