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
    return {}
  }

  /**
   * Get row height.
   * @returns {number}
   */
  getHeight() {
    return this.element.offsetHeight
  }

  /** @returns {void} */
  initialize() {}

  /** @returns {void} */
  reinitialize() {}

  /** @returns {void} */
  normalizeHeight() {}

  /** @returns {void} */
  generateCells() {}

  /** @returns {void} */
  reinitializeHeight() {}

  /** @returns {void} */
  calcHeight() {}

  /** @returns {void} */
  setCellHeight() {}

  /** @returns {void} */
  clearCellHeight() {}

  /** @returns {void} */
  rendered() {}
}
