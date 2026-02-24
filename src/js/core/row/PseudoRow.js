const EMPTY_ROW_DATA = Object.freeze({})

export default class PseudoRow {
  /**
   * @param {string} type Pseudo row type.
   */
  constructor(type) {
    this.type = type
    this.element = this._createElement()
  }

  /**
   * Create row element.
   * @returns {HTMLDivElement}
   */
  _createElement() {
    const element = document.createElement('div')
    element.classList.add('tabulator-row')
    return element
  }

  /**
   * Get row element.
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element
  }

  /**
   * Get row component placeholder.
   * @returns {boolean}
   */
  getComponent() {
    return false
  }

  /**
   * Get row data placeholder.
   * @returns {object}
   */
  getData() {
    return EMPTY_ROW_DATA
  }

  /**
   * Get row height.
   * @returns {number}
   */
  getHeight() {
    return this.element.offsetHeight
  }

  initialize() {}

  reinitialize() {}

  normalizeHeight() {}

  generateCells() {}

  reinitializeHeight() {}

  calcHeight() {}

  setCellHeight() {}

  clearCellHeight() {}

  rendered() {}
}
