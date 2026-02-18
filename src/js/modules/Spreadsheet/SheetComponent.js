export default class SheetComponent {
  /**
   * @param {object} sheet Internal sheet instance.
   * @returns {SheetComponent}
   */
  constructor(sheet) {
    this._sheet = sheet

    return new Proxy(this, {
      get(target, name, receiver) {
        if (Reflect.has(target, name)) {
          return Reflect.get(target, name, receiver)
        }

        return target._sheet.table.componentFunctionBinder.handle('sheet', target._sheet, name)
      }
    })
  }

  /**
   * Get sheet title.
   * @returns {string}
   */
  getTitle() {
    return this._sheet.title
  }

  /**
   * Get sheet key.
   * @returns {*}
   */
  getKey() {
    return this._sheet.key
  }

  /**
   * Get sheet definition.
   * @returns {object}
   */
  getDefinition() {
    return this._sheet.getDefinition()
  }

  /**
   * Get sheet data.
   * @returns {*}
   */
  getData() {
    return this._sheet.getData()
  }

  /**
   * Replace sheet data.
   * @param {*} data Sheet data payload.
   * @returns {Promise<void>|void}
   */
  setData(data) {
    return this._sheet.setData(data)
  }

  /**
   * Clear sheet content.
   * @returns {Promise<void>|void}
   */
  clear() {
    return this._sheet.clear()
  }

  /**
   * Remove this sheet.
   * @returns {Promise<void>|void}
   */
  remove() {
    return this._sheet.remove()
  }

  /**
   * Activate this sheet.
   * @returns {Promise<void>|void}
   */
  active() {
    return this._sheet.active()
  }

  /**
   * Set sheet title.
   * @param {string} title New title.
   * @returns {Promise<void>|void}
   */
  setTitle(title) {
    return this._sheet.setTitle(title)
  }

  /**
   * Set row definitions for this sheet.
   * @param {Array<object>} rows Row definitions.
   * @returns {Promise<void>|void}
   */
  setRows(rows) {
    return this._sheet.setRows(rows)
  }

  /**
   * Set column definitions for this sheet.
   * @param {Array<object>} columns Column definitions.
   * @returns {Promise<void>|void}
   */
  setColumns(columns) {
    return this._sheet.setColumns(columns)
  }
}
