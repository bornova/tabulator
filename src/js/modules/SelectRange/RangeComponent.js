export default class RangeComponent {
  constructor(range) {
    this._range = range

    return new Proxy(this, {
      get(target, name, receiver) {
        if (Reflect.has(target, name)) {
          return Reflect.get(target, name, receiver)
        }

        return target._range.table.componentFunctionBinder.handle('range', target._range, name)
      }
    })
  }

  _resolveCell(cell) {
    return cell ? cell._cell : cell
  }

  getElement() {
    return this._range.element
  }

  getData() {
    return this._range.getData()
  }

  getCells() {
    return this._range.getCells(true, true)
  }

  getStructuredCells() {
    return this._range.getStructuredCells()
  }

  getRows() {
    return this._range.getRows().map((row) => row.getComponent())
  }

  getColumns() {
    return this._range.getColumns().map((column) => column.getComponent())
  }

  getBounds() {
    return this._range.getBounds()
  }

  getTopEdge() {
    return this._range.top
  }

  getBottomEdge() {
    return this._range.bottom
  }

  getLeftEdge() {
    return this._range.left
  }

  getRightEdge() {
    return this._range.right
  }

  setBounds(start, end) {
    if (this._range.destroyedGuard('setBounds')) {
      this._range.setBounds(this._resolveCell(start), this._resolveCell(end))
    }
  }

  setStartBound(start) {
    if (this._range.destroyedGuard('setStartBound')) {
      this._range.setEndBound(this._resolveCell(start))
      this._range.rangeManager.layoutElement()
    }
  }

  setEndBound(end) {
    if (this._range.destroyedGuard('setEndBound')) {
      this._range.setEndBound(this._resolveCell(end))
      this._range.rangeManager.layoutElement()
    }
  }

  clearValues() {
    if (this._range.destroyedGuard('clearValues')) {
      this._range.clearValues()
    }
  }

  remove() {
    if (this._range.destroyedGuard('remove')) {
      this._range.destroy(true)
    }
  }
}
