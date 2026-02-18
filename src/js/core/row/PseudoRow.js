export default class PseudoRow {
  constructor(type) {
    this.type = type
    this.element = this._createElement()
  }

  _createElement() {
    const element = document.createElement('div')
    element.classList.add('tabulator-row')
    return element
  }

  getElement() {
    return this.element
  }

  getComponent() {
    return false
  }

  getData() {
    return {}
  }

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
